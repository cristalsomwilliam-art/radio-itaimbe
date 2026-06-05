import type { Metadata } from "next";
import "./globals.css";
import Player from "@/components/Player";
import Link from "next/link";
import { Radio, Tv, Calendar, Newspaper, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Rádio Itaimbé 87.9 FM | Rádio + TV Web",
  description:
    "Acompanhe a Rádio Itaimbé 87.9 FM ao vivo com transmissão de áudio e a TV Itaimbé com programação ao vivo em vídeo, notícias e eventos locais.",
  keywords: "rádio, tv web, itaimbé, 87.9 fm, rádio ao vivo, owncast, rádio boss",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://radioitaimbe.com.br",
    title: "Rádio Itaimbé 87.9 FM | Rádio + TV Web",
    description: "Transmissão ao vivo de áudio e vídeo, notícias, programação e interação em tempo real.",
    siteName: "Rádio Itaimbé",
    images: [
      {
        url: "https://images.unsplash.com/photo-1610116306796-6ebd30d779c6?q=80&w=1200",
        width: 1200,
        height: 630,
        alt: "Logo Rádio Itaimbé 87.9 FM",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-premium-dark min-h-screen text-zinc-100 flex flex-col antialiased">
        {/* CABEÇALHO / NAVBAR */}
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-zinc-800/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-zinc-700/50 bg-zinc-950 overflow-hidden shadow-lg shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.jpg" alt="Logo Rádio Itaimbé" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-widest text-white leading-none">
                  ITAIMBÉ
                </span>
                <span className="text-[10px] font-bold text-primary-400 tracking-wider">
                  87.9 FM
                </span>
              </div>
            </Link>

            {/* Menu de Navegação */}
            <nav className="flex items-center gap-1 md:gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <Tv className="w-4 h-4 text-accent-400" />
                <span>Ao Vivo</span>
              </Link>
              <Link
                href="/programacao"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <Calendar className="w-4 h-4 text-primary-400" />
                <span>Programação</span>
              </Link>
              <Link
                href="/noticias"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <Newspaper className="w-4 h-4 text-purple-400" />
                <span>Notícias</span>
              </Link>
              <div className="w-px h-5 bg-zinc-800 mx-1 md:mx-2 hidden sm:block"></div>
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-32">
          {children}
        </main>

        {/* PLAYER DE ÁUDIO PERSISTENTE NO RODAPÉ */}
        <Player />
      </body>
    </html>
  );
}
