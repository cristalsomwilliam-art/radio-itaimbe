import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/', // Não indexar o painel administrativo no Google
    },
    sitemap: 'https://www.radioitaimbe.com.br/sitemap.xml',
  };
}
