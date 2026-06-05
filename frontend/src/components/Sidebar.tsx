"use client";

import React from "react";
import Link from "next/link";
import { Music, Play, MessageCircle } from "lucide-react";

interface SongHistoryItem {
  title: string;
  artist: string;
  time: string;
}

interface SidebarProps {
  songHistory: SongHistoryItem[];
  layout?: "vertical" | "horizontal";
}

export default function Sidebar({ songHistory, layout = "vertical" }: SidebarProps) {
  const containerClass =
    layout === "horizontal"
      ? "grid grid-cols-1 md:grid-cols-2 gap-5 w-full"
      : "flex flex-col justify-between gap-5 h-full";

  return (
    <div className={containerClass}>
      {/* Card de Últimas Músicas */}
      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[280px] justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[#e81e4d]" />
              <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                Últimas Músicas
              </h3>
            </div>

            <Link
              href="/programacao"
              className="text-[9px] font-black bg-[#e81e4d] text-white hover:bg-pink-600 transition-colors px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-pink-500/10"
            >
              Ver Todas
            </Link>
          </div>

          {songHistory && songHistory.length > 0 ? (
            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
              {songHistory.map((song, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      <Play className="w-3 h-3 text-[#e81e4d] opacity-0 group-hover:opacity-100 transition-opacity absolute fill-[#e81e4d]" />
                      <Music className="w-3.5 h-3.5 text-zinc-600 group-hover:opacity-0 transition-opacity" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-100 truncate text-[11px] group-hover:text-[#e81e4d] transition-colors">
                        {song.title}
                      </p>
                      <p className="text-[9px] text-zinc-500 truncate mt-0.5 font-medium">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Mini Equalizador animado */}
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] text-zinc-500 font-bold whitespace-nowrap">
                      {song.time}
                    </span>
                    <div className="flex items-end gap-[1.5px] h-3 w-3.5">
                      <span className="w-[1.5px] bg-[#e81e4d] rounded-full animate-[bounce_0.8s_infinite_100ms] h-full"></span>
                      <span className="w-[1.5px] bg-[#e81e4d] rounded-full animate-[bounce_0.8s_infinite_300ms] h-3/5"></span>
                      <span className="w-[1.5px] bg-[#e81e4d] rounded-full animate-[bounce_0.8s_infinite_500ms] h-4/5"></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 text-center py-8 font-medium">
              Nenhum histórico disponível.
            </p>
          )}
        </div>
      </div>

      {/* Card Peça Sua Música */}
      <div className="bg-gradient-to-br from-[#8b5cf6] via-[#4c1d95] to-[#1e1b4b] border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden group min-h-[145px] flex flex-col justify-between h-[280px] lg:h-auto">
        {/* Decorações neon */}
        <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-pink-500/25 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
        <div className="absolute left-[-30px] bottom-[-30px] w-28 h-28 bg-[#22d3ee]/20 rounded-full blur-2xl"></div>

        <div className="z-10">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Peça sua música
          </h3>
          <p className="text-[10px] text-zinc-300 mt-2 leading-relaxed max-w-[200px]">
            Participe da nossa programação! Envie seu recado e peça seu som no WhatsApp.
          </p>
        </div>

        <a
          href="https://wa.me/555535541179?text=Olá!%20Estou%20ouvindo%20a%20Itaimbé%20FM,%20gostaria%20de%20pedir%20uma%20música!"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#e81e4d] text-white hover:bg-pink-600 transition-all font-black text-[9px] px-5 py-2.5 rounded-full uppercase tracking-widest self-start flex items-center gap-1.5 shadow-lg shadow-black/20 mt-4 z-10 active:scale-95"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          Pedir Música
        </a>
      </div>
    </div>
  );
}
