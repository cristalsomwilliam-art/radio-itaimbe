"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, Disc } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Metadata {
  current_song: string;
  current_artist: string;
  album_art: string | null;
}

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({
    current_song: "Programação Musical",
    current_artist: "Rádio Itaimbé 87.9 FM",
    album_art: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrl = "http://morcast.caster.fm:15366/BZRqL";

  // 1. Monitorar o status de áudio e sincronizar com Supabase para metadados em tempo real
  useEffect(() => {
    // Buscar metadados iniciais
    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from("stream_status")
        .select("current_song, current_artist, album_art")
        .eq("id", "main")
        .single();

      if (data && !error) {
        setMetadata({
          current_song: data.current_song,
          current_artist: data.current_artist,
          album_art: data.album_art,
        });
      }
    };

    fetchMetadata();

    // Ouvir atualizações em tempo real do banco de dados
    const subscription = supabase
      .channel("stream_status_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stream_status",
          filter: "id=eq.main",
        },
        (payload: any) => {
          const newData = payload.new;
          setMetadata({
            current_song: newData.current_song,
            current_artist: newData.current_artist,
            album_art: newData.album_art,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // 2. Controlar o elemento de áudio
  useEffect(() => {
    // Inicializar o elemento de áudio (apenas no lado do cliente)
    const audio = new Audio();
    audio.src = streamUrl;
    audio.preload = "none"; // Evitar download excessivo antes de dar play
    audioRef.current = audio;

    // Eventos do áudio
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  // Sincronizar o volume e mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      // Para streams ao vivo, é melhor resetar a URL ao pausar
      // para não criar delay de cache ao dar play novamente.
      audioRef.current.src = ""; 
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      // Recarregar a URL para pegar a transmissão em tempo real sem delay acumulado
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Erro ao reproduzir áudio:", err);
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-zinc-800/80 px-4 py-3 md:py-4 glow-primary">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: Metadados da Música Atual */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg shadow-black/50">
            {metadata.album_art ? (
              <img
                src={metadata.album_art}
                alt="Capa do Álbum"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? "animate-spin-slow" : ""
                }`}
              />
            ) : (
              <Disc className={`w-6 h-6 text-primary-400 ${isPlaying ? "animate-spin-slow" : ""}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate text-glow">
              {metadata.current_song}
            </h4>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {metadata.current_artist}
            </p>
          </div>
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-4 flex-shrink-0 px-2">
              <span className="w-0.5 bg-accent-400 animate-pulse h-3"></span>
              <span className="w-0.5 bg-accent-400 animate-pulse h-4 delay-100"></span>
              <span className="w-0.5 bg-accent-400 animate-pulse h-2 delay-200"></span>
              <span className="w-0.5 bg-accent-400 animate-pulse h-3.5 delay-300"></span>
            </div>
          )}
        </div>

        {/* CENTRO: Controles Principais */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-1/3">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white font-bold transition-all shadow-md shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100`}
              title={isPlaying ? "Pausar Rádio" : "Ouvir Rádio"}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-1" />
              )}
            </button>

            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">
                AO VIVO
              </span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium tracking-wide">
            Ouça a Rádio FM 87.9
          </span>
        </div>

        {/* LADO DIREITO: Controle de Volume */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 md:w-28 accent-primary-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
          />
        </div>

      </div>
    </div>
  );
}
