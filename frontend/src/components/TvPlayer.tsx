"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize, Volume2, VolumeX, Play, Pause, Tv } from "lucide-react";

interface TvPlayerProps {
  streamUrl: string; // ex: https://tv.radioitaimbe.com.br/hls/stream.m3u8
  showOverlay?: boolean;
}

export default function TvPlayer({ streamUrl, showOverlay = true }: TvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;
    let stallTimeout: NodeJS.Timeout | null = null;
    let loadingTimeout: NodeJS.Timeout | null = null;
    setIsLoading(true);

    const initPlayer = async () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // Iniciar timer de 8 segundos para reiniciar se o carregamento demorar (ex: stream iniciando)
      loadingTimeout = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          return; // Já está tocando
        }
        console.log("Player de vídeo demorando para carregar (8s). Tentando reiniciar conexão HLS...");
        initPlayer();
      }, 8000);

      // Se suportar HLS nativo (Safari / iOS)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          video.play().catch((err) => {
            console.log("Erro no autoplay nativo unmuted, tentando mutar...", err);
            setIsMuted(true);
            video.muted = true;
            video.play().catch((err2) => {
              console.log("Autoplay nativo mutado falhou também:", err2);
            });
          });
        }, { once: true });
      } 
      // Caso contrário, carregar o Hls.js dinamicamente
      else {
        try {
          if (hls) {
            hls.destroy();
            hls = null;
          }
          const HlsModule = await import("hls.js");
          const Hls = HlsModule.default;

          if (Hls.isSupported()) {
            hls = new Hls({
              maxMaxBufferLength: 10,
              liveSyncDuration: 3,
              enableWorker: true,
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setIsLoading(false);
              if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
              }
              video.play().catch((err) => {
                console.log("Autoplay unmuted falhou, tentando mutar...", err);
                setIsMuted(true);
                video.muted = true;
                video.play().catch((err2) => {
                  console.log("Autoplay mutado falhou também:", err2);
                });
              });
            });

            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("Erro de rede HLS, tentando recuperar...");
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("Erro de mídia HLS, tentando recuperar...");
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log("Erro fatal HLS, reiniciando stream...");
                    initPlayer();
                    break;
                }
              }
            });
          } else {
            console.error("HLS.js não é suportado pelo seu navegador.");
            setIsLoading(false);
          }
        } catch (e) {
          console.error("Erro ao inicializar o player Hls.js:", e);
          setIsLoading(false);
        }
      }
    };

    initPlayer();

    // Eventos do player de vídeo
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if (stallTimeout) {
        clearTimeout(stallTimeout);
        stallTimeout = null;
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    };
    const handlePause = () => setIsPlaying(false);
    
    const handleWaiting = () => {
      setIsLoading(true);
      // Se travar por mais de 6 segundos, reinicia a conexão HLS
      if (stallTimeout) clearTimeout(stallTimeout);
      stallTimeout = setTimeout(() => {
        console.log("Player de vídeo travado (waiting). Tentando reconectar...");
        initPlayer();
      }, 6000);
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      if (video) {
        video.removeEventListener("playing", handlePlaying);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("waiting", handleWaiting);
      }
      if (stallTimeout) {
        clearTimeout(stallTimeout);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl]);

  // Detector de congelamento silencioso (Freeze Detector / "Cutucada" Automática)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastTime = video.currentTime;
    let freezeCount = 0;

    const interval = setInterval(() => {
      // Se estiver pausado ou carregando, reiniciar contador de congelamento
      if (video.paused || video.ended || isLoading) {
        freezeCount = 0;
        if (video.paused) {
          lastTime = video.currentTime;
        }
        return;
      }

      if (video.currentTime === lastTime) {
        // O tempo não andou, mas o vídeo não está pausado: possível congelamento
        freezeCount += 1;
        if (freezeCount >= 3) { // 3 verificações consecutivas (6 segundos congelado)
          console.log("Congelamento detectado no player da TV! Dando uma 'cutucada'...");
          freezeCount = 0;
          
          try {
            if (video.buffered && video.buffered.length > 0) {
              const end = video.buffered.end(video.buffered.length - 1);
              // Se tiver buffer acumulado à frente, pula para o final dele menos 0.5s
              if (end - video.currentTime > 0.5) {
                video.currentTime = end - 0.5;
              } else {
                // Apenas move o tempo ligeiramente para forçar o player a acordar
                video.currentTime = video.currentTime + 0.1;
              }
            } else {
              // Sem buffer: move o tempo ou recarrega a fonte para forçar re-conexão
              video.currentTime = video.currentTime; 
            }
            video.play().catch(() => {});
          } catch (e) {
            console.warn("Erro ao tentar descolar player congelado:", e);
          }
        }
      } else {
        freezeCount = 0;
        lastTime = video.currentTime;
      }
    }, 2000); // Verificar a cada 2 segundos

    return () => clearInterval(interval);
  }, [streamUrl, isPlaying, isLoading]);

  // Controle de Volume e Mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Unmute automático no primeiro clique em qualquer lugar da página
  useEffect(() => {
    if (!isPlaying || !isMuted) return;

    const handleDocumentClick = () => {
      console.log("Interação do usuário detectada no documento. Ativando áudio da TV...");
      setIsMuted(false);
    };

    // Pequeno atraso para não capturar o mesmo clique que iniciou a transição (se houver)
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleDocumentClick, { once: true });
    }, 1000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isPlaying, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((e) => console.log("Play falhou:", e));
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Erro ao entrar em tela cheia:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group border border-zinc-800 shadow-2xl"
    >
      {/* Elemento de Vídeo */}
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        muted={isMuted}
      />

      {/* Indicador de Carregamento (Loading) */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-zinc-400">Carregando Transmissão...</span>
          </div>
        </div>
      )}

      {/* Overlay de Marca D'água Opcional */}
      {showOverlay && !isLoading && (
        <div className={`absolute top-4 z-10 flex items-center gap-2 bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/30 transition-all duration-300 ${
          isPlaying && isMuted ? "right-36" : "right-4"
        }`}>
          <Tv className="w-4 h-4 text-accent-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider">TV ITAIMBÉ</span>
        </div>
      )}

      {/* Botão flutuante para desmutar se estiver mutado automaticamente */}
      {isPlaying && isMuted && (
        <button
          onClick={() => setIsMuted(false)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:scale-105 active:scale-95 transition-all px-4 py-2.5 rounded-full border border-white/10 shadow-lg text-[10px] md:text-xs font-black text-white uppercase tracking-wider animate-bounce"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Ativar Áudio</span>
        </button>
      )}

      {/* Controles do Player */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary-400 transition-colors p-1"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-primary-400 transition-colors p-1"
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
                className="w-16 md:w-24 accent-primary-500 bg-zinc-800 rounded-lg appearance-none h-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tag Live */}
            <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              AO VIVO
            </div>

            {/* Tela Cheia */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-400 transition-colors p-1"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
