import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.radioitaimbe.com.br"),
  title: "Rádio Itaimbé 87.9 FM | Rádio + TV Web",
  description:
    "Acompanhe a Rádio Itaimbé 87.9 FM ao vivo com transmissão de áudio e a TV Itaimbé com programação ao vivo em vídeo, notícias e eventos locais.",
  keywords: "rádio, tv web, itaimbé, 87.9 fm, rádio ao vivo, owncast, rádio boss",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.radioitaimbe.com.br",
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
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
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
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-10 overflow-x-hidden">
            {children}
          </main>

          {/* RODAPÉ DO SITE */}
          <Footer />
        </AudioProvider>
      </body>
    </html>
  );
}
