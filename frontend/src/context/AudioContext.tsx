"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface StreamStatus {
  current_song: string;
  current_artist: string;
  album_art: string | null;
  listeners_count: number;
  tv_online: boolean;
}

interface AudioContextType {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
  streamUrl: string;
  songTitle: string;
  artistName: string;
  albumArt: string | null;
  listenersCount: number;
  tvOnline: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  changeVolume: (val: number) => void;
  toggleMute: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  audioContextRef: React.RefObject<AudioContext | null>;
}

const AudioContextGlobal = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status de música, ouvintes e TV sincronizados do Supabase
  const [songTitle, setSongTitle] = useState("Programação Musical");
  const [artistName, setArtistName] = useState("Rádio Itaimbé 87.9 FM");
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [listenersCount, setListenersCount] = useState(0);
  const [tvOnline, setTvOnline] = useState(false);

  // URL de stream segura (Cloudflare Tunnel -> Proxy Local -> Caster.fm)
  const streamUrl = "https://stream.radioitaimbe.com.br/";
  // Link de fallback em localhost caso esteja em ambiente de desenvolvimento local
  const devStreamUrl = "http://localhost:8000/";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const prevVolumeRef = useRef<number>(0.8);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Limpar timeouts no unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
    };
  }, []);

  const handleReconnect = () => {
    if (!isPlaying) return;
    
    if (reconnectAttemptsRef.current >= 5) {
      console.log("Limite de reconexões do áudio atingido.");
      setError("Conexão com a rádio perdida. Tente dar play novamente.");
      setIsPlaying(false);
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`Tentativa de reconexão de áudio ${reconnectAttemptsRef.current}/5...`);

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      if (!audioRef.current || !isPlaying) return;
      try {
        audioRef.current.load();
        await audioRef.current.play();
        console.log("Áudio reconectado com sucesso!");
        reconnectAttemptsRef.current = 0;
        setError(null);
      } catch (err) {
        console.warn("Falha na tentativa de reconexão do áudio, tentando novamente...", err);
        handleReconnect();
      }
    }, 3000);
  };

  // Sincronizar dados de música do Supabase
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("stream_status")
        .select("current_song, current_artist, album_art, listeners_count, tv_online")
        .eq("id", "main")
        .single();

      if (data) {
        setSongTitle(data.current_song || "Programação Musical");
        setArtistName(data.current_artist || "Rádio Itaimbé 87.9 FM");
        setAlbumArt(data.album_art);
        setListenersCount(data.listeners_count || 0);
        setTvOnline(!!data.tv_online);
      }
    };

    fetchStatus();

    const subscription = supabase
      .channel("stream_status_audio_context")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stream_status",
          filter: "id=eq.main",
        },
        (payload) => {
          const newData = payload.new as StreamStatus;
          setSongTitle(newData.current_song || "Programação Musical");
          setArtistName(newData.current_artist || "Rádio Itaimbé 87.9 FM");
          setAlbumArt(newData.album_art);
          setListenersCount(newData.listeners_count || 0);
          setTvOnline(!!newData.tv_online);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Inicializar o Web Audio API Analyser
  const initAnalyser = () => {
    if (typeof window === "undefined") return;

    if (!audioContextRef.current && audioRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const analyserNode = audioCtx.createAnalyser();
          // Configurar tamanho da transformada de fourier
          analyserNode.fftSize = 256;
          analyserNode.smoothingTimeConstant = 0.8;

          // Conectar o elemento de áudio
          const source = audioCtx.createMediaElementSource(audioRef.current);
          source.connect(analyserNode);
          analyserNode.connect(audioCtx.destination);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyserNode;
        }
      } catch (err) {
        console.error("Erro ao inicializar o AudioContext da Web Audio API:", err);
      }
    } else if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const play = async () => {
    if (!audioRef.current) return;
    
    // Inicializar Web Audio API no primeiro gesto do usuário
    initAnalyser();

    try {
      setError(null);
      reconnectAttemptsRef.current = 0;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);

      // Recarregar a fonte de áudio no play de streaming para evitar atrasos acumulados
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Erro ao iniciar reprodução:", err);
      setError("Não foi possível carregar o áudio. Verifique sua conexão ou se o stream está ativo.");
      setIsPlaying(false);
    }
  };

  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const changeVolume = (val: number) => {
    if (!audioRef.current) return;
    const cleanVal = Math.max(0, Math.min(1, val));
    audioRef.current.volume = cleanVal;
    setVolume(cleanVal);
    if (cleanVal > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = prevVolumeRef.current;
      setVolume(prevVolumeRef.current);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      audioRef.current.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Sincronizar o volume no elemento de áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <AudioContextGlobal.Provider
      value={{
        isPlaying,
        volume,
        isMuted,
        error,
        streamUrl: typeof window !== "undefined" && window.location.hostname === "localhost" ? devStreamUrl : streamUrl,
        songTitle,
        artistName,
        albumArt,
        listenersCount,
        tvOnline,
        play,
        pause,
        togglePlay,
        changeVolume,
        toggleMute,
        audioRef,
        analyserRef,
        audioContextRef,
      }}
    >
      {/* Elemento de áudio global com crossOrigin para habilitar o analisador da Web Audio API */}
      <audio
        ref={audioRef}
        src={typeof window !== "undefined" && window.location.hostname === "localhost" ? devStreamUrl : streamUrl}
        crossOrigin="anonymous"
        preload="none"
        onPlay={() => {
          setIsPlaying(true);
          reconnectAttemptsRef.current = 0;
          if (stallTimeoutRef.current) {
            clearTimeout(stallTimeoutRef.current);
            stallTimeoutRef.current = null;
          }
        }}
        onPlaying={() => {
          setIsPlaying(true);
          reconnectAttemptsRef.current = 0;
          if (stallTimeoutRef.current) {
            clearTimeout(stallTimeoutRef.current);
            stallTimeoutRef.current = null;
          }
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => {
          if (isPlaying) {
            if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
            stallTimeoutRef.current = setTimeout(() => {
              console.log("Streaming de áudio travado (waiting). Tentando reconectar...");
              handleReconnect();
            }, 5000);
          }
        }}
        onStalled={() => {
          if (isPlaying) {
            if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
            stallTimeoutRef.current = setTimeout(() => {
              console.log("Áudio stalled (congelado). Tentando reconectar...");
              handleReconnect();
            }, 5000);
          }
        }}
        onError={(e) => {
          console.error("Erro no elemento de áudio:", e);
          if (isPlaying) {
            handleReconnect();
          } else {
            setIsPlaying(false);
          }
        }}
      />
      {children}
    </AudioContextGlobal.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextGlobal);
  if (context === undefined) {
    throw new Error("useAudio deve ser utilizado dentro de um AudioProvider");
  }
  return context;
}
