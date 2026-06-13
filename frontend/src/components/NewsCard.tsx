"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Newspaper, Calendar, X, ExternalLink, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";

interface ArticleItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
  fullContent?: string;
  portalName: string;
  portalId: string;
}

function formatRequestTime(createdAt: string): string {
  try {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  } catch {
    return "";
  }
}

function getFallbackImageUrl(portalId?: string): string {
  if (portalId === "jovempan") return "/jovem_pan_cover.png";
  if (portalId === "estadao") return "/estadao_cover.png";
  if (portalId === "oeste") return "/revista_oeste_cover.png";
  return "/estadao_cover.png";
}

export default function NewsCard() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Disparar eventos para pausar o visualizador de áudio quando um modal estiver aberto
  useEffect(() => {
    if (!!selectedArticle) {
      window.dispatchEvent(new CustomEvent("modal-open"));
    } else {
      window.dispatchEvent(new CustomEvent("modal-close"));
    }
    return () => {
      window.dispatchEvent(new CustomEvent("modal-close"));
    };
  }, [selectedArticle]);

  useEffect(() => {
    const fetchAllNews = async () => {
      setIsLoadingNews(true);
      try {
        const [estadaoRes, jpRes, oesteRes] = await Promise.all([
          fetch("/api/news-feed?portal=estadao").then((r) => r.json().catch(() => ({ items: [] }))),
          fetch("/api/news-feed?portal=jovempan").then((r) => r.json().catch(() => ({ items: [] }))),
          fetch("/api/news-feed?portal=oeste").then((r) => r.json().catch(() => ({ items: [] }))),
        ]);

        const merged: ArticleItem[] = [
          ...((estadaoRes && estadaoRes.items) || []).map((item: any) => ({
            ...item,
            portalName: "Estadão",
            portalId: "estadao",
          })),
          ...((jpRes && jpRes.items) || []).map((item: any) => ({
            ...item,
            portalName: "Jovem Pan",
            portalId: "jovempan",
          })),
          ...((oesteRes && oesteRes.items) || []).map((item: any) => ({
            ...item,
            portalName: "Revista Oeste",
            portalId: "oeste",
          })),
        ];

        // Ordenar por data (pubDate desc)
        merged.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();
          return dateB - dateA;
        });

        // Pegar as 8 mais recentes
        setArticles(merged.slice(0, 8));
      } catch (err) {
        console.error("Erro ao carregar notícias na Sidebar:", err);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchAllNews();
    // Atualizar a cada 10 minutos
    const interval = setInterval(fetchAllNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="bg-zinc-950/60 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[280px] justify-between">
        <div className="flex flex-col h-full justify-between min-h-0">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#e81e4d]" />
              <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                Últimas Notícias
              </h3>
            </div>

            <Link
              href="/noticias"
              className="text-[9px] font-black bg-[#e81e4d] text-white hover:bg-pink-600 transition-colors px-3 py-1 rounded-full uppercase tracking-widest shadow-md shadow-pink-500/10"
            >
              Ver Todas
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-2.5">
            {isLoadingNews ? (
              <div className="flex flex-col items-center justify-center py-12 gap-1.5">
                <Loader2 className="w-5 h-5 text-[#e81e4d] animate-spin" />
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                  Carregando notícias...
                </span>
              </div>
            ) : articles.length > 0 ? (
              articles.map((article, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedArticle(article)}
                  className="flex items-center justify-between gap-3 text-xs py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      <img
                        src={article.imageUrl || getFallbackImageUrl(article.portalId)}
                        alt={article.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImageUrl(article.portalId);
                        }}
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-bold text-zinc-100 truncate text-[11px] group-hover:text-[#e81e4d] transition-colors leading-tight">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-black bg-zinc-900 border border-white/10 text-zinc-400 px-1 py-0.2 rounded uppercase">
                          {article.portalName}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-medium">
                          {formatRequestTime(article.pubDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 text-center py-12 font-medium">
                Nenhuma notícia disponível no momento.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Notícia */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/85 md:backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-news-title"
            className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Topo / Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 flex-shrink-0">
              <span className="bg-[#e81e4d]/10 border border-[#e81e4d]/20 text-[#e81e4d] text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                {selectedArticle.portalName}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Fechar modal de notícia"
                className="text-zinc-400 hover:text-white transition-colors p-1.5 bg-white/5 hover:bg-white/10 rounded-full"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar my-4 space-y-4 min-h-0">
              <h2 id="modal-news-title" className="text-base md:text-xl font-black text-white leading-snug">
                {selectedArticle.title}
              </h2>

              <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 font-bold uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Publicado em{" "}
                  {(() => {
                    try {
                      const date = new Date(selectedArticle.pubDate);
                      if (isNaN(date.getTime())) return selectedArticle.pubDate;
                      return date.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return selectedArticle.pubDate;
                    }
                  })()}
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-zinc-900 flex-shrink-0">
                <img
                  src={selectedArticle.imageUrl || getFallbackImageUrl(selectedArticle.portalId)}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImageUrl(selectedArticle.portalId);
                  }}
                />
              </div>

              <div className="border-t border-white/5 pt-4">
                {selectedArticle.fullContent ? (
                  <div
                    className="news-content-body text-xs md:text-sm text-zinc-355 font-normal leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedArticle.fullContent, {
                        ALLOWED_TAGS: [
                          "p",
                          "br",
                          "strong",
                          "em",
                          "b",
                          "i",
                          "a",
                          "ul",
                          "ol",
                          "li",
                          "h1",
                          "h2",
                          "h3",
                          "h4",
                          "h5",
                          "h6",
                          "img",
                          "blockquote",
                          "figure",
                          "figcaption",
                          "span",
                          "div",
                          "table",
                          "thead",
                          "tbody",
                          "tr",
                          "th",
                          "td",
                          "caption",
                          "sup",
                          "sub",
                          "pre",
                          "code",
                          "hr",
                        ],
                        ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel", "title", "width", "height", "loading"],
                        ALLOW_DATA_ATTR: false,
                      }),
                    }}
                  />
                ) : (
                  <p className="text-xs md:text-sm text-[#ceced2] font-normal leading-relaxed whitespace-pre-line">
                    {selectedArticle.description || "Nenhum resumo disponível para esta notícia."}
                  </p>
                )}
              </div>
            </div>

            {/* Botões do Rodapé */}
            <div className="pt-4 border-t border-white/5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-full py-3 bg-[#e81e4d] hover:bg-pink-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-colors active:scale-98 text-center"
              >
                Voltar à Rádio
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
