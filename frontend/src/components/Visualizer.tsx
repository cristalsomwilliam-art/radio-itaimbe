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
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Carregar o logotipo oficial da rádio para desenhar no centro
  useEffect(() => {
    const img = new Image();
    img.src = "/logo.jpg";
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar o tamanho do Canvas com suporte a Retina
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Sistema de Partículas Radial
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      angle: number;
      alpha: number;
      color: string;
    }> = [];

    const numParticles = 80;
    const initParticles = (w: number, h: number) => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 100;
        particles.push({
          x: w / 2 + Math.cos(angle) * dist,
          y: h / 2 + Math.sin(angle) * dist,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 1.2 + 0.3,
          angle: angle,
          alpha: Math.random() * 0.6 + 0.2,
          color: Math.random() > 0.4 ? "rgba(239, 68, 68, " : "rgba(249, 115, 22, ", // Vermelho e Laranja
        });
      }
    };

    const rect = canvas.getBoundingClientRect();
    initParticles(rect.width, rect.height);

    // Variáveis auxiliares para as frequências simuladas e ondas do shader
    let phase = 0;

    // Loop de renderização principal
    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      const time = Date.now() * 0.001;

      // 1. Algoritmo Procedural de Batida (BPM)
      // Simula uma pulsação forte de bumbo a cada 0.5s (~120 BPM) mais uma batida secundária sincopada (snare)
      const beat = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2.0)), 8.0);
      const snare = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2.0 + Math.PI / 2)), 12.0) * 0.3;
      const pulse = isPlaying ? (beat + snare) : 0;

      // 2. Fundo Gradiente Escuro de Luxo (Premium Radial Gradient)
      const bgGrad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        20 + pulse * 15,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.8
      );
      bgGrad.addColorStop(0, "#19080c"); // Brilho de tom vermelho profundo no centro
      bgGrad.addColorStop(0.5, "#0b0708");
      bgGrad.addColorStop(1, "#030202");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Efeito Shader: Ondas de Fundo Orgânicas (Fluido Cósmico)
      ctx.save();
      const numWaves = 4;
      for (let i = 0; i < numWaves; i++) {
        const currentPhase = phase + i * (Math.PI / 4);
        const amp = (15 + i * 8 + pulse * 25) * (isPlaying ? 1.0 : 0.1);
        const freq = 0.005 + i * 0.002;
        const speed = 0.015 - i * 0.003;

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x < w; x++) {
          const y =
            h - 40 - i * 15 +
            Math.sin(x * freq + currentPhase) * amp * Math.sin((x / w) * Math.PI);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        // Degradê de cor transparente para cada camada de onda
        const opacity = (0.05 - i * 0.01) + (pulse * 0.06);
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0.01, opacity)})`;
        ctx.fill();
      }
      ctx.restore();

      // Incrementar a fase das ondas base
      phase += isPlaying ? 0.025 : 0.003;

      // 4. Shader de Raios de Frequência Radial (Spectrum Analizer Circular)
      ctx.save();
      const numSpikes = 120;
      const innerRadius = 85 + pulse * 12; // Anel se expande no ritmo
      
      ctx.shadowBlur = 15 + pulse * 20;
      ctx.shadowColor = "rgba(239, 68, 68, 0.6)";

      ctx.beginPath();
      for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2 + time * 0.05;
        // Ruído matemático senoidal para criar a ilusão de frequências reais pulando
        const noise =
          Math.sin(angle * 12 + time * 8) * 12 +
          Math.cos(angle * 5 - time * 4) * 8 +
          Math.sin(angle * 28 + time * 12) * 5;

        // Comprimento da barra baseado no ruído + pulso da música
        const baseHeight = isPlaying ? 18 : 3;
        const spikeLength = Math.max(2, (noise + baseHeight) * (1.0 + pulse * 1.6));
        
        const x1 = w / 2 + Math.cos(angle) * innerRadius;
        const y1 = h / 2 + Math.sin(angle) * innerRadius;
        const x2 = w / 2 + Math.cos(angle) * (innerRadius + spikeLength);
        const y2 = h / 2 + Math.sin(angle) * (innerRadius + spikeLength);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 5. Partículas Explodindo do Centro (Radial Particles)
      particles.forEach((p) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color + "0.5)";
        ctx.fill();
        ctx.restore();

        // Mover partícula radialmente a partir do centro
        const dx = p.x - w / 2;
        const dy = p.y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const currentSpeed = (p.speed + pulse * 5) * (isPlaying ? 1.4 : 0.15);
        p.x += (dx / (dist || 1)) * currentSpeed;
        p.y += (dy / (dist || 1)) * currentSpeed;

        // Modificar transparência levemente
        p.alpha += (Math.random() - 0.5) * 0.05;
        p.alpha = Math.max(0.1, Math.min(0.8, p.alpha));

        // Se sair da tela ou ficar muito longe, reseta no centro
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || dist > Math.max(w, h) * 0.6) {
          const newAngle = Math.random() * Math.PI * 2;
          const startDist = 30 + Math.random() * 40;
          p.x = w / 2 + Math.cos(newAngle) * startDist;
          p.y = h / 2 + Math.sin(newAngle) * startDist;
          p.angle = newAngle;
          p.alpha = Math.random() * 0.6 + 0.2;
        }
      });

      // 6. Efeito de Anel Luminoso Pulsante Externo
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, innerRadius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.15 + pulse * 0.25})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 7. Desenhar Logotipo no Centro Pulsante
      const logoSize = 150 + pulse * 20; // Tamanho pulsa na batida
      const radius = logoSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      ctx.clip(); // Cortar o desenho em formato circular

      if (logoImgRef.current) {
        ctx.drawImage(
          logoImgRef.current,
          w / 2 - radius,
          h / 2 - radius,
          logoSize,
          logoSize
        );
      } else {
        // Fallback de texto se a imagem não carregou ainda
        ctx.fillStyle = "#1e1b1b";
        ctx.fillRect(w / 2 - radius, h / 2 - radius, logoSize, logoSize);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("RADIO", w / 2, h / 2 - 15);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText("ITAIMBÉ", w / 2, h / 2 + 10);
      }

      ctx.restore();

      // Borda do Logotipo
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 + pulse * 0.2})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10 + pulse * 15;
      ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      ctx.stroke();
      ctx.restore();

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
    <div className="relative w-full h-[350px] md:h-[480px] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl">
      {/* Canvas Shader */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Título e Artista na parte inferior do visualizador (Floating Panel) */}
      <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between pointer-events-none select-none z-10">
        <div className="min-w-0 flex-1 pr-4">
          <span className="text-[8px] font-bold text-primary-500 uppercase tracking-widest block mb-0.5">
            No Ar Agora
          </span>
          <h2 className="text-sm font-bold text-white truncate text-glow">
            {songTitle}
          </h2>
          <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
            {artistName}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
          <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider">AO VIVO</span>
        </div>
      </div>
    </div>
  );
}
