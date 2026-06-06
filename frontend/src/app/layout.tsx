import type { Metadata } from "next";
import "./globals.css";
import Player from "@/components/Player";
import Header from "@/components/Header";
import { AudioProvider } from "@/context/AudioContext";

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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
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
        <AudioProvider>
          {/* CABEÇALHO / NAVBAR DINÂMICA */}
          <Header />

          {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-32">
            {children}
          </main>

          {/* PLAYER DE ÁUDIO PERSISTENTE NO RODAPÉ */}
          <Player />
        </AudioProvider>
      </body>
    </html>
  );
}
