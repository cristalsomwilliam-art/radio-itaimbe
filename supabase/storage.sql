-- CONFIGURAÇÃO DE BUCKETS DO SUPABASE STORAGE
-- Para criação automatizada e definição de políticas de acesso público e privado

-- 1. Criação dos Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('banners', 'banners', true),
  ('hosts-photos', 'hosts-photos', true),
  ('news-covers', 'news-covers', true),
  ('videoclips-media', 'videoclips-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Acesso para o Bucket 'banners'
CREATE POLICY "Acesso público de leitura para banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Acesso de escrita apenas para o administrador em banners"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banners' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'banners' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- 3. Políticas de Acesso para o Bucket 'hosts-photos'
CREATE POLICY "Acesso público de leitura para hosts-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hosts-photos');

CREATE POLICY "Acesso de escrita apenas para o administrador em hosts-photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'hosts-photos' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'hosts-photos' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- 4. Políticas de Acesso para o Bucket 'news-covers'
CREATE POLICY "Acesso público de leitura para news-covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-covers');

CREATE POLICY "Acesso de escrita apenas para o administrador em news-covers"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'news-covers' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'news-covers' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));

-- 5. Políticas de Acesso para o Bucket 'videoclips-media'
CREATE POLICY "Acesso público de leitura para videoclips-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'videoclips-media');

CREATE POLICY "Acesso de escrita apenas para o administrador em videoclips-media"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'videoclips-media' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'))
WITH CHECK (bucket_id = 'videoclips-media' AND (auth.jwt() ->> 'email' = 'cristalsomwilliam@gmail.com'));
