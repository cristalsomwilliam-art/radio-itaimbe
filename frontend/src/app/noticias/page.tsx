"use client";

import React from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface PortalItem {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  color: string;
  badge: string;
}

const portals: PortalItem[] = [
  {
    id: "g1",
    name: "G1 - Globo",
    description: "Notícias em tempo real sobre o Brasil, o mundo, economia, tecnologia, saúde, esportes e notícias regionais.",
    url: "https://g1.globo.com",
    image_url: "/g1_cover.png",
    color: "from-red-600 to-red-800 hover:border-red-500/40",
    badge: "Geral & Regional"
  },
  {
    id: "jovempan",
    name: "Jovem Pan News",
    description: "Opinião, debates, análises políticas em tempo real, esportes, entretenimento e transmissões ao vivo da emissora.",
    url: "https://jovempan.com.br",
    image_url: "/jovem_pan_cover.png",
    color: "from-[#e81e4d] to-rose-700 hover:border-rose-500/40",
    badge: "Política & Opinião"
  },
  {
    id: "revistaoeste",
    name: "Revista Oeste",
    description: "Jornalismo independente com análises sobre política, economia, defesa do livre mercado e da democracia.",
    url: "https://revistaoeste.com",
    image_url: "/revista_oeste_cover.png",
    color: "from-amber-500 to-yellow-600 hover:border-yellow-500/40",
    badge: "Análises & Economia"
  }
];

export default function NoticiasPage() {
  return (
    <div className="space-y-8 md:space-y-12">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#e81e4d]" />
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
            Portal de Notícias
          </h1>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 font-medium">
          Acompanhe os principais acontecimentos do país e do mundo através dos portais de notícias recomendados pela Rádio Itaimbé.
        </p>
      </div>

      {/* Grid de Portais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((portal) => (
          <a
            key={portal.id}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`glass-panel rounded-2xl overflow-hidden group flex flex-col h-full shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${portal.color}`}
          >
            {/* Imagem de Capa */}
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              <img
                src={portal.image_url}
                alt={portal.name}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 brightness-90"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-black/70 backdrop-blur-md text-[9px] font-black uppercase text-white px-2.5 py-1 rounded-full tracking-wider border border-white/10">
                  {portal.badge}
                </span>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm md:text-base font-black text-white group-hover:text-[#e81e4d] transition-colors leading-tight">
                  {portal.name}
                </h3>
                <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                  {portal.description}
                </p>
              </div>
              
              <div className="text-[10px] text-zinc-300 font-black uppercase tracking-wider flex items-center gap-1.5 self-start group-hover:text-white transition-colors bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                Acessar Portal <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

