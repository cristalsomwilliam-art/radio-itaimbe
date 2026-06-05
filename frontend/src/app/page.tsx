"use client";

import React, { useEffect, useState, useRef } from "react";
import { Tv, Users, Music, ChevronRight, Share2, Play, Pause, MessageCircle, Star, Newspaper, Radio, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAudio } from "@/context/AudioContext";
import TvPlayer from "@/components/TvPlayer";
import CustomChat from "@/components/CustomChat";
import Visualizer from "@/components/Visualizer";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

interface StreamStatus {
  tv_online: boolean;
  tv_viewers_count: number;
  tv_stream_title: string;
  current_song: string;
  current_artist: string;
  album_art: string | null;
  listeners_count: number;
  next_song: string | null;
  song_history: Array<{ title: string; artist: string; time: string }>;
  show_logo_overlay: boolean;
}

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link: string | null;
}

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  image_url: string | null;
  published_at: string;
}

export default function Home() {
  const { isPlaying, togglePlay, pause: pauseRadio } = useAudio();
  const prevTvOnlineRef = useRef<boolean | null>(null);
  const [status, setStatus] = useState<StreamStatus>({
    tv_online: false,
    tv_viewers_count: 0,
    tv_stream_title: "Transmissão Especial",
    current_song: "Programação Musical",
    current_artist: "Rádio Itaimbé 87.9 FM",
    album_art: null,
    listeners_count: 0,
    next_song: null,
    song_history: [],
    show_logo_overlay: true,
  });

  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // URLs Públicas do Owncast configuradas pelo túnel Cloudflare
  const owncastStreamUrl = "https://tv.radioitaimbe.com.br/hls/stream.m3u8";
  const owncastChatUrl = "https://tv.radioitaimbe.com.br/embed/chat/readwrite";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Carregar status do streaming
        const { data: statusData } = await supabase
          .from("stream_status")
          .select("*")
          .eq("id", "main")
          .single();

        if (statusData) {
          setStatus(statusData as StreamStatus);
        }
      } catch (err) {
        console.error("Erro ao carregar status inicial:", err);
      }

      try {
        // 2. Carregar Banners
        const { data: bannersData } = await supabase
          .from("banners")
          .select("*")
          .eq("active", true)
          .limit(3);

        if (bannersData) {
          setBanners(bannersData as Banner[]);
        }
      } catch (err) {
        console.error("Erro ao carregar banners iniciais:", err);
      }

      setIsLoading(false);
    };

    fetchData();

    // 4. Inscrição em tempo real para mudanças de status de transmissão
    const statusSubscription = supabase
      .channel("stream_status_home")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stream_status",
          filter: "id=eq.main",
        },
        (payload) => {
          console.log("Status atualizado via Realtime:", payload.new);
          setStatus(payload.new as StreamStatus);
        }
      )
      .subscribe();

    // 5. Polling de Fallback a cada 5 segundos para caso de falha no Realtime
    const pollingInterval = setInterval(async () => {
      try {
        const { data: statusData, error } = await supabase
          .from("stream_status")
          .select("*")
          .eq("id", "main")
          .single();

        if (statusData && !error) {
          setStatus((prev) => {
            // Só atualizar se houver mudanças para evitar re-renderizações desnecessárias
            if (
              prev.tv_online !== statusData.tv_online ||
              prev.tv_viewers_count !== statusData.tv_viewers_count ||
              prev.tv_stream_title !== statusData.tv_stream_title ||
              prev.current_song !== statusData.current_song ||
              prev.current_artist !== statusData.current_artist ||
              JSON.stringify(prev.song_history) !== JSON.stringify(statusData.song_history)
            ) {
              console.log("Status atualizado via Polling:", statusData);
              return statusData as StreamStatus;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Erro no polling de status:", err);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(statusSubscription);
      clearInterval(pollingInterval);
    };
  }, []);

  // Monitorar início e fim da TV ao vivo para controle de transição automática
  useEffect(() => {
    if (isLoading) return;

    if (prevTvOnlineRef.current !== null && prevTvOnlineRef.current !== status.tv_online) {
      if (status.tv_online) {
        // Live começou: silenciar o streaming da rádio
        pauseRadio();
      } else {
        // Live terminou: recarregar a página para voltar para a rádio ao vivo
        window.location.reload();
      }
    }
    prevTvOnlineRef.current = status.tv_online;
  }, [status.tv_online, isLoading, pauseRadio]);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* 1. SEÇÃO DE TRANSMISSÃO PRINCIPAL */}
      <section className="w-full">
        {isLoading ? (
          <div className="w-full h-[380px] md:h-[480px] bg-zinc-900/30 border border-zinc-800/40 rounded-3xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#e81e4d] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Sincronizando sinal...</span>
          </div>
        ) : status.tv_online ? (
          /* MODO TV AO VIVO COM CHAT */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <h1 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-wider text-glow">
                    TV ITAIMBÉ AO VIVO
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-zinc-400 font-medium mt-1">
                  Assistindo agora: <span className="text-white font-semibold">{status.tv_stream_title}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full self-start">
                <div className="flex items-center gap-1.5 text-red-400">
                  <Users className="w-4 h-4 animate-pulse" />
                  <span>{status.tv_viewers_count} assistindo</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lado Esquerdo: Player + Sidebar Horizontal */}
              <div className="lg:col-span-2 space-y-6">
                <TvPlayer streamUrl={owncastStreamUrl} showOverlay={status.show_logo_overlay} />
                <Sidebar songHistory={status.song_history} layout="horizontal" />
              </div>
              {/* Lado Direito: Chat Customizado */}
              <div className="lg:col-span-1 h-full">
                <CustomChat />
              </div>
            </div>
          </div>
        ) : (
          /* MODO RÁDIO AUTOMÁTICO (Mockup Grid de Alta Fidelidade) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CARD PRINCIPAL DA RÁDIO (Esquerda, 2 colunas) */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#270b47] via-[#110423] to-[#04010b] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between shadow-2xl shadow-purple-950/10 min-h-[380px] md:min-h-[440px]">
              {/* Bubbles de luz decorativas */}
              <div className="absolute top-10 left-1/4 w-32 h-32 bg-[#e81e4d]/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

              {/* Informações e Controles (Lado Esquerdo) */}
              <div className="flex-1 flex flex-col justify-between h-full z-10 w-full">
                <div>
                  {/* Badge Ao Vivo */}
                  <div className="inline-flex items-center gap-2 bg-[#e81e4d]/15 border border-[#e81e4d]/30 text-[#e81e4d] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-[#e81e4d] rounded-full animate-pulse"></span>
                    Ao Vivo Agora
                  </div>

                  {/* Nome da Rádio */}
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mt-5 uppercase tracking-tight">
                    RÁDIO <br />
                    <span className="bg-gradient-to-r from-white via-zinc-100 to-[#e81e4d] bg-clip-text text-transparent">
                      ITAIMBÉ FM
                    </span>
                  </h1>

                  {/* Slogan */}
                  <div className="flex items-center gap-2 text-zinc-400 mt-2">
                    <span className="text-[#e81e4d] text-sm animate-pulse">⚡</span>
                    <p className="text-xs md:text-sm font-semibold tracking-wide">
                      Conectando você com o que há de melhor!
                    </p>
                  </div>
                </div>

                {/* Caixa de Música Atual Glassmorphic */}
                <div className="mt-8 bg-zinc-950/45 border border-white/5 rounded-2xl p-4 backdrop-blur-md max-w-sm w-full shadow-lg shadow-black/40">
                  <span className="text-[9px] font-extrabold text-[#e81e4d] uppercase tracking-widest block mb-1">
                    Música atual:
                  </span>
                  <p className="text-xs md:text-sm font-black text-white line-clamp-2 leading-relaxed">
                    {status.current_song || "Programação Musical"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold tracking-wide mt-1 truncate">
                    {status.current_artist || "Lançamento 2026"}
                  </p>
                </div>

                {/* Controles de Play e Compartilhar */}
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={togglePlay}
                    className="bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] hover:scale-105 active:scale-95 transition-all text-white text-xs font-black px-7 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-pink-500/25 uppercase tracking-wider"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Pausar Rádio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white translate-x-0.5" />
                        <span>Ouvir Agora</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Rádio Itaimbé 87.9 FM",
                          text: "Ouça a Rádio Itaimbé ao vivo!",
                          url: window.location.origin,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.origin);
                        alert("Link copiado!");
                      }
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white p-3.5 rounded-full border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visualizador de Áudio Circular (Lado Direito) */}
              <div className="flex flex-col items-center justify-center w-full md:w-auto z-10">
                <Visualizer />
                
                {/* Badge de Modo */}
                <div className="mt-2 inline-flex items-center gap-1.5 bg-zinc-950/60 border border-white/5 text-zinc-300 text-[8px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  <span className="w-1.5 h-1.5 bg-[#e81e4d] rounded-full animate-pulse"></span>
                  Modo Rádio Automático
                </div>
              </div>

            </div>

            {/* SIDEBAR DA DIREITA (1 coluna) */}
            <div className="lg:col-span-1">
              <Sidebar songHistory={status.song_history} layout="vertical" />
            </div>

          </div>
        )}
      </section>

      {/* 2. SPONSOR/PUBLICIDADE BANNERS */}
      {banners.length > 0 && (
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <a
                key={banner.id}
                href={banner.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-28 rounded-2xl overflow-hidden border border-zinc-800/40 group hover:border-zinc-700/50 transition-all shadow-lg"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex items-end p-4">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider leading-tight">{banner.title}</h4>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 3. 4 CARDS DE AÇÕES RÁPIDAS (Estilo Mockup) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rádio ao Vivo */}
        <div className="bg-zinc-950/65 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-[#e81e4d] group-hover:scale-105 transition-transform duration-300">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Rádio Ao Vivo
            </h4>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              24h de programação sem parar
            </p>
          </div>
        </div>

        {/* Card 2: Programação */}
        <Link
          href="/programacao"
          className="bg-zinc-950/65 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-300">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Programação
            </h4>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Confira nossa grade completa
            </p>
          </div>
        </Link>

        {/* Card 3: Notícias */}
        <Link
          href="/noticias"
          className="bg-zinc-950/65 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Notícias
            </h4>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Fique por dentro das novidades
            </p>
          </div>
        </Link>

        {/* Card 4: Participe */}
        <a
          href="https://wa.me/555535541179?text=Olá!%20Quero%20participar%20da%20programação!"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-950/65 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-105 transition-transform duration-300">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              Participe
            </h4>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Envie recado e faça seu pedido
            </p>
          </div>
        </a>
      </section>

      {/* 4. SEÇÃO DE PORTAIS DE NOTÍCIAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h2 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-2">
            <span className="w-1 h-5 bg-[#e81e4d] rounded"></span>
            Portal de Notícias
          </h2>
          <Link
            href="/noticias"
            className="text-[10px] font-extrabold text-[#e81e4d] hover:text-pink-400 transition-colors uppercase tracking-wider flex items-center gap-0.5"
          >
            Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* G1 */}
          <a
            href="https://g1.globo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel rounded-2xl overflow-hidden group hover:border-red-500/40 flex flex-col h-full shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              <img
                src="/g1_cover.png"
                alt="G1 - Globo"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-550 brightness-90"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-black/70 backdrop-blur-md text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider border border-white/10">
                  Geral & Regional
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-[#e81e4d] transition-colors line-clamp-1 leading-tight">
                  G1 - Globo
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-1">
                  Notícias em tempo real sobre o Brasil, o mundo, economia, tecnologia, saúde e esportes.
                </p>
              </div>
              <div className="text-[9px] text-[#e81e4d] font-bold uppercase tracking-wider mt-3.5 flex items-center gap-1">
                Acessar Portal <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </a>

          {/* Jovem Pan */}
          <a
            href="https://jovempan.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel rounded-2xl overflow-hidden group hover:border-rose-500/40 flex flex-col h-full shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              <img
                src="/jovem_pan_cover.png"
                alt="Jovem Pan News"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-550 brightness-90"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-black/70 backdrop-blur-md text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider border border-white/10">
                  Política & Opinião
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-[#e81e4d] transition-colors line-clamp-1 leading-tight">
                  Jovem Pan News
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-1">
                  Debates, análises políticas em tempo real, esportes, entretenimento e transmissões ao vivo.
                </p>
              </div>
              <div className="text-[9px] text-[#e81e4d] font-bold uppercase tracking-wider mt-3.5 flex items-center gap-1">
                Acessar Portal <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </a>

          {/* Revista Oeste */}
          <a
            href="https://revistaoeste.com"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel rounded-2xl overflow-hidden group hover:border-yellow-500/40 flex flex-col h-full shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              <img
                src="/revista_oeste_cover.png"
                alt="Revista Oeste"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-550 brightness-90"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-black/70 backdrop-blur-md text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider border border-white/10">
                  Análises & Economia
                </span>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-[#e81e4d] transition-colors line-clamp-1 leading-tight">
                  Revista Oeste
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-1">
                  Jornalismo independente com análises sobre política, economia, defesa do livre mercado.
                </p>
              </div>
              <div className="text-[9px] text-[#e81e4d] font-bold uppercase tracking-wider mt-3.5 flex items-center gap-1">
                Acessar Portal <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
