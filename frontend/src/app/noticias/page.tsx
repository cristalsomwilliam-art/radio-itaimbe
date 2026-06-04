"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  image_url: string | null;
  published_at: string;
}

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("id, title, excerpt, slug, image_url, published_at")
        .order("published_at", { ascending: false });

      if (data && !error) {
        setNews(data as NewsItem[]);
      } else if (error) {
        console.error("Erro ao buscar notícias:", error);
      }
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary-400" />
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
            Portal de Notícias
          </h1>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 font-medium">
          Acompanhe os acontecimentos, novidades e eventos na nossa rádio e em toda a região.
        </p>
      </div>

      {/* Grid de Notícias */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Carregando notícias...</span>
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/noticias/${item.slug}`}
              className="glass-panel rounded-xl overflow-hidden group hover:border-zinc-700/50 flex flex-col h-full shadow-lg transition-all"
            >
              <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-950 font-bold text-[10px] tracking-wider">
                    RADIO ITAIMBÉ 87.9
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-zinc-500">
                    {new Date(item.published_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-primary-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-normal leading-relaxed line-clamp-3 mt-1.5 font-normal">
                    {item.excerpt}
                  </p>
                </div>
                <div className="text-[10px] text-accent-400 font-bold uppercase tracking-wider mt-4 flex items-center gap-0.5">
                  Ler Reportagem <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 font-medium">Nenhuma notícia publicada no momento.</p>
        </div>
      )}
    </div>
  );
}
