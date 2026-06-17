"use client";

import React, { useEffect, useState, useRef } from "react";
import { Tv, Users, Music, ChevronRight, Share2, Play, Pause, MessageCircle, Star, Newspaper, Radio, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAudio } from "@/context/AudioContext";
import TvPlayer from "@/components/TvPlayer";
import CustomChat from "@/components/CustomChat";
import Visualizer from "@/components/Visualizer";
import NewsCard from "@/components/NewsCard";
import RequestsCard from "@/components/RequestsCard";
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
  const { isPlaying, togglePlay, pause: pauseRadio, volume, changeVolume, isMuted, toggleMute, streamStatus } = useAudio();
  const prevTvOnlineRef = useRef<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Consumir o status global unificado do AudioContext
  const status = streamStatus;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para o banner de patrocínio rotativo com transição suave
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  // URLs Públicas do Owncast configuradas pelo túnel Cloudflare
  const owncastStreamUrl = "https://tv.radioitaimbe.com.br/hls/stream.m3u8";
  const owncastChatUrl = "https://tv.radioitaimbe.com.br/embed/chat/readwrite";

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        // Carregar Banners (limite estendido para rotacionar patrocinadores)
        const { data: bannersData } = await supabase
          .from("banners")
          .select("*")
          .eq("active", true)
          .limit(20);

        if (bannersData) {
          setBanners(bannersData as Banner[]);
        }
      } catch (err) {
        console.error("Erro ao carregar banners iniciais:", err);
      }
      setIsLoading(false);
    };

    fetchBanners();
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

  // Efeito para rotacionar os banners de patrocínio a cada 12 segundos com um fade-out/fade-in suave
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setIsBannerVisible(false);
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        setIsBannerVisible(true);
      }, 500); // tempo correspondente à transição de opacidade CSS (500ms)
    }, 12000); // 12 segundos de exibição por patrocinador

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="space-y-10 md:space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RadioStation",
            "name": "Rádio Itaimbé",
            "alternateName": "Rádio Itaimbé 87.9 FM",
            "url": "https://www.radioitaimbe.com.br",
            "logo": "https://www.radioitaimbe.com.br/favicon.png",
            "image": "https://images.unsplash.com/photo-1610116306796-6ebd30d779c6?q=80&w=1200",
            "description": "Acompanhe a Rádio Itaimbé 87.9 FM ao vivo com transmissão de áudio e a TV Itaimbé com programação ao vivo em vídeo, notícias e eventos locais.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Cambará do Sul",
              "addressRegion": "RS",
              "addressCountry": "BR"
            },
            "location": {
              "@type": "Place",
              "name": "Rádio Itaimbé 87.9 FM"
            }
          })
        }}
      />
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lado Esquerdo: Player + Chat Mobile + Sidebar Horizontal */}
              <div className="lg:col-span-2 space-y-6">
                <TvPlayer streamUrl={owncastStreamUrl} showOverlay={status.show_logo_overlay} />
                
                {isMobile ? (
                  <>
                    {/* No Celular: Mural de Pedidos fica imediatamente abaixo do Player de Vídeo */}
                    <RequestsCard mode="tv" />
                    
                    {/* Depois vem o Chat */}
                    <CustomChat />
                    
                    {/* E por último as Últimas Notícias */}
                    <NewsCard />
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                    {/* No Desktop: Notícias e Mural lado a lado */}
                    <NewsCard />
                    <RequestsCard mode="tv" />
                  </div>
                )}
              </div>
              {/* Lado Direito: Chat Customizado (Desktop) */}
              <div className="lg:col-span-1 h-full">
                {!isMobile && <CustomChat />}
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

                {/* Controles de Play, Compartilhar e Patrocinadores */}
                <div className="flex flex-col gap-5 mt-6 w-full">
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={togglePlay}
                      className={`bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] active:scale-95 transition-all text-white text-xs font-black px-7 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-pink-500/25 uppercase tracking-wider ${
                        isPlaying ? "hover:scale-105" : "animate-play-pulse"
                      }`}
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
                      className="bg-white/5 hover:bg-white/10 text-white p-3.5 rounded-full border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center flex-shrink-0"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Barra de volume */}
                  <div className="flex items-center gap-3 bg-zinc-950/40 border border-white/5 px-4 py-2.5 rounded-full w-full max-w-[240px] shadow-lg shadow-black/20 backdrop-blur-md">
                    <button
                      onClick={toggleMute}
                      className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full flex-shrink-0"
                      title={isMuted ? "Ativar som" : "Desativar som"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-[#e81e4d]" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-zinc-300" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => changeVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e81e4d]"
                      style={{
                        background: `linear-gradient(to right, #e81e4d 0%, #e81e4d ${
                          (isMuted ? 0 : volume) * 100
                        }%, #27272a ${(isMuted ? 0 : volume) * 100}%, #27272a 100%)`,
                      }}
                    />
                    <span className="text-[10px] text-zinc-400 font-bold min-w-[28px] text-right flex-shrink-0">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>

                  {/* Patrocinador rotativo de alta visibilidade abaixo do play */}
                  {banners.length > 0 && banners[currentBannerIndex] && (
                    <div className="w-full flex items-center justify-start min-w-0">
                      <a
                        href={banners[currentBannerIndex].link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`relative w-full max-w-[320px] h-14 md:h-[72px] rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 shadow-md group flex-shrink-0 ${
                          isBannerVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        }`}
                        title={banners[currentBannerIndex].title}
                      >
                        <img
                          src={banners[currentBannerIndex].image_url}
                          alt={banners[currentBannerIndex].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </a>
                    </div>
                  )}
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
              {isMobile ? (
                <>
                  {/* No Celular: Mural de Pedidos fica imediatamente abaixo do Player da Rádio */}
                  <RequestsCard mode="radio" />
                  
                  {/* E por último as Últimas Notícias */}
                  <NewsCard />
                </>
              ) : (
                <div className="flex flex-col gap-5 h-full">
                  {/* No Desktop: Notícias e Mural empilhados */}
                  <NewsCard />
                  <RequestsCard mode="radio" />
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </div>
  );
}
