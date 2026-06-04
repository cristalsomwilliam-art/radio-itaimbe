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

CREATE POLICY "Acesso de escrita para admins em banners"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banners')
WITH CHECK (bucket_id = 'banners');

-- 3. Políticas de Acesso para o Bucket 'hosts-photos'
CREATE POLICY "Acesso público de leitura para hosts-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hosts-photos');

CREATE POLICY "Acesso de escrita para admins em hosts-photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'hosts-photos')
WITH CHECK (bucket_id = 'hosts-photos');

-- 4. Políticas de Acesso para o Bucket 'news-covers'
CREATE POLICY "Acesso público de leitura para news-covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-covers');

CREATE POLICY "Acesso de escrita para admins em news-covers"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'news-covers')
WITH CHECK (bucket_id = 'news-covers');

-- 5. Políticas de Acesso para o Bucket 'videoclips-media'
CREATE POLICY "Acesso público de leitura para videoclips-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'videoclips-media');

CREATE POLICY "Acesso de escrita para admins em videoclips-media"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'videoclips-media')
WITH CHECK (bucket_id = 'videoclips-media');
