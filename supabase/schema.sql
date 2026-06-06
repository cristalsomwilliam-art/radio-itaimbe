-- DATABASE SCHEMA: RÁDIO ITAIMBÉ 87.9 FM
-- Para uso no PostgreSQL / Supabase

-- Habilitar a extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------------
-- 1. TABELA DE PERFIS DE ADMINISTRADORES
---------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de perfis pelos próprios administradores"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Permitir leitura pública de perfis"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Permitir atualização de perfis pelos próprios administradores"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

---------------------------------------------------------
-- 2. TABELA DE LOCUTORES (HOSTS)
---------------------------------------------------------
CREATE TABLE public.hosts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    social_instagram TEXT,
    social_facebook TEXT,
    social_whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em hosts
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de locutores"
    ON public.hosts FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de locutores apenas para o administrador"
    ON public.hosts FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- 3. TABELA DE PROGRAMAÇÃO (SCHEDULES)
---------------------------------------------------------
CREATE TABLE public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES public.hosts(id) ON DELETE SET NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública da programação"
    ON public.schedules FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de programação apenas para o administrador"
    ON public.schedules FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- 4. TABELA DE NOTÍCIAS (NEWS)
---------------------------------------------------------
CREATE TABLE public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de notícias"
    ON public.news FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de notícias apenas para o administrador"
    ON public.news FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- 5. TABELA DE VIDEOCLIPES (VIDEOCLIPS)
---------------------------------------------------------
CREATE TABLE public.videoclips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    video_url TEXT NOT NULL, -- URL do arquivo MP4 ou link externo
    duration INTEGER, -- Duração em segundos (opcional)
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em videoclips
ALTER TABLE public.videoclips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de videoclipes"
    ON public.videoclips FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de videoclipes apenas para o administrador"
    ON public.videoclips FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- 6. TABELA DE BANNERS E PATROCÍNIOS (BANNERS)
---------------------------------------------------------
CREATE TABLE public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    position TEXT DEFAULT 'home' NOT NULL, -- 'home_top', 'sidebar', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de banners"
    ON public.banners FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de banners apenas para o administrador"
    ON public.banners FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- 7. TABELA DE ESTADO DE STREAMING (STREAM_STATUS)
---------------------------------------------------------
CREATE TABLE public.stream_status (
    id TEXT PRIMARY KEY DEFAULT 'main', -- Chave fixa para registro único
    -- Rádio
    current_song TEXT DEFAULT 'Programação Musical' NOT NULL,
    current_artist TEXT DEFAULT 'Rádio Itaimbé' NOT NULL,
    album_art TEXT,
    listeners_count INTEGER DEFAULT 0 NOT NULL,
    next_song TEXT,
    song_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    -- TV (Owncast)
    tv_online BOOLEAN DEFAULT false NOT NULL,
    tv_viewers_count INTEGER DEFAULT 0 NOT NULL,
    tv_stream_title TEXT DEFAULT 'Transmissão ao Vivo' NOT NULL,
    -- Configurações e Overlays
    show_logo_overlay BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir o estado inicial padrão
INSERT INTO public.stream_status (id, current_song, current_artist, tv_online)
VALUES ('main', 'Programação Musical', 'Rádio Itaimbé 87.9 FM', false)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS em stream_status
ALTER TABLE public.stream_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública do status da rádio"
    ON public.stream_status FOR SELECT
    USING (true);

CREATE POLICY "Permitir controle total de status apenas para o administrador"
    ON public.stream_status FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

---------------------------------------------------------
-- TRIGGERS PARA DATA DE ATUALIZAÇÃO (updated_at)
---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_hosts_update BEFORE UPDATE ON public.hosts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_schedules_update BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_news_update BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER on_stream_status_update BEFORE UPDATE ON public.stream_status FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

---------------------------------------------------------
-- TRIGGER PARA SINCRONIZAR AUTH.USERS COM PROFILES
---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

---------------------------------------------------------
-- 8. TABELA DE MENSAGENS DO CHAT (CHAT_MESSAGES)
---------------------------------------------------------
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 300),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para chat_messages
CREATE POLICY "Permitir leitura pública de mensagens do chat"
    ON public.chat_messages FOR SELECT
    USING (true);

CREATE POLICY "Permitir envio de mensagens por usuários logados"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Permitir exclusão de mensagens apenas para o administrador"
    ON public.chat_messages FOR DELETE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Habilitar tempo real (Realtime) para chat_messages no Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

---------------------------------------------------------
-- 9. TABELA DE PEDIDOS DE MÚSICA (MUSIC_REQUESTS)
-- Mural de recados e pedidos de música
---------------------------------------------------------
CREATE TABLE public.music_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 50),
    song_title TEXT NOT NULL CHECK (char_length(trim(song_title)) > 0 AND char_length(song_title) <= 150),
    message TEXT CHECK (char_length(message) <= 300),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'queued', 'not_found', 'error')),
    file_path TEXT,
    status_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em music_requests
ALTER TABLE public.music_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para music_requests
CREATE POLICY "Permitir leitura pública de pedidos de música"
    ON public.music_requests FOR SELECT
    USING (true);

-- Permitir inserção pública de pedidos de música"
CREATE POLICY "Permitir inserção pública de pedidos de música"
    ON public.music_requests FOR INSERT
    WITH CHECK (true);

-- Permitir atualização e exclusão de pedidos apenas para o administrador
CREATE POLICY "Permitir atualização de pedidos apenas para o administrador"
    ON public.music_requests FOR UPDATE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

CREATE POLICY "Permitir exclusão de pedidos apenas para o administrador"
    ON public.music_requests FOR DELETE
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Trigger para atualizar updated_at em music_requests
CREATE TRIGGER on_music_requests_update BEFORE UPDATE ON public.music_requests FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Habilitar tempo real (Realtime) para music_requests no Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_requests;

---------------------------------------------------------
-- 10. TABELA DE CATÁLOGO DE MÚSICAS DO SSD (MUSIC_CATALOG)
---------------------------------------------------------
CREATE TABLE public.music_catalog (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artist TEXT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT,
    duration INTEGER, -- Em segundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em music_catalog
ALTER TABLE public.music_catalog ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para music_catalog
CREATE POLICY "Permitir leitura pública de catálogo de músicas"
    ON public.music_catalog FOR SELECT
    USING (true);

-- Permitir controle total de catálogo apenas para o administrador
CREATE POLICY "Permitir controle total de catálogo apenas para o administrador"
    ON public.music_catalog FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Trigger para atualizar updated_at em music_catalog
CREATE TRIGGER on_music_catalog_update BEFORE UPDATE ON public.music_catalog FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Habilitar tempo real (Realtime) para music_catalog no Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.music_catalog;

---------------------------------------------------------
-- 11. TABELA DE CONFIGURAÇÃO DO SOCIAL STREAM NINJA (SOCIAL_STREAM_CONFIG)
---------------------------------------------------------
CREATE TABLE public.social_stream_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    session_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em social_stream_config
ALTER TABLE public.social_stream_config ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para social_stream_config
CREATE POLICY "Permitir controle total apenas para o administrador"
    ON public.social_stream_config FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Inserir registro padrão se não existir
INSERT INTO public.social_stream_config (id, session_id)
VALUES ('main', NULL)
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at em social_stream_config
CREATE TRIGGER on_social_stream_config_update 
    BEFORE UPDATE ON public.social_stream_config 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.handle_updated_at();

