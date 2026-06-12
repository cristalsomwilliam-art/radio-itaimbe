import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Não indexar o painel administrativo e rotas de API
    },
    sitemap: 'https://www.radioitaimbe.com.br/sitemap.xml',
  };
}
