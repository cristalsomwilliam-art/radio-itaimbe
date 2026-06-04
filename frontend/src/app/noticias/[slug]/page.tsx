"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Newspaper, ArrowLeft, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NewsDetail {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  published_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function NoticiaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;

    const fetchNewsDetail = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select(`
          id,
          title,
          excerpt,
          content,
          image_url,
          published_at,
          profiles (
            full_name
          )
        `)
        .eq("slug", params.slug)
        .single();

      if (data && !error) {
        setNews(data as unknown as NewsDetail);
      } else if (error) {
        console.error("Erro ao buscar detalhes da notícia:", error);
      }
      setIsLoading(false);
    };

    fetchNewsDetail();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-zinc-500 font-medium">Carregando conteúdo...</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-bold text-white">Notícia não encontrada</h2>
        <p className="text-sm text-zinc-400">A reportagem solicitada não existe ou foi removida.</p>
        <button
          onClick={() => router.push("/noticias")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-450 uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Portal
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Botão de Retorno */}
      <button
        onClick={() => router.push("/noticias")}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para notícias
      </button>

      {/* Título & Metadados */}
      <div className="space-y-3">
        <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
          {news.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-medium border-y border-zinc-900 py-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>
              {new Date(news.published_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {news.profiles?.full_name && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-zinc-500" />
              <span>Por: {news.profiles.full_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Capa Ampliada */}
      {news.image_url && (
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Resumo/Subtítulo */}
      {news.excerpt && (
        <p className="text-base md:text-lg font-medium text-zinc-300 leading-relaxed border-l-4 border-primary-500 pl-4 py-1 italic bg-zinc-900/10 rounded-r-lg">
          {news.excerpt}
        </p>
      )}

      {/* Conteúdo Principal da Matéria */}
      <div className="text-sm md:text-base text-zinc-350 leading-relaxed space-y-4 whitespace-pre-wrap font-normal">
        {news.content}
      </div>
    </article>
  );
}
