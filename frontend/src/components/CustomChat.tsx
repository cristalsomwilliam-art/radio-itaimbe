"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, RefreshCw, LogIn, Send, LogOut, Loader2, Trash2 } from "lucide-react";

interface Profile {
  email?: string;
  full_name: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  profile_id: string;
  profiles: Profile;
}

export default function CustomChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileCache = useRef<Record<string, Profile>>({});

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const formatDisplayName = (name: string) => {
    if (!name) return "Ouvinte";
    const nameLower = name.trim().toLowerCase();
    if (nameLower.includes("cristalsomwilliam")) {
      return "William";
    }
    if (name.includes("@")) {
      return name.split("@")[0]
        .split(/[\._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return name;
  };

  // 1. Monitorar estado de autenticação do usuário
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCurrentUserProfile(session.user.id);
      }
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchCurrentUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCurrentUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  };

  // 2. Carregar mensagens iniciais
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          created_at,
          profile_id,
          profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!error && data) {
        // Mapear dados para garantir tipagem correta
        const loadedMessages = (data as any[]).map((msg) => ({
          id: msg.id,
          message: msg.message,
          created_at: msg.created_at,
          profile_id: msg.profile_id,
          profiles: msg.profiles || { full_name: "Ouvinte", avatar_url: null }
        }));
        setMessages(loadedMessages);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchMessages();
  }, []);

  // 3. Subscrever às novas mensagens em tempo real (Supabase Realtime)
  useEffect(() => {
    const channel = supabase
      .channel("chat_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const newMsg = payload.new;
          const senderId = newMsg.profile_id;

          // Buscar dados do perfil do cache ou do banco
          let senderProfile = profileCache.current[senderId];
          if (!senderProfile) {
            const { data } = await supabase
              .from("profiles")
              .select("email, full_name, avatar_url")
              .eq("id", senderId)
              .single();
            
            if (data) {
              senderProfile = data as Profile;
              profileCache.current[senderId] = senderProfile;
            } else {
              senderProfile = { full_name: "Ouvinte", avatar_url: null };
            }
          }

          const mappedMessage: Message = {
            id: newMsg.id,
            message: newMsg.message,
            created_at: newMsg.created_at,
            profile_id: senderId,
            profiles: senderProfile
          };

          setMessages((prev) => [...prev, mappedMessage]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    const messageText = newMessage.trim();
    setIsSending(true);
    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          profile_id: user.id,
          message: messageText
        });

      if (error) throw error;
      setNewMessage("");

      // Obter o token JWT da sessão atual para autenticar na API de encaminhamento
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        // Enviar a mensagem para a API de encaminhamento do Social Stream Ninja em background
        fetch("/api/chat/forward", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            chatname: profile?.full_name || user?.user_metadata?.full_name || "Ouvinte",
            chatmessage: messageText,
            chatimg: profile?.avatar_url || user?.user_metadata?.avatar_url || ""
          })
        }).catch((err) => {
          console.error("Erro ao encaminhar mensagem para o Social Stream Ninja:", err.message);
        });
      }
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Deseja apagar esta mensagem do chat?")) return;
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Erro ao deletar mensagem:", err.message);
      alert("Erro ao excluir mensagem: " + err.message);
    }
  };

  // Adicionar Emoji
  const handleAddEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // 5. Autenticação Social
  const handleSocialLogin = async (provider: "facebook" | "google" | "tiktok") => {
    setLoginLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(`Erro ao logar com ${provider}:`, err.message);
      setLoginLoading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-[500px] lg:h-[680px] bg-zinc-950/80 backdrop-blur-md rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#e81e4d]" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Chat ao Vivo</span>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        )}
      </div>

      {/* Área de Mensagens */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar min-h-0 bg-black/10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-6 h-6 text-[#e81e4d] animate-spin" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Carregando chat...</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = user && msg.profile_id === user.id;
            const isAdminMsg = msg.profiles.email === "cristalsomwilliam@gmail.com";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 relative ${
                  isAdminMsg ? "border-2 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-zinc-800 border border-zinc-700/50"
                }`}>
                  {msg.profiles.avatar_url ? (
                    <img src={msg.profiles.avatar_url} alt={formatDisplayName(msg.profiles.full_name)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                      {formatDisplayName(msg.profiles.full_name).charAt(0)}
                    </div>
                  )}
                </div>

                {/* Conteúdo do Balão */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : ""}`}>
                  <span className={`text-[9px] font-black mb-0.5 px-0.5 flex items-center gap-1 ${
                    isAdminMsg ? "text-amber-400" : "text-zinc-500"
                  }`}>
                    {isAdminMsg && <span className="text-[10px]">👑</span>}
                    {formatDisplayName(msg.profiles.full_name)}
                    {isAdminMsg && (
                      <span className="bg-amber-500/20 text-amber-400 text-[7px] px-1 py-0.2 rounded font-extrabold uppercase border border-amber-500/30">
                        Admin
                      </span>
                    )}
                    {user?.email === "cristalsomwilliam@gmail.com" && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-red-550 hover:text-red-500 ml-1 p-0.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Apagar mensagem"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                  <div
                    className={`px-3 py-2 text-xs rounded-2xl leading-relaxed whitespace-pre-wrap break-all border transition-all ${
                      isAdminMsg
                        ? "bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-[#e81e4d]/5 border-amber-500/30 text-amber-100 shadow-md rounded-tl-none animate-pulse-slow"
                        : isMe
                          ? "bg-[#e81e4d]/10 border-[#e81e4d]/20 text-white rounded-tr-none"
                          : "bg-zinc-900/60 border-zinc-800/80 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-650 text-xs font-semibold uppercase tracking-wider">
            Nenhuma mensagem enviada. Seja o primeiro!
          </div>
        )}
      </div>

      {/* Rodapé / Input de Envio ou Box de Login */}
      <div className="p-4 bg-zinc-900/50 border-t border-zinc-850 flex-shrink-0">
        {isLoading ? null : user ? (
          /* Usuário Logado: Campo de Digitação e Emojis */
          <div className="space-y-2.5">
            {/* Barra de Emojis Rápidos (Facebook Style) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar select-none">
              {["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "🎵", "⚡", "🚀"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-lg hover:bg-white/10 active:scale-90 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem no chat..."
                maxLength={300}
                disabled={isSending}
                className="flex-1 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/60 focus:border-[#e81e4d] focus:ring-0 text-xs text-white rounded-xl px-3.5 py-3 transition-colors outline-none placeholder-zinc-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-[#e81e4d] text-white hover:bg-pink-600 px-4 py-3 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-[#e81e4d] active:scale-95 flex items-center justify-center"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Usuário Deslogado: Botões de Login Social */
          <div className="space-y-3 text-center">
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
              Identifique-se para participar do chat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Botão Facebook */}
              <button
                onClick={() => handleSocialLogin("facebook")}
                disabled={loginLoading !== null}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 text-[#1877F2] font-black text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-98"
              >
                {loginLoading === "facebook" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Facebook</span>
              </button>

              {/* Botão Google */}
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={loginLoading !== null}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-98"
              >
                {loginLoading === "google" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Google</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
