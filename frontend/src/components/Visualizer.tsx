"use client";

import React, { useEffect, useRef } from "react";

interface VisualizerProps {
  isPlaying: boolean;
  albumArt: string | null;
  songTitle: string;
  artistName: string;
}

export default function Visualizer({
  isPlaying,
  albumArt,
  songTitle,
  artistName,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar tamanho do canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Variáveis de animação
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      hue: number;
    }> = [];

    const numParticles = 40;
    const waves = [
      { amplitude: 25, frequency: 0.008, speed: 0.04, color: "rgba(139, 92, 246, 0.15)", phase: 0 },
      { amplitude: 15, frequency: 0.015, speed: -0.02, color: "rgba(6, 182, 212, 0.12)", phase: 2 },
      { amplitude: 35, frequency: 0.005, speed: 0.015, color: "rgba(139, 92, 246, 0.08)", phase: 4 },
    ];

    // Inicializar partículas
    const initParticles = (w: number, h: number) => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: -Math.random() * 0.8 - 0.2,
          alpha: Math.random() * 0.5 + 0.1,
          hue: Math.random() > 0.5 ? 260 : 190, // Tons de roxo e ciano
        });
      }
    };

    const rect = canvas.getBoundingClientRect();
    initParticles(rect.width, rect.height);

    // Loop de renderização
    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      // 1. Fundo Gradiente Escuro
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
      bgGrad.addColorStop(0, "#110c24");
      bgGrad.addColorStop(1, "#09090b");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Partículas Orbitantes / Flutuantes
      particles.forEach((p) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, 80%, 70%, 0.5)`;
        ctx.fill();
        ctx.restore();

        // Mover partículas se estiver tocando
        if (isPlaying) {
          p.y += p.speedY * 1.5;
          p.x += p.speedX * 1.5;
          p.alpha += (Math.random() - 0.5) * 0.05;
          p.alpha = Math.max(0.1, Math.min(0.7, p.alpha));
        } else {
          p.y += p.speedY * 0.2;
          p.x += p.speedX * 0.2;
        }

        // Resetar partículas no topo/laterais
        if (p.y < 0) {
          p.y = h;
          p.x = Math.random() * w;
        }
        if (p.x < 0 || p.x > w) {
          p.x = Math.random() * w;
        }
      });

      // 3. Renderizar Ondas Senoidais Simulando Frequências
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, h / 2);

        for (let x = 0; x < w; x++) {
          // Alterar comportamento se pausado
          const currentAmp = isPlaying ? wave.amplitude : wave.amplitude * 0.15;
          const y =
            h / 2 +
            Math.sin(x * wave.frequency + wave.phase) *
              currentAmp *
              Math.sin((x / w) * Math.PI); // Suavizar bordas nas laterais

          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();

        // Incrementar fase
        wave.phase += isPlaying ? wave.speed : wave.speed * 0.1;
      });

      // 4. Efeito de Pulso no Centro
      if (isPlaying) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 110 + Math.sin(Date.now() * 0.005) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.1)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 125 + Math.sin(Date.now() * 0.003) * 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.06)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-[350px] md:h-[480px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Interface Visual com Capa e Detalhes da Música */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none z-10 pointer-events-none">
        
        {/* Capa de Disco Giratória */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 blur-md opacity-40 animate-pulse-slow"></div>
          <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-zinc-800/80 bg-zinc-950 flex items-center justify-center overflow-hidden shadow-2xl">
            {albumArt ? (
              <img
                src={albumArt}
                alt="Capa do Álbum"
                className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-linear ${
                  isPlaying ? "animate-spin-slow" : "opacity-80"
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-700/30">
                <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">RADIO</span>
                <span className="text-[20px] text-primary-400 font-black">ITAIMBÉ</span>
                <span className="text-[10px] text-zinc-500 font-bold tracking-widest mt-1">87.9 FM</span>
              </div>
            )}
            
            {/* Furo do Vinil no centro */}
            <div className="absolute w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
            </div>
          </div>
        </div>

        {/* Informações da Música */}
        <div className="max-w-md pointer-events-auto">
          <span className="inline-block bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
            Modo Rádio Automático
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white truncate px-4 text-glow">
            {songTitle}
          </h2>
          <p className="text-sm text-zinc-400 font-medium mt-1 truncate px-4">
            {artistName}
          </p>
        </div>

      </div>
    </div>
  );
}
