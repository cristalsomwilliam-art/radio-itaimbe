-- =============================================================================
-- ÍNDICES DE PERFORMANCE — Rádio Itaimbé
-- Criado: 2026-06-12
-- Descrição: Índices para otimizar consultas frequentes identificadas na auditoria.
-- =============================================================================

-- 🔴 CRÍTICO: Polled a cada 5 segundos pelo request_worker.py
-- Sem este índice, cada poll faz um full table scan em music_requests.
CREATE INDEX IF NOT EXISTS idx_music_requests_status 
  ON public.music_requests(status);

-- 🟡 ALTO: Usado para ordenação de pedidos recentes
CREATE INDEX IF NOT EXISTS idx_music_requests_created_at 
  ON public.music_requests(created_at DESC);

-- 🟡 ALTO: Consulta de programação por dia e horário
CREATE INDEX IF NOT EXISTS idx_schedules_day_time 
  ON public.schedules(day_of_week, start_time, end_time);

-- 🟡 MÉDIO: Ordenação de notícias por data
CREATE INDEX IF NOT EXISTS idx_news_published_at 
  ON public.news(published_at DESC);

-- 🟡 MÉDIO: Ordenação de mensagens do chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
  ON public.chat_messages(created_at DESC);

-- 🟢 BAIXO: Filtro de banners ativos + ordenação por posição
CREATE INDEX IF NOT EXISTS idx_banners_active_position 
  ON public.banners(active, position);

-- =============================================================================
-- INSTRUÇÃO: Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard → seu projeto → SQL Editor
-- Cole e execute todo o conteúdo deste arquivo.
-- =============================================================================
