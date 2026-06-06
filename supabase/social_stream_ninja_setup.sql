-- Criar a tabela de configurações do Social Stream Ninja
CREATE TABLE IF NOT EXISTS public.social_stream_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    session_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.social_stream_config ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir controle total apenas para o administrador" ON public.social_stream_config;
CREATE POLICY "Permitir controle total apenas para o administrador"
    ON public.social_stream_config FOR ALL
    USING (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com');

-- Inserir registro padrão se não existir
INSERT INTO public.social_stream_config (id, session_id)
VALUES ('main', NULL)
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS on_social_stream_config_update ON public.social_stream_config;
CREATE TRIGGER on_social_stream_config_update 
    BEFORE UPDATE ON public.social_stream_config 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.handle_updated_at();
