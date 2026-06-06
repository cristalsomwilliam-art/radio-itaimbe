"use client";

import React, { useState, useEffect } from "react";
import { Newspaper, ExternalLink, ArrowLeft, Loader2, Calendar } from "lucide-react";

interface PortalItem {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  color: string;
  badge: string;
}

interface ArticleItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
  fullContent?: string;
}

const portals: PortalItem[] = [
  {
    id: "estadao",
    name: "Estadão",
    description: "Notícias em tempo real sobre o Brasil, o mundo, economia, política, cultura e a cobertura dos acontecimentos gerais e regionais.",
    url: "https://www.estadao.com.br",
    image_url: "/estadao_cover.png",
    color: "from-blue-700 to-slate-800 hover:border-blue-500/40",
    badge: "Geral & Regional"
  },
  {
    id: "jovempan",
    name: "Jovem Pan News",
    description: "Análises em tempo real, economia, debates, esportes, entretenimento e transmissões ao vivo da emissora.",
    url: "https://jovempan.com.br",
    image_url: "/jovem_pan_cover.png",
    color: "from-[#e81e4d] to-rose-700 hover:border-rose-500/40",
    badge: "Análises & Economia"
  },
  {
    id: "oeste",
    name: "Revista Oeste",
    description: "Jornalismo independente com opinião, debates e análises políticas e econômicas em defesa do livre mercado e da democracia.",
    url: "https://revistaoeste.com",
    image_url: "/revista_oeste_cover.png",
    color: "from-amber-500 to-yellow-600 hover:border-yellow-500/40",
    badge: "Política & Opinião"
  }
];

export default function NoticiasPage() {
  const [selectedPortal, setSelectedPortal] = useState<PortalItem | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar notícias do portal selecionado
  useEffect(() => {
    if (!selectedPortal) {
      setArticles([]);
      setSelectedArticle(null);
      setError(null);
      return;
    }

    const fetchFeed = async () => {
      setIsLoadingFeed(true);
      setError(null);
      try {
        const res = await fetch(`/api/news-feed?portal=${selectedPortal.id}`);
        if (!res.ok) throw new Error("Erro ao carregar notícias.");
        const data = await res.json();
        setArticles(data.items || []);
      } catch (err: any) {
        setError("Não foi possível carregar as notícias desse portal. Tente novamente mais tarde.");
        console.error(err);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    fetchFeed();
  }, [selectedPortal]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // fallback
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. VIEW DE LEITURA DO ARTIGO SELECIONADO */}
      {selectedArticle && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-900/60 px-4 py-2.5 rounded-full border border-zinc-800/80 active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para as Manchetes
          </button>

          <article className="glass-panel rounded-3xl overflow-hidden border border-zinc-850 shadow-2xl p-6 md:p-10 space-y-6 max-w-3xl mx-auto">
            <div className="space-y-3">
              <span className="bg-[#e81e4d]/10 border border-[#e81e4d]/20 text-[#e81e4d] text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                {selectedPortal?.name}
              </span>
              <h1 className="text-lg md:text-2xl font-black text-white leading-snug">
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>Publicado em {formatDate(selectedArticle.pubDate)}</span>
              </div>
            </div>

            {selectedArticle.imageUrl && (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800/50 bg-zinc-950">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = selectedPortal?.image_url || "/estadao_cover.png";
                  }}
                />
              </div>
            )}

            <div className="space-y-6 border-t border-zinc-800/60 pt-6">
              {selectedArticle.fullContent ? (
                <div 
                  className="news-content-body text-sm md:text-base text-zinc-300 font-normal leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.fullContent }}
                />
              ) : (
                <p className="text-sm md:text-base text-zinc-300 font-normal leading-relaxed whitespace-pre-line">
                  {selectedArticle.description || "Nenhum resumo disponível para esta notícia."}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/40">
                <a
                  href={selectedArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#e81e4d] text-white hover:bg-pink-600 transition-all font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 active:scale-98"
                >
                  Ler Notícia Completa no {selectedPortal?.name} <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-black text-xs rounded-xl uppercase tracking-wider active:scale-98"
                >
                  Voltar
                </button>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* 2. VIEW DO FEED DE NOTÍCIAS (MANCHETES DO PORTAL SELECIONADO) */}
      {!selectedArticle && selectedPortal && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
            <button
              onClick={() => setSelectedPortal(null)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors bg-zinc-900/60 px-4 py-2.5 rounded-full border border-zinc-800/80 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Escolher Outro Portal
            </button>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
              Manchetes do Dia
            </span>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Header do Portal */}
            <div className="flex items-center gap-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-800/60 bg-zinc-900 flex-shrink-0">
                <img src={selectedPortal.image_url} alt={selectedPortal.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider">{selectedPortal.name}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedPortal.description}</p>
              </div>
            </div>

            {/* Lista com Barra de Rolagem */}
            {isLoadingFeed ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-[#e81e4d] animate-spin" />
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Buscando manchetes...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-2xl max-w-xl mx-auto p-6 space-y-4">
                <p className="text-xs text-zinc-400 font-medium">{error}</p>
                <button
                  onClick={() => setSelectedPortal({ ...selectedPortal })}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase rounded-lg text-white"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {articles.map((article, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedArticle(article)}
                    className="glass-panel p-4 rounded-xl border border-zinc-900/50 hover:border-zinc-800/60 hover:bg-zinc-900/20 transition-all duration-300 cursor-pointer flex gap-4 items-center group"
                  >
                    {article.imageUrl && (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-zinc-800/60 bg-zinc-950 flex-shrink-0">
                        <img 
                          src={article.imageUrl} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                          onError={(e) => {
                            e.currentTarget.src = selectedPortal?.image_url || "/estadao_cover.png";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase">
                        {formatDate(article.pubDate)}
                      </span>
                      <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-[#e81e4d] transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {article.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500 text-xs font-medium">Nenhuma notícia encontrada nesse momento.</div>
            )}
          </div>
        </div>
      )}

      {/* 3. VIEW DE SELEÇÃO DOS PORTAIS DE NOTÍCIAS */}
      {!selectedArticle && !selectedPortal && (
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
              <div
                key={portal.id}
                onClick={() => setSelectedPortal(portal)}
                className={`glass-panel rounded-2xl overflow-hidden group flex flex-col h-full shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer border border-zinc-900`}
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
                    Ver Manchetes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


