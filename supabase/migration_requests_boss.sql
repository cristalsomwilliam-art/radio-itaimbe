-- MIGRATION SQL: INTEGRATION RADIOBOSS AND SSD
-- Execute este script no SQL Editor do Supabase para atualizar a estrutura do banco de dados.

-- 1. Adicionar colunas de controle na tabela music_requests
ALTER TABLE public.music_requests 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'queued', 'not_found', 'error')),
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS status_message TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Permitir atualização (UPDATE) de pedidos por administradores ou service role / worker autenticado
CREATE POLICY "Permitir atualização de pedidos para admins/worker autenticados"
    ON public.music_requests FOR UPDATE
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 3. Adicionar trigger para updated_at em music_requests (caso já não exista)
DROP TRIGGER IF EXISTS on_music_requests_update ON public.music_requests;
CREATE TRIGGER on_music_requests_update BEFORE UPDATE ON public.music_requests 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 4. Criar a nova tabela de catálogo de músicas (music_catalog)
CREATE TABLE IF NOT EXISTS public.music_catalog (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artist TEXT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    duration INTEGER, -- Em segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar RLS em music_catalog
ALTER TABLE public.music_catalog ENABLE ROW LEVEL SECURITY;

-- 6. Adicionar políticas de RLS para music_catalog
CREATE POLICY "Permitir leitura pública de catálogo de músicas"
    ON public.music_catalog FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de catálogo para admins/worker autenticados"
    ON public.music_catalog FOR ALL
    USING (auth.role() = 'authenticated');

-- 7. Adicionar trigger para updated_at na tabela music_catalog
DROP TRIGGER IF EXISTS on_music_catalog_update ON public.music_catalog;
CREATE TRIGGER on_music_catalog_update BEFORE UPDATE ON public.music_catalog 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 8. Habilitar tempo real (Realtime) para a tabela music_catalog
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_catalog;
