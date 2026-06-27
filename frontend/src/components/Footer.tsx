"use client";

import React from "react";
import Link from "next/link";
import { Radio, Tv, Mail, Shield, FileText, Instagram, Facebook, MessageCircle, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-zinc-950/80 border-t border-white/5 mt-auto backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Coluna 1: Info Rádio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#e81e4d]/10 border border-[#e81e4d]/25 flex items-center justify-center text-[#e81e4d]">
                <Radio className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <span className="text-base font-black tracking-widest text-white">
                ITAIMBÉ <span className="text-[#e81e4d]">FM</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-sm">
              Transmitindo a melhor programação musical, notícias locais e eventos de Cambará do Sul/RS. Acompanhe a nossa Rádio 87.9 FM e a TV Itaimbé ao vivo pelo nosso site.
            </p>
            {/* Redes Sociais */}
            <div className="flex items-center gap-3.5 pt-2">
              <a
                href="https://www.instagram.com/radioitaimbe/?hl=pt-br"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#e81e4d] hover:bg-white/10 hover:border-white/10 transition-all hover:scale-105 active:scale-95"
                title="Siga no Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/R.Itaimbe879"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:bg-white/10 hover:border-white/10 transition-all hover:scale-105 active:scale-95"
                title="Curta no Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://chat.whatsapp.com/FtE7lIlyrwX2EFM5J6Ib9E"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-green-500 hover:bg-white/10 hover:border-white/10 transition-all hover:scale-105 active:scale-95"
                title="Entre no Grupo do WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#e81e4d] pl-2.5">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-bold">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 bg-[#e81e4d] rounded-full scale-0 group-hover:scale-100 transition-all duration-300"></span>
                  Início
                </Link>
              </li>
              <li>
                <Link href="/programacao" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 bg-[#e81e4d] rounded-full scale-0 group-hover:scale-100 transition-all duration-300"></span>
                  Programação
                </Link>
              </li>
              <li>
                <Link href="/noticias" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 bg-[#e81e4d] rounded-full scale-0 group-hover:scale-100 transition-all duration-300"></span>
                  Notícias
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <span className="w-1 h-1 bg-[#e81e4d] rounded-full scale-0 group-hover:scale-100 transition-all duration-300"></span>
                  Central de Ajuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional / Políticas */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-[#e81e4d] pl-2.5">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-bold">
              <li>
                <Link href="/politica-de-privacidade" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <Shield className="w-3.5 h-3.5 text-[#e81e4d]/60 group-hover:text-[#e81e4d] transition-colors" />
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-servico" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <FileText className="w-3.5 h-3.5 text-[#e81e4d]/60 group-hover:text-[#e81e4d] transition-colors" />
                  Termos de Uso
                </Link>
              </li>
              <li>
                <a href="mailto:contato@radioitaimbe.com.br" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <Mail className="w-3.5 h-3.5 text-[#e81e4d]/60 group-hover:text-[#e81e4d] transition-colors" />
                  Fale Conosco
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Rodapé / Direitos Autorais */}
        <div className="border-t border-white/5 mt-10 md:mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          <p>© {currentYear} Rádio Itaimbé. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Feito com <Heart className="w-3.5 h-3.5 text-[#e81e4d] fill-[#e81e4d]" /> em Cambará do Sul
          </p>
        </div>
      </div>
    </footer>
  );
}
