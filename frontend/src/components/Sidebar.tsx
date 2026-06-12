"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Music, Play, MessageCircle, Trash2, LogIn, Loader2, Newspaper, Calendar, X, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import DOMPurify from 'dompurify';

interface SongHistoryItem {
  title: string;
  artist: string;
  time: string;
}

interface SidebarProps {
  songHistory?: SongHistoryItem[];
  layout?: "vertical" | "horizontal";
}

interface MusicRequest {
  id: string;
  name: string;
  song_title: string;
  message?: string;
  status: "pending" | "processing" | "queued" | "not_found" | "error";
  file_path?: string;
  status_message?: string;
  created_at: string;
}

interface ArticleItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
  fullContent?: string;
  portalName: string;
  portalId: string;
}

function formatRequestTime(createdAt: string): string {
  try {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  } catch {
    return "";
  }
}

function getFallbackImageUrl(portalId?: string): string {
  if (portalId === "jovempan") return "/jovem_pan_cover.png";
  if (portalId === "estadao") return "/estadao_cover.png";
  if (portalId === "oeste") return "/revista_oeste_cover.png";
  return "/estadao_cover.png";
}

function formatCooldownTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function isDoubleMeaningName(name: string): boolean {
  if (!name) return false;
  
  // Normalizar: minúsculo, sem acentos, remover caracteres não-letras
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  // Lista de padrões bloqueados (strings normalizadas sem espaços)
  const blacklist = [
    "powerguido",
    "powerguydo",
    "pauerguido",
    "pauerguydo",
    "jalinrab",
    "jalinrrab",
    "jamilk",
    "deidemel",
    "sandygue",
    "jacintoleite",
    "jacintopinto",
    "paulatejano",
    "paulatejando",
    "cucabeludo",
    "tomasturbando",
    "tomasturbano",
    "isadorapinto",
    "oscaralho",
    "hromeupinto",
    "romeupinto",
    "deidecosta",
    "simasturbo",
    "pauloatar",
    "paulolatar",
    "paulobrificado",
    "caiodeboca",
    "miapica",
    "miapika",
    "miapicha",
    "serjaorego",
    "sergiorego",
    "inaciorego",
    "inaciopinto",
    "zoidecu",
    "paulaatras",
    "paulaatraz",
    "elmamaria",
    "elmachips",
    "paulinhamarisa",
    "paulamarisa",
    "kikolindo",
    "kikofofo",
    "kikolouco",
    "kikocu",
    "didecosta",
    "deidecoz",
    "zoiodecu",
    "cuzinho",
    "viado",
    "pauano",
    "pauanorigo",
    "pauinano",
    "jefersoncu",
    "jeffersoncu",
    "miltonrocha",
    "miltinhocharego",
    "miltonrocharego",
    "pautras",
    "paulatezano",
    "paulatezando",
    "isadoraboceta",
    "isadoracuzinho",
    "alancapote",
    "alancaralho",
    "filhodaputa",
    "putaquepariu",
  ];

  const blacklistKeywords = [
    "powerguido",
    "powerguydo",
    "pauerguido",
    "pauerguydo",
    "jalinrab",
    "jalinrrab",
    "jamilk",
    "deidemel",
    "sandygue",
    "cucabeludo",
    "tomasturb",
    "paulatejan",
    "jacintoleit",
    "jacintopint",
    "deidecosta",
    "simasturb",
    "paulobrificad",
    "caiodeboc",
    "kikolind",
  ];

  // 1. Checar correspondência exata ou parcial da string sem espaços
  if (blacklist.some((blocked) => normalized.includes(blocked))) {
    return true;
  }

  // 2. Checar palavras-chave específicas na string normalizada
  if (blacklistKeywords.some((keyword) => normalized.includes(keyword))) {
    return true;
  }

  // 3. Checar combinações fonéticas específicas
  const hasJacinto = normalized.includes("jacinto");
  const hasRego = normalized.includes("rego");
  const hasPinto = normalized.includes("pinto");
  const hasTejano = normalized.includes("tejano") || normalized.includes("tejando");
  const hasPaula = normalized.includes("paula");
  const hasTomas = normalized.includes("tomas");
  const hasTurbando = normalized.includes("turbando") || normalized.includes("turbano");
  const hasCuca = normalized.includes("cuca");
  const hasBeludo = normalized.includes("beludo");

  if (hasJacinto && (hasRego || hasPinto)) return true;
  if (hasPaula && hasTejano) return true;
  if (hasTomas && hasTurbando) return true;
  if (hasCuca && hasBeludo) return true;

  return false;
}

export default function Sidebar({ songHistory, layout = "vertical" }: SidebarProps) {
  const containerClass =
    layout === "horizontal"
      ? "grid grid-cols-1 md:grid-cols-2 gap-5 w-full"
      : "flex flex-col justify-between gap-5 h-full";

  // Mural de pedidos
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSong, setFormSong] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginLoading, setLoginLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [formCity, setFormCity] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    // Esconder o toast automaticamente após 5 segundos
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Estados para busca no catálogo SSD
  const [suggestions, setSuggestions] = useState<{ artist: string; title: string; file_path: string }[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estados para Manchetes / Últimas Notícias
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Disparar eventos para pausar o visualizador de áudio quando um modal estiver aberto
  useEffect(() => {
    if (isModalOpen || !!selectedArticle) {
      window.dispatchEvent(new CustomEvent("modal-open"));
    } else {
      window.dispatchEvent(new CustomEvent("modal-close"));
    }
    return () => {
      window.dispatchEvent(new CustomEvent("modal-close"));
    };
  }, [isModalOpen, selectedArticle]);

  useEffect(() => {
    const fetchAllNews = async () => {
      setIsLoadingNews(true);
      try {
        const [estadaoRes, jpRes, oesteRes] = await Promise.all([
          fetch("/api/news-feed?portal=estadao").then(r => r.json().catch(() => ({ items: [] }))),
          fetch("/api/news-feed?portal=jovempan").then(r => r.json().catch(() => ({ items: [] }))),
          fetch("/api/news-feed?portal=oeste").then(r => r.json().catch(() => ({ items: [] })))
        ]);

        const merged: ArticleItem[] = [
          ...((estadaoRes && estadaoRes.items) || []).map((item: any) => ({ ...item, portalName: "Estadão", portalId: "estadao" })),
          ...((jpRes && jpRes.items) || []).map((item: any) => ({ ...item, portalName: "Jovem Pan", portalId: "jovempan" })),
          ...((oesteRes && oesteRes.items) || []).map((item: any) => ({ ...item, portalName: "Revista Oeste", portalId: "oeste" }))
        ];

        // Ordenar por data (pubDate desc)
        merged.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();
          return dateB - dateA;
        });

        // Pegar as 8 mais recentes
        setArticles(merged.slice(0, 8));
      } catch (err) {
        console.error("Erro ao carregar notícias na Sidebar:", err);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchAllNews();
    // Atualizar a cada 10 minutos
    const interval = setInterval(fetchAllNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitorar cooldown de pedidos de música (3 minutos)
  useEffect(() => {
    const updateCooldown = () => {
      const lastRequestTime = localStorage.getItem("last_request_timestamp");
      if (lastRequestTime) {
        const elapsedMs = Date.now() - parseInt(lastRequestTime, 10);
        const cooldownMs = 3 * 60 * 1000;
        if (elapsedMs < cooldownMs) {
          setCooldownRemaining(Math.ceil((cooldownMs - elapsedMs) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      } else {
        setCooldownRemaining(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar sugestões de música (debounced)
  useEffect(() => {
    if (!formSong.trim() || formSong.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (selectedFilePath) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const words = formSong.trim().split(/\s+/).filter(w => w.length >= 2);
        if (words.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsSearching(false);
          return;
        }

        // Selecionar a palavra mais longa e relevante para buscar no banco (ignorar stopwords)
        const stopwords = ["de", "do", "da", "os", "as", "um", "uns", "uma", "umas", "com", "para", "por", "sem", "sob", "the", "and", "for", "you"];
        const searchWords = words.filter(w => !stopwords.includes(w.toLowerCase()));
        const longestWord = (searchWords.length > 0 ? searchWords : words)
          .reduce((a, b) => (a.length > b.length ? a : b), "");

        const sanitizedWord = longestWord.replace(/[%_\\]/g, '\\$&');

        const { data, error } = await supabase
          .from("music_catalog")
          .select("artist, title, file_path")
          .or(`title.ilike.%${sanitizedWord}%,artist.ilike.%${sanitizedWord}%`)
          .limit(80); // Buscar mais para podermos filtrar no client

        if (error) throw error;
        
        if (data) {
          // Filtrar no client-side para garantir que todos os termos estejam presentes
          const filtered = (data as { artist: string; title: string; file_path: string }[]).filter(item => {
            const combined = `${item.title} ${item.artist}`.toLowerCase();
            return words.every(word => combined.includes(word.toLowerCase()));
          });

          setSuggestions(filtered.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Erro ao buscar sugestões no catálogo:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [formSong, selectedFilePath]);

  useEffect(() => {
    // 1. Carregar os últimos 10 pedidos do banco
    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("music_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (error) throw error;
        if (data) setRequests(data as MusicRequest[]);
      } catch (err) {
        console.error("Erro ao carregar mural de pedidos:", err);
      }
    };

    fetchRequests();

    // Verificar status do usuário atual
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        setIsAdmin(user?.email === "cristalsomwilliam@gmail.com");
        if (user) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("login_attempted");
          }
          setLoginAttempted(false);
          setIsGuest(false);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          
          let nameToSet = "";
          if (profile && profile.full_name) {
            nameToSet = profile.full_name;
          } else if (user.user_metadata && user.user_metadata.full_name) {
            nameToSet = user.user_metadata.full_name;
          } else {
            nameToSet = user.email ? user.email.split("@")[0] : "Ouvinte";
          }
          setFormName(nameToSet);
        } else {
          if (typeof window !== "undefined") {
            const attempted = localStorage.getItem("login_attempted") === "true";
            setLoginAttempted(attempted);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar usuário na Sidebar:", err);
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setIsAdmin(user?.email === "cristalsomwilliam@gmail.com");
      if (user) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("login_attempted");
        }
        setLoginAttempted(false);
        setIsGuest(false);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        let nameToSet = "";
        if (profile && profile.full_name) {
          nameToSet = profile.full_name;
        } else if (user.user_metadata && user.user_metadata.full_name) {
          nameToSet = user.user_metadata.full_name;
        } else {
          nameToSet = user.email ? user.email.split("@")[0] : "Ouvinte";
        }
        setFormName(nameToSet);
      } else {
        setFormName("");
        if (typeof window !== "undefined") {
          const attempted = localStorage.getItem("login_attempted") === "true";
          setLoginAttempted(attempted);
        }
      }
    });

    // 2. Inscrever em tempo real (INSERT, DELETE e UPDATE para monitorar status)
    const channel = supabase
      .channel("music_requests_sidebar")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "music_requests",
        },
        (payload) => {
          setRequests((prev) => [payload.new as MusicRequest, ...prev.slice(0, 9)]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "music_requests",
        },
        (payload) => {
          setRequests((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as MusicRequest) : r))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "music_requests",
        },
        (payload) => {
          setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const handleSocialLogin = async (provider: "facebook" | "google") => {
    setLoginLoading(provider);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("login_attempted", "true");
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
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

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !isGuest) {
      showToast("Você precisa estar autenticado ou preencher os dados como visitante para pedir músicas.", "error");
      return;
    }
    if (!formName.trim() || !formSong.trim()) return;

    // Auto-moderação de nomes de duplo sentido (trolls)
    if (isDoubleMeaningName(formName)) {
      showToast("Por favor, use um nome válido para fazer o seu pedido.", "error");
      return;
    }

    // 1. Limite de tempo por usuário (3 minutos de cooldown) usando Local Storage
    const COOLDOWN_MINUTES = 3;
    const lastRequestTime = localStorage.getItem("last_request_timestamp");
    if (lastRequestTime) {
      const elapsedMs = Date.now() - parseInt(lastRequestTime, 10);
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / 60000);
        showToast(`Você já fez um pedido recentemente. Por favor, aguarde mais ${remainingMinutes} minuto(s) para pedir outra música.`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 2. Prevenir pedidos duplicados da mesma música que já estejam ativos/na fila (ou tocados nos últimos 15 min)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const baseQuery = supabase
        .from("music_requests")
        .select("id, song_title, file_path, status, created_at")
        .or(`status.eq.pending,status.eq.processing,and(status.eq.queued,created_at.gte.${fifteenMinutesAgo})`);
      
      const { data: duplicateRequests, error: dupError } = await (selectedFilePath
        ? baseQuery.eq("file_path", selectedFilePath)
        : baseQuery.ilike("song_title", `%${formSong.trim()}%`));
      if (!dupError && duplicateRequests && duplicateRequests.length > 0) {
        showToast("Esta música já foi pedida recentemente e está na fila para tocar. Por favor, escolha outra música!", "error");
        setIsSubmitting(false);
        return;
      }

      // format name to "Name - City" if city is present
      const nameToSend = isGuest
        ? `${formName.trim()} - ${formCity.trim()}`
        : (formCity.trim() ? `${formName.trim()} - ${formCity.trim()}` : formName.trim());

      // 3. Inserir no Supabase (atualiza o mural via realtime na hora)
      const { error } = await supabase.from("music_requests").insert([
        {
          name: nameToSend,
          song_title: formSong.trim(),
          message: formMessage.trim() || null,
          file_path: selectedFilePath || null,
        },
      ]);

      if (error) throw error;

      // Salvar o timestamp do pedido com sucesso no Local Storage do usuário
      localStorage.setItem("last_request_timestamp", Date.now().toString());
      setCooldownRemaining(180); // 3 minutos de cooldown imediato

      showToast("Pedido enviado com sucesso! Aguarde que em breve a sua música vai tocar na rádio Itaimbé.", "success");

      // Resetar form e fechar modal
      setFormSong("");
      setFormMessage("");
      if (isGuest) {
        setFormName("");
        setFormCity("");
      }
      setSelectedFilePath(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao enviar pedido:", err);
      showToast("Houve um erro ao registrar seu pedido. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este pedido do mural?")) return;
    try {
      const { error } = await supabase
        .from("music_requests")
        .delete()
        .eq("id", id);
      if (error) throw error;
      showToast("Pedido removido com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao apagar pedido:", err);
      showToast("Erro ao excluir o pedido.", "error");
    }
  };

  return (
    <div className={containerClass}>
      {/* Card de Últimas Notícias */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[280px] justify-between">
        <div className="flex flex-col h-full justify-between min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#e81e4d]" />
              <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                Últimas Notícias
              </h3>
            </div>

            <Link
              href="/noticias"
              className="text-[9px] font-black bg-[#e81e4d] text-white hover:bg-pink-600 transition-colors px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-pink-500/10"
            >
              Ver Todas
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-2.5">
            {isLoadingNews ? (
              <div className="flex flex-col items-center justify-center py-12 gap-1.5">
                <Loader2 className="w-5 h-5 text-[#e81e4d] animate-spin" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Carregando notícias...</span>
              </div>
            ) : articles.length > 0 ? (
              articles.map((article, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedArticle(article)}
                  className="flex items-center justify-between gap-3 text-xs py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      <img
                        src={article.imageUrl || getFallbackImageUrl(article.portalId)}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageUrl(article.portalId);
                        }}
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-zinc-100 truncate text-[11px] group-hover:text-[#e81e4d] transition-colors leading-tight">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-black bg-zinc-900 border border-white/10 text-zinc-400 px-1 py-0.2 rounded uppercase">
                          {article.portalName}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-medium">
                          {formatRequestTime(article.pubDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 text-center py-12 font-medium">
                Nenhuma notícia disponível no momento.
              </p>
            )}
          </div>
        </div>
      </div>


      {/* Card Peça Sua Música - Mural de Pedidos */}
      <div className="bg-gradient-to-br from-[#8b5cf6] via-[#4c1d95] to-[#1e1b4b] border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden group flex flex-col justify-between h-[280px]">
        {/* Decorações neon */}
        <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-pink-500/25 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
        <div className="absolute left-[-30px] bottom-[-30px] w-28 h-28 bg-[#22d3ee]/20 rounded-full blur-2xl"></div>

        <div className="z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-pink-400 fill-pink-500/10" />
                <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                  Mural de Pedidos
                </h3>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {requests && requests.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/5 border border-white/5 rounded-xl p-2.5 space-y-1 transition-all hover:bg-white/10 relative group/item"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[10px] text-pink-400 truncate max-w-[100px]">
                        {req.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* Indicador de Status do Pedido no Mural */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          req.status === 'queued' ? 'bg-emerald-400' :
                          req.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                          req.status === 'not_found' ? 'bg-zinc-400' :
                          req.status === 'error' ? 'bg-red-400' :
                          'bg-yellow-400 animate-pulse'
                        }`} title={
                          req.status === 'queued' ? (req.status_message || 'Na fila do RadioBOSS') :
                          req.status === 'processing' ? (req.status_message || 'Processando...') :
                          req.status === 'not_found' ? (req.status_message || 'Música não encontrada no SSD') :
                          req.status === 'error' ? (req.status_message || 'Erro ao processar') :
                          'Aguardando o robô...'
                        }></span>
                        <span className="text-[8px] text-zinc-400 font-bold whitespace-nowrap">
                          {formatRequestTime(req.created_at)}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="text-red-400 hover:text-red-500 transition-colors p-0.5 bg-black/40 rounded border border-white/5 hover:bg-red-950/20 active:scale-90"
                            title="Apagar pedido"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-cyan-300 font-bold">
                      <Music className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{req.song_title}</span>
                    </div>
                    {req.message && (
                      <p className="text-[9px] text-zinc-350 italic font-medium leading-normal break-words">
                        "{req.message}"
                      </p>
                    )}
                    
                    {/* Status e aviso visíveis para o ouvinte */}
                    <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        req.status === 'queued' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        req.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                        req.status === 'not_found' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' :
                        req.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse'
                      }`}>
                        {req.status === 'queued' ? 'Na Fila' :
                         req.status === 'processing' ? 'Processando' :
                         req.status === 'not_found' ? 'Não Encontrada' :
                         req.status === 'error' ? 'Erro' :
                         'Pendente'}
                      </span>
                      <span className="text-[8px] text-zinc-400 font-medium truncate max-w-[170px]" title={req.status_message || ''}>
                        {req.status_message || (
                          req.status === 'queued' ? 'Aguarde que em breve a sua musica vai tocar na radio itaimbé' :
                          req.status === 'processing' ? 'Verificando arquivos no SSD...' :
                          req.status === 'not_found' ? 'Música não encontrada no SSD' :
                          req.status === 'error' ? 'Erro de comunicação local' :
                          'Aguardando processamento...'
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-1">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Mural Vazio</p>
                <p className="text-[9px] text-zinc-500 font-medium">Seja o primeiro a pedir uma música!</p>
              </div>
            )}
          </div>

          {cooldownRemaining > 0 ? (
            <button
              onClick={() => setIsModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isModalOpen}
              aria-label="Ver status de cooldown do pedido de música"
              className="bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700/80 hover:text-white transition-all font-black text-[9px] px-5 py-2.5 rounded-full uppercase tracking-widest self-start flex items-center gap-1.5 shadow-lg shadow-black/20 mt-2 z-10 active:scale-95"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e81e4d]" />
              Liberado em {formatCooldownTime(cooldownRemaining)}
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isModalOpen}
              aria-label="Pedir música e mandar recado"
              className="bg-[#e81e4d] text-white hover:bg-pink-600 transition-all font-black text-[9px] px-5 py-2.5 rounded-full uppercase tracking-widest self-start flex items-center gap-1.5 shadow-lg shadow-black/20 mt-2 z-10 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              Pedir Música
            </button>
          )}
        </div>
      </div>

      {/* Modal de Pedido de Música */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 md:backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-request-title"
            className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="space-y-1">
              <h2 id="modal-request-title" className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                Pedir Música & Mandar Recado
              </h2>
              <p className="text-xs text-zinc-400">
                Seu pedido aparecerá no mural do site em tempo real!
              </p>
            </div>

             {cooldownRemaining > 0 ? (
                <div className="space-y-6 py-4 text-center animate-in fade-in duration-200">
                  <div className="mx-auto w-16 h-16 rounded-full bg-[#e81e4d]/10 border border-[#e81e4d]/20 flex items-center justify-center text-[#e81e4d] animate-pulse">
                    <Music className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Pedido em Cooldown
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                      Para evitar spam e dar oportunidade a todos os ouvintes, você pode pedir outra música após o término do cronômetro.
                    </p>
                  </div>
                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl py-3.5 max-w-[240px] mx-auto">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">
                      Próximo pedido liberado em
                    </span>
                    <span className="text-2xl font-black text-[#e81e4d] tracking-widest font-mono">
                      {formatCooldownTime(cooldownRemaining)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98"
                  >
                    Voltar ao Mural
                  </button>
                </div>
              ) : (currentUser || isGuest) ? (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                      {isGuest ? "Seu Nome (Obrigatório)" : "Seu Nome (Autenticado)"}
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={!isGuest}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={isGuest ? "Digite seu nome" : "Nome do perfil"}
                      className={`w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors ${
                        !isGuest ? "text-zinc-450 cursor-not-allowed bg-zinc-900/50" : ""
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Sua Cidade (Obrigatório)</label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="Digite sua cidade (ex: Cambará do Sul)"
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Música & Artista</label>
                    <input
                      type="text"
                      required
                      value={formSong}
                      onChange={(e) => {
                        setFormSong(e.target.value);
                        setSelectedFilePath(null);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Ex: Imagine - John Lennon"
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors pr-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-[34px] flex items-center">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#e81e4d]/20 border-t-[#e81e4d] animate-spin"></span>
                      </div>
                    )}
                    {/* Lista de Sugestões de Autocomplete */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-[65px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[10000] max-h-48 overflow-y-auto animate-in fade-in duration-100">
                        {suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormSong(`${sug.title} - ${sug.artist}`);
                              setSelectedFilePath(sug.file_path);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-b-0 flex flex-col transition-colors"
                          >
                            <span className="font-bold text-white text-[11px]">{sug.title}</span>
                            <span className="text-[9px] text-zinc-500 mt-0.5">{sug.artist}</span>
                          </button>
                        ))}
                        <div className="px-4 py-2 bg-zinc-900/50 text-[8px] text-zinc-500 font-bold uppercase tracking-wider border-t border-white/5 text-center">
                          Música verificada no SSD da Rádio
                        </div>
                      </div>
                    )}
                    {/* Caso de busca vazia ou customizada */}
                    {showSuggestions && suggestions.length === 0 && formSong.trim().length >= 2 && !isSearching && (
                      <div className="absolute left-0 right-0 top-[65px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl p-3 z-[10000] animate-in fade-in duration-100 text-[10px] text-zinc-400">
                        <p className="font-semibold text-zinc-300">Nenhum resultado exato no catálogo.</p>
                        <p className="text-[9px] text-zinc-500 mt-1 leading-normal">
                          Você pode enviar assim mesmo! Nosso robô tentará encontrar o arquivo aproximado no SSD.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Recado / Mensagem (Opcional)</label>
                    <textarea
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder="Mande um abraço para alguém especial..."
                      rows={3}
                      maxLength={250}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-[#e81e4d] hover:bg-pink-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? "Enviando..." : "Pedir Música"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 py-2 text-center">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Para pedir músicas e mandar recados no mural, identifique-se usando sua rede social ou clique abaixo para pedir sem login.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {/* Botão Facebook */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("facebook")}
                      disabled={loginLoading !== null}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1877F2]/10 border border-[#1877F2]/20 hover:bg-[#1877F2]/20 text-[#1877F2] font-black text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-98"
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
                      type="button"
                      onClick={() => handleSocialLogin("google")}
                      disabled={loginLoading !== null}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-98"
                    >
                      {loginLoading === "google" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      <span>Google</span>
                    </button>

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-3 text-[8px] text-zinc-600 font-bold uppercase tracking-wider">ou</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    {/* Botão Visitante */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsGuest(true);
                        setFormName("");
                        setFormCity("");
                      }}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-98"
                    >
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pedir como Visitante (Sem Login)</span>
                    </button>
                  </div>
                  
                  {loginAttempted && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-left mt-2 animate-in fade-in duration-200">
                      <p className="text-[10px] text-amber-400 font-bold leading-normal">
                        Teve dificuldades para entrar com a rede social? Não se preocupe! Você pode clicar no botão "Pedir como Visitante" acima para pedir sua música sem precisar de login.
                      </p>
                    </div>
                  )}

                  <p className="text-[9px] text-zinc-500 leading-normal mt-2 text-center">
                    * Nota: Ao logar com o Facebook, certifique-se de manter a permissão de <strong>E-mail</strong> ativa para que o cadastro seja concluído.
                  </p>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-450 hover:text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Notícia */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/85 md:backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-news-title"
            className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            
            {/* Topo / Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0">
              <span className="bg-[#e81e4d]/10 border border-[#e81e4d]/20 text-[#e81e4d] text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                {selectedArticle.portalName}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Fechar modal de notícia"
                className="text-zinc-400 hover:text-white transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-full"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar my-4 space-y-4 min-h-0">
              <h2 id="modal-news-title" className="text-base md:text-xl font-black text-white leading-snug">
                {selectedArticle.title}
              </h2>
              
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 font-bold uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Publicado em {
                    (() => {
                      try {
                        const date = new Date(selectedArticle.pubDate);
                        if (isNaN(date.getTime())) return selectedArticle.pubDate;
                        return date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                      } catch {
                        return selectedArticle.pubDate;
                      }
                    })()
                  }
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-zinc-900 flex-shrink-0">
                <img
                  src={selectedArticle.imageUrl || getFallbackImageUrl(selectedArticle.portalId)}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageUrl(selectedArticle.portalId);
                  }}
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                {selectedArticle.fullContent ? (
                  <div
                    className="news-content-body text-xs md:text-sm text-zinc-350 font-normal leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.fullContent, {
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'blockquote', 'figure', 'figcaption', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption', 'sup', 'sub', 'pre', 'code', 'hr'],
                      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'title', 'width', 'height', 'loading'],
                      ALLOW_DATA_ATTR: false,
                    }) }}
                  />
                ) : (
                  <p className="text-xs md:text-sm text-zinc-355 font-normal leading-relaxed whitespace-pre-line">
                    {selectedArticle.description || "Nenhum resumo disponível para esta notícia."}
                  </p>
                )}
              </div>
            </div>

            {/* Botões do Rodapé */}
            <div className="pt-4 border-t border-white/5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-full py-3 bg-[#e81e4d] hover:bg-pink-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98 text-center"
              >
                Voltar à Rádio
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification Premium */}
      {toast && (
        <div className="fixed top-5 right-5 left-5 md:left-auto z-[10005] animate-in slide-in-from-top-5 duration-300 md:max-w-sm">
          <div className={`backdrop-blur-md border px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 w-full ${
            toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10' :
            toast.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-300 shadow-red-500/10' :
            'bg-zinc-950/80 border-white/10 text-zinc-300 shadow-black/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-400 animate-pulse' :
              toast.type === 'error' ? 'bg-red-400 animate-pulse' :
              'bg-cyan-400 animate-pulse'
            }`}></span>
            <p className="text-[11px] font-bold leading-normal">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
