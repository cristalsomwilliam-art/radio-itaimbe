"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { Heart, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic } from "lucide-react";

export default function Player() {
  const {
    isPlaying,
    volume,
    isMuted,
    error,
    songTitle,
    artistName,
    albumArt,
    togglePlay,
    changeVolume,
    toggleMute,
    analyserRef,
    tvOnline,
  } = useAudio();

  const [isLiked, setIsLiked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Efeito Waveform de frequências reais no canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 200;
      canvas.height = 40;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const isRealAnalyser = !!(analyserRef.current && isPlaying);

      if (isRealAnalyser && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      // Desenhar barras verticais simétricas e arredondadas (Waveform)
      const barCount = 35;
      const barWidth = 3;
      const barGap = 2;
      const startX = (w - (barCount * (barWidth + barGap))) / 2;

      ctx.save();
      // Sombras neon rosa/roxo
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(232, 30, 77, 0.6)";

      // Criar gradiente rosa para roxo
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#e81e4d"); // Rosa choque
      grad.addColorStop(1, "#8b5cf6"); // Violeta

      ctx.fillStyle = grad;

      for (let i = 0; i < barCount; i++) {
        // Obter valor da frequência ou simular se estiver pausado
        let value = 0;
        if (isRealAnalyser) {
          // Mapear frequências para a quantidade de barras
          const dataIdx = Math.floor((i / barCount) * (bufferLength * 0.6));
          value = dataArray[dataIdx] / 255;
        } else {
          // Simulação procedural leve
          const waveFreq = 0.15;
          const speed = 0.05;
          const breathing = isPlaying ? 0.35 : 0.08;
          value = (Math.sin(i * waveFreq - phase) * 0.5 + 0.5) * breathing;
        }

        // Altura mínima para ficar bonito mesmo sem som
        const barHeight = Math.max(3, value * h * 0.95);
        const x = startX + i * (barWidth + barGap);
        const y = (h - barHeight) / 2;

        // Desenhar barra arredondada
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, barHeight, 1.5);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      ctx.restore();

      phase += 0.08;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyserRef]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/85 border-t border-zinc-800/80 shadow-2xl backdrop-blur-lg select-none px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        
        {/* Esquerda: Info da Música */}
        <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0">
          <div className="relative w-12 h-12 rounded-lg border border-zinc-800/80 bg-zinc-900 overflow-hidden flex-shrink-0 shadow-lg shadow-pink-500/5">
            <img
              src={albumArt || "/logo.jpg"}
              alt="Capa do Álbum"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.jpg";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs md:text-sm font-bold text-white truncate text-glow">
                {songTitle}
              </h4>
            </div>
            <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5 font-medium">
              {artistName}
            </p>
            <div className="flex gap-1.5 mt-1">
              <span className="text-[8px] font-black bg-[#e81e4d] text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                NO AR
              </span>
              <span className="text-[8px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Centro: Controles de Áudio */}
        <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
          <div className="flex items-center gap-4">
            {/* Botão Curtir */}
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? "text-[#e81e4d]" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
            </button>

            {/* Faixa Anterior (Decorativo) */}
            <button className="p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Gigante Rosa */}
            <button
              onClick={togglePlay}
              disabled={tvOnline}
              className={`w-10 h-10 rounded-full bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-105 transition-all active:scale-95 ${
                tvOnline ? "opacity-40 cursor-not-allowed hover:scale-100 active:scale-100 shadow-none" : ""
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
              )}
            </button>

            {/* Próxima Faixa (Decorativo) */}
            <button className="p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume Icon e Controle */}
            <div className={`flex items-center gap-2 group/volume ml-2 ${tvOnline ? "opacity-40" : ""}`}>
              <button
                onClick={toggleMute}
                disabled={tvOnline}
                className={`text-zinc-400 hover:text-white p-2 rounded-full transition-colors ${tvOnline ? "cursor-not-allowed" : ""}`}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                disabled={tvOnline}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className={`w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#e81e4d] group-hover/volume:w-20 transition-all duration-300 ${tvOnline ? "cursor-not-allowed" : ""}`}
              />
            </div>
          </div>
          {error && (
            <span className="text-[10px] text-red-500 font-medium text-center animate-pulse max-w-xs truncate">
              {error}
            </span>
          )}
        </div>

        {/* Direita: Waveform Visualizer */}
        <div className="hidden md:flex items-center justify-end gap-4 w-full md:w-1/3">
          <button className="p-2 rounded-full text-zinc-400 hover:text-white transition-colors">
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="w-44 h-10 border border-zinc-800/40 bg-zinc-950/40 rounded-lg overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

      </div>
    </div>
  );
}
