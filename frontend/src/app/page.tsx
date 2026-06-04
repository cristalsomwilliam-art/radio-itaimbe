"use client";

import React, { useEffect, useState } from "react";
import { Tv, Radio, Users, Music, RefreshCw, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import TvPlayer from "@/components/TvPlayer";
import OwncastChat from "@/components/OwncastChat";
import Visualizer from "@/components/Visualizer";
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

      // 1. Carregar status do streaming
      const { data: statusData } = await supabase
        .from("stream_status")
        .select("*")
        .eq("id", "main")
        .single();

      if (statusData) {
        setStatus(statusData as StreamStatus);
      }

      // 2. Carregar Banners
      const { data: bannersData } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .limit(3);

      if (bannersData) {
        setBanners(bannersData as Banner[]);
      }

      // 3. Carregar Notícias Recentes
      const { data: newsData } = await supabase
        .from("news")
        .select("id, title, excerpt, slug, image_url, published_at")
        .order("published_at", { ascending: false })
        .limit(3);

      if (newsData) {
        setNews(newsData as NewsItem[]);
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
          setStatus(payload.new as StreamStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusSubscription);
    };
  }, []);

  return (
    <div className="space-y-8 md:space-y-12">
      {/* 1. SEÇÃO DE TRANSMISSÃO PRINCIPAL (TELA DA TV OU VISUALIZADOR DA RÁDIO) */}
      <section className="w-full">
        {isLoading ? (
          <div className="w-full h-[350px] md:h-[480px] bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-500 text-xs font-semibold">Sincronizando sinal...</span>
          </div>
        ) : status.tv_online ? (
          /* MODO TV AO VIVO COM CHAT */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                  <h1 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-wider">
                    TV ITAIMBÉ AO VIVO
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-zinc-400 font-medium mt-1">
                  Assistindo agora: <span className="text-white font-semibold">{status.tv_stream_title}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full self-start">
                <div className="flex items-center gap-1.5 text-accent-400">
                  <Users className="w-4 h-4" />
                  <span>{status.tv_viewers_count} assistindo</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player 16:9 */}
              <div className="lg:col-span-2">
                <TvPlayer streamUrl={owncastStreamUrl} showOverlay={status.show_logo_overlay} />
              </div>
              {/* Chat do Owncast */}
              <div className="lg:col-span-1 h-full">
                <OwncastChat chatUrl={owncastChatUrl} />
              </div>
            </div>
          </div>
        ) : (
          /* MODO RÁDIO AUTOMÁTICO (VISUALIZADOR + HISTÓRICO) */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse"></span>
                  <h1 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-wider">
                    RÁDIO ITAIMBÉ FM
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-zinc-400 font-medium mt-1">
                  Música atual: <span className="text-white font-semibold">{status.current_song}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full self-start">
                <div className="flex items-center gap-1.5 text-primary-400">
                  <Users className="w-4 h-4" />
                  <span>{status.listeners_count} ouvintes online</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Canvas Wave Visualizer */}
              <div className="lg:col-span-2">
                <Visualizer
                  isPlaying={true} // Por estar na home da rádio, simula onda
                  albumArt={status.album_art}
                  songTitle={status.current_song}
                  artistName={status.current_artist}
                />
              </div>

              {/* Histórico de Músicas Tocadas & Próxima */}
              <div className="lg:col-span-1 flex flex-col justify-between bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 shadow-xl min-h-[350px]">
                <div>
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                    <Music className="w-4 h-4 text-primary-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Últimas Músicas</h3>
                  </div>

                  {status.song_history && status.song_history.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {status.song_history.map((song, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 border-b border-zinc-900/50"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="font-semibold text-zinc-200 truncate">{song.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">
                            {song.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-6">Nenhum histórico disponível.</p>
                  )}
                </div>

                {status.next_song && (
                  <div className="mt-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-accent-400 uppercase tracking-widest block">
                        A Seguir
                      </span>
                      <span className="text-xs font-semibold text-white block truncate max-w-[200px]">
                        {status.next_song}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                )}
              </div>
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
                className="relative h-28 rounded-xl overflow-hidden border border-zinc-800/80 group hover:border-zinc-700/60 transition-all shadow-lg"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                  <h4 className="text-xs font-bold text-white leading-tight">{banner.title}</h4>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 3. SEÇÃO DE NOTÍCIAS RECENTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
            <span className="w-1 h-5 bg-accent-500 rounded"></span>
            Últimas Notícias
          </h2>
          <Link
            href="/noticias"
            className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-0.5"
          >
            Ver Todas <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <Link
                key={item.id}
                href={`/noticias/${item.slug}`}
                className="glass-panel rounded-xl overflow-hidden group hover:border-zinc-700/50 flex flex-col h-full shadow-lg transition-all"
              >
                <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-950 font-bold text-[10px] tracking-wider">
                      RADIO ITAIMBÉ 87.9
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500">
                      {new Date(item.published_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                      })}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 group-hover:text-primary-400 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-2 mt-1.5">
                      {item.excerpt}
                    </p>
                  </div>
                  <div className="text-[10px] text-accent-400 font-bold uppercase tracking-wider mt-4 flex items-center gap-0.5">
                    Ler Mais <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-xs font-medium">Nenhuma notícia publicada ainda.</div>
        )}
      </section>
    </div>
  );
}
