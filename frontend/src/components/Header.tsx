"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAudio } from "@/context/AudioContext";
import { Tv, Calendar, Newspaper, HelpCircle } from "lucide-react";

export default function Header() {
  const { listenersCount } = useAudio();
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isProgramacao = pathname === "/programacao";
  const isNoticias = pathname.startsWith("/noticias");
  const isAdmin = pathname.startsWith("/admin");
  const isAjuda = pathname === "/ajuda";

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-800/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo (Mockup Style) */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full border border-zinc-700/50 bg-zinc-950 overflow-hidden shadow-lg shadow-pink-500/10 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.jpg" alt="Logo Rádio Itaimbé" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white leading-none">
              ITAIMBÉ FM
            </span>
            <span className="text-[9px] font-bold text-[#e81e4d] tracking-wider mt-0.5">
              87.9 FM
            </span>
          </div>
        </Link>

        {/* Menu de Navegação e Contador de Ouvintes */}
        <div className="flex items-center gap-4">
          <nav aria-label="Navegação principal" className="flex items-center gap-1 md:gap-2">
            <Link
              href="/"
              aria-current={isHome ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-bold transition-all ${
                isHome ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-[#e81e4d]" />
              <span>Ao Vivo</span>
              {isHome && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] rounded-full"></span>
              )}
            </Link>
            
            <Link
              href="/programacao"
              aria-current={isProgramacao ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-bold transition-all ${
                isProgramacao ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Programação</span>
              {isProgramacao && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] rounded-full"></span>
              )}
            </Link>

            <Link
              href="/noticias"
              aria-current={isNoticias ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-bold transition-all ${
                isNoticias ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-blue-400" />
              <span>Notícias</span>
              {isNoticias && (
                <span className="absolute bottom-[-16px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#e81e4d] to-[#ff2d55] rounded-full"></span>
              )}
            </Link>

            <Link
              href="/ajuda"
              aria-current={isAjuda ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-black rounded-full transition-all border ${
                isAjuda
                  ? "bg-[#e81e4d] text-white border-[#e81e4d] shadow-lg shadow-pink-500/25"
                  : "bg-white/5 hover:bg-[#e81e4d]/10 text-zinc-300 hover:text-[#e81e4d] border-white/5 hover:border-[#e81e4d]/30"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#e81e4d]" />
              <span>Como Ouvir / Ajuda</span>
            </Link>

          </nav>

          {/* Pill Badge: Ouvintes Online (Mockup Style) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800/80 px-3 py-1.5 rounded-full text-[9px] font-black text-zinc-300 uppercase tracking-widest shadow-md">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>{listenersCount} ouvintes online</span>
          </div>
        </div>

      </div>
    </header>
  );
}
