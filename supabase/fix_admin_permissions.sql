-- SCRIPT DE CORREÇÃO DE PERMISSÕES ADMINISTRATIVAS E RLS
-- RÁDIO ITAIMBÉ 87.9 FM
-- Execute este script no SQL Editor do seu painel do Supabase para aplicar as correções.

-- =====================================================================
-- 1. LIMPEZA DAS POLÍTICAS ANTIGAS (DROP)
-- =====================================================================

-- Tabelas do schema public
DROP POLICY IF EXISTS "Permitir controle total para admins autenticados" ON public.hosts;
DROP POLICY IF EXISTS "Permitir controle total de programação para admins autenticados" ON public.schedules;
DROP POLICY IF EXISTS "Permitir controle total de notícias para admins autenticados" ON public.news;
DROP POLICY IF EXISTS "Permitir controle total de videoclipes para admins autenticados" ON public.videoclips;
DROP POLICY IF EXISTS "Permitir controle total de banners para admins autenticados" ON public.banners;
DROP POLICY IF EXISTS "Permitir controle total de status para admins autenticados" ON public.stream_status;
DROP POLICY IF EXISTS "Permitir atualização de status para admins autenticados" ON public.stream_status;
DROP POLICY IF EXISTS "Permitir controle total de catálogo para admins/worker autenticados" ON public.music_catalog;

-- Pedidos de música e chat
DROP POLICY IF EXISTS "Permitir exclusão de pedidos por moderadores/admins" ON public.music_requests;
DROP POLICY IF EXISTS "Permitir atualização de pedidos para admins/worker autenticados" ON public.music_requests;
DROP POLICY IF EXISTS "Permitir exclusão de mensagens por moderadores/admins" ON public.chat_messages;

-- Storage (storage.objects)
DROP POLICY IF EXISTS "Acesso de escrita para admins em banners" ON storage.objects;
DROP POLICY IF EXISTS "Acesso de escrita para admins em hosts-photos" ON storage.objects;
DROP POLICY IF EXISTS "Acesso de escrita para admins em news-covers" ON storage.objects;
DROP POLICY IF EXISTS "Acesso de escrita para admins em videoclips-media" ON storage.objects;


-- =====================================================================
-- 2. CRIAÇÃO DAS NOVAS POLÍTICAS DE RLS RESTRITAS AO ADMINISTRADOR
-- =====================================================================

-- Tabela: hosts (Locutores)
CREATE POLICY "Permitir controle total de locutores apenas para o administrador"
    ON public.hosts FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: schedules (Programação)
CREATE POLICY "Permitir controle total de programação apenas para o administrador"
    ON public.schedules FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: news (Notícias)
CREATE POLICY "Permitir controle total de notícias apenas para o administrador"
    ON public.news FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: videoclips (Videoclipes)
CREATE POLICY "Permitir controle total de videoclipes apenas para o administrador"
    ON public.videoclips FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: banners (Banners e Patrocínios)
CREATE POLICY "Permitir controle total de banners apenas para o administrador"
    ON public.banners FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: stream_status (Estado de Streaming da Rádio/TV)
CREATE POLICY "Permitir controle total de status apenas para o administrador"
    ON public.stream_status FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: music_catalog (Catálogo SSD)
CREATE POLICY "Permitir controle total de catálogo apenas para o administrador"
    ON public.music_catalog FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: chat_messages (Exclusão de mensagens do chat)
CREATE POLICY "Permitir exclusão de mensagens apenas para o administrador"
    ON public.chat_messages FOR DELETE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Tabela: music_requests (Exclusão e Atualização de Pedidos no Mural)
CREATE POLICY "Permitir exclusão de pedidos apenas para o administrador"
    ON public.music_requests FOR DELETE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

CREATE POLICY "Permitir atualização de pedidos apenas para o administrador"
    ON public.music_requests FOR UPDATE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');


-- =====================================================================
-- 3. CRIAÇÃO DAS NOVAS POLÍTICAS DE STORAGE RESTRITAS AO ADMINISTRADOR
-- =====================================================================

-- Bucket: banners
CREATE POLICY "Acesso de escrita apenas para o administrador em banners"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banners' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'banners' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- Bucket: hosts-photos
CREATE POLICY "Acesso de escrita apenas para o administrador em hosts-photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'hosts-photos' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'hosts-photos' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- Bucket: news-covers
CREATE POLICY "Acesso de escrita apenas para o administrador em news-covers"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'news-covers' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'news-covers' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- Bucket: videoclips-media
CREATE POLICY "Acesso de escrita apenas para o administrador em videoclips-media"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'videoclips-media' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'videoclips-media' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));
