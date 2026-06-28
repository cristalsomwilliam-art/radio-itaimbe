"use client";

import React, { useEffect, useRef } from "react";
import { useAudio } from "@/context/AudioContext";

export default function Visualizer() {
  const { isPlaying, songTitle, artistName, analyserRef } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  // Carregar o logotipo oficial da rádio para o centro
  useEffect(() => {
    const img = new Image();
    img.src = "/logo.jpg";
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, []);

  // Escutar eventos de abertura/fechamento de modal para pausar a animação
  useEffect(() => {
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);

    window.addEventListener("modal-open", handlePause);
    window.addEventListener("modal-close", handleResume);

    return () => {
      window.removeEventListener("modal-open", handlePause);
      window.removeEventListener("modal-close", handleResume);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar tamanho do Canvas com suporte a Retina
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Se o visualizador estiver pausado (modal aberto), desenha um quadro estático para economizar 100% de CPU
    if (isPaused) {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      
      const drawStatic = () => {
        ctx.clearRect(0, 0, w, h);
        
        // Fundo com brilho roxo sutil
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 25, w / 2, h / 2, Math.max(w, h) * 0.44);
        bgGrad.addColorStop(0, "rgba(40, 7, 56, 0.45)");
        bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Anel neon estático
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Desenhar logotipo no centro
        const logoSize = 100;
        const radius = logoSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
        ctx.clip();
        if (logoImgRef.current) {
          ctx.drawImage(logoImgRef.current, w / 2 - radius, h / 2 - radius, logoSize, logoSize);
        } else {
          ctx.fillStyle = "#160624";
          ctx.fillRect(w / 2 - radius, h / 2 - radius, logoSize, logoSize);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("RÁDIO", w / 2, h / 2 - 10);
          ctx.fillStyle = "#e81e4d";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText("ITAIMBÉ", w / 2, h / 2 + 8);
        }
        ctx.restore();

        // Borda rosa da logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232, 30, 77, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      };

      drawStatic();
      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }

    // Partículas Radiais Neon
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      angle: number;
      alpha: number;
      color: string;
    }> = [];

    const numParticles = 60;
    const initParticles = (w: number, h: number) => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 65;
        particles.push({
          x: w / 2 + Math.cos(angle) * dist,
          y: h / 2 + Math.sin(angle) * dist,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.8 + 0.2,
          angle: angle,
          alpha: Math.random() * 0.5 + 0.1,
          color: Math.random() > 0.5 ? "rgba(232, 30, 77, " : "rgba(34, 211, 238, ", // Pink ou Cyan
        });
      }
    };

    const rect = canvas.getBoundingClientRect();
    initParticles(rect.width, rect.height);

    // Ondas no rodapé
    let phase = 0;

    // Frequências da Web Audio API
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      const time = Date.now() * 0.001;
      const isRealAnalyser = !!(analyserRef.current && isPlaying);

      if (isRealAnalyser && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      // 1. Analisar sub-graves para obter a batida (Pulse)
      let pulse = 0;
      if (isRealAnalyser) {
        // Média dos graves (primeiras bandas de frequência)
        const bassSum = dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3] + dataArray[4] + dataArray[5];
        const bassAvg = bassSum / 6;
        pulse = (bassAvg / 255) * 0.8; // Fator de escala
      } else {
        // Fallback procedural de batida baseado em BPM (~125 BPM)
        const beat = Math.pow(Math.max(0, Math.sin(time * Math.PI * 2.08)), 6.0);
        pulse = isPlaying ? beat * 0.45 : 0;
      }

      // 2. Fundo Transparente com leve brilho radial roxo no centro
      const bgGrad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        25 + pulse * 8,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.44
      );
      bgGrad.addColorStop(0, "rgba(40, 7, 56, 0.45)"); // Brilho roxo sutil
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparência nas bordas
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Efeito Shader: Ondas de Fundo Orgânicas (Fluido do Rodapé do Card)
      ctx.save();
      const numWaves = 3;
      for (let i = 0; i < numWaves; i++) {
        const currentPhase = phase + i * (Math.PI / 3);
        const amp = (8 + i * 4 + pulse * 15) * (isPlaying ? 1.0 : 0.1);
        const freq = 0.006 + i * 0.002;

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x < w; x++) {
          const y =
            h - 15 - i * 8 +
            Math.sin(x * freq + currentPhase) * amp * Math.sin((x / w) * Math.PI);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const opacity = (0.03 - i * 0.008) + (pulse * 0.04);
        ctx.fillStyle = i % 2 === 0 
          ? `rgba(34, 211, 238, ${Math.max(0.01, opacity)})` // Cyan
          : `rgba(232, 30, 77, ${Math.max(0.01, opacity)})`; // Pink
        ctx.fill();
      }
      ctx.restore();

      phase += isPlaying ? 0.012 : 0.002;

      // 4. Desenhar Raios de Frequência Radial (Spectrum Analizer Circular)
      ctx.save();
      const numSpikes = 90;
      const innerRadius = 60 + pulse * 8; // Anel se expande com graves

      ctx.shadowBlur = 8 + pulse * 12;
      ctx.shadowColor = "rgba(34, 211, 238, 0.5)";

      for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2 - time * 0.03;

        let frequencyValue = 0;
        if (isRealAnalyser) {
          // Mapear espinho para frequências
          const dataIdx = Math.floor((i / numSpikes) * (bufferLength * 0.65));
          frequencyValue = dataArray[dataIdx] / 255;
        } else {
          // Ondulações procedurais bonitas se sem áudio real
          frequencyValue = (Math.sin(angle * 8 + time * 4) * 0.3 + 0.3) +
                           (Math.cos(angle * 14 - time * 2) * 0.15 + 0.15);
          if (!isPlaying) frequencyValue *= 0.1;
        }

        const spikeLength = Math.max(2, frequencyValue * 36 * (1.0 + pulse * 0.4));
        
        const x1 = w / 2 + Math.cos(angle) * innerRadius;
        const y1 = h / 2 + Math.sin(angle) * innerRadius;
        const x2 = w / 2 + Math.cos(angle) * (innerRadius + spikeLength);
        const y2 = h / 2 + Math.sin(angle) * (innerRadius + spikeLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // Espinhos alternam entre gradientes de Cyan e Pink
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        if (i % 2 === 0) {
          grad.addColorStop(0, "rgba(34, 211, 238, 0.85)");
          grad.addColorStop(1, "rgba(139, 92, 246, 0.1)");
        } else {
          grad.addColorStop(0, "rgba(232, 30, 77, 0.85)");
          grad.addColorStop(1, "rgba(232, 30, 77, 0.1)");
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // 5. Partículas Explodindo do Centro
      particles.forEach((p) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color.replace(", ", ")").replace("rgba", "rgb");
        ctx.fill();
        ctx.restore();

        // Mover radialmente a partir do centro
        const dx = p.x - w / 2;
        const dy = p.y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Velocidade da partícula aumenta drasticamente no pico do grave
        const currentSpeed = (p.speed + pulse * 7) * (isPlaying ? 1.25 : 0.08);
        p.x += (dx / (dist || 1)) * currentSpeed;
        p.y += (dy / (dist || 1)) * currentSpeed;

        p.alpha += (Math.random() - 0.5) * 0.02;
        p.alpha = Math.max(0.05, Math.min(0.65, p.alpha));

        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || dist > Math.max(w, h) * 0.44) {
          const newAngle = Math.random() * Math.PI * 2;
          const startDist = 40 + Math.random() * 25;
          p.x = w / 2 + Math.cos(newAngle) * startDist;
          p.y = h / 2 + Math.sin(newAngle) * startDist;
          p.angle = newAngle;
          p.alpha = Math.random() * 0.45 + 0.1;
        }
      });

      // 6. Anéis Luminosos Duplos de Neon (Cyan e Magenta)
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, innerRadius - 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8 + pulse * 8;
      ctx.shadowColor = "rgba(34, 211, 238, 0.8)";
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, innerRadius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232, 30, 77, 0.45)";
      ctx.lineWidth = 1.0;
      ctx.shadowBlur = 6 + pulse * 6;
      ctx.shadowColor = "rgba(232, 30, 77, 0.6)";
      ctx.stroke();
      ctx.restore();

      // 7. Desenhar Logotipo no Centro Pulsante
      const logoSize = 100 + pulse * 12;
      const radius = logoSize / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      ctx.clip(); // Recortar redondo

      if (logoImgRef.current) {
        ctx.drawImage(
          logoImgRef.current,
          w / 2 - radius,
          h / 2 - radius,
          logoSize,
          logoSize
        );
      } else {
        // Fallback de texto se não carregar
        ctx.fillStyle = "#160624";
        ctx.fillRect(w / 2 - radius, h / 2 - radius, logoSize, logoSize);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("RÁDIO", w / 2, h / 2 - 10);
        ctx.fillStyle = "#e81e4d";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("ITAIMBÉ", w / 2, h / 2 + 8);
      }
      ctx.restore();

      // Borda Externa Grossa do Logotipo (Brilho Rosa/Cyan)
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 30, 77, ${0.85 + pulse * 0.15})`;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10 + pulse * 15;
      ctx.shadowColor = "rgba(232, 30, 77, 0.9)";
      ctx.stroke();
      ctx.restore();

      // 8. Notas Musicais Flutuantes Decorativas
      ctx.save();
      ctx.font = "16px sans-serif";
      const notes = ["🎵", "🎶", "🎵", "♩"];
      notes.forEach((note, idx) => {
        const noteAngle = time * 0.4 + idx * (Math.PI / 2);
        const noteDist = innerRadius + 45 + Math.sin(time * 2 + idx) * 8;
        const x = w / 2 + Math.cos(noteAngle) * noteDist;
        const y = h / 2 + Math.sin(noteAngle) * noteDist;
        ctx.globalAlpha = 0.2 + pulse * 0.35;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(232, 30, 77, 0.5)";
        ctx.fillText(note, x, y);
      });
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
  }, [isPlaying, analyserRef, isPaused]);

  return (
    <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] md:w-[330px] md:h-[330px] flex items-center justify-center bg-transparent">
      {/* Canvas Shader */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
