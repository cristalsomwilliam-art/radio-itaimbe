const CACHE_NAME = 'radio-itaimbe-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-192x192.png',
  '/icon-maskable-512x512.png',
  '/apple-icon.png',
];

// Instalação do Service Worker e cache inicial dos assets básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar requisições que não sejam HTTP/HTTPS (extensões do Chrome, blobs, data URIs)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 2. EXCEÇÃO DE STREAMING E APIS (Não cachear em nenhuma hipótese!)
  // Ignorar streaming de áudio/vídeo, chamadas para o Supabase, websockets e rotas de API
  const isStreamingOrApi = 
    url.hostname.includes('caster.fm') ||
    url.hostname.includes('stream.radioitaimbe.com.br') ||
    url.hostname.includes('tv.radioitaimbe.com.br') ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api') ||
    event.request.headers.get('Accept')?.includes('text/event-stream');

  if (isStreamingOrApi) {
    // Ir direto para a rede sem passar pelo cache
    return;
  }

  // 3. Estratégia Cache-First para arquivos estáticos locais (CSS, JS, Imagens de layout, Fontes)
  const isStaticAsset = 
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não estiver no cache, busca na rede e guarda no cache
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Se falhar e for imagem, podemos retornar um fallback genérico se desejado
          return null;
        });
      })
    );
    return;
  }

  // 4. Estratégia Network-First com Fallback para páginas HTML do site
  // Tenta carregar da rede para garantir conteúdo atualizado (como notícias). Se falhar (offline), serve do cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Atualizar o cache com a página nova
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar, tenta responder com a página salva no cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se a página não estiver no cache (ex: o usuário nunca visitou), retorna o Root '/' cached app shell
          return caches.match('/');
        });
      })
  );
});
