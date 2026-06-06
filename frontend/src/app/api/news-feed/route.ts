import { NextRequest, NextResponse } from "next/server";

function cleanCDATA(str: string): string {
  if (!str) return "";
  let cleaned = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Substituir entidades HTML comuns
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
  return cleaned.trim();
}

function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portal = searchParams.get("portal");

  let feedUrl = "";
  if (portal === "estadao") {
    feedUrl = "https://www.estadao.com.br/arc/outboundfeeds/rss/?outputType=xml";
  } else if (portal === "jovempan") {
    feedUrl = "https://jovempan.com.br/feed/";
  } else if (portal === "oeste") {
    feedUrl = "https://revistaoeste.com/feed/";
  } else {
    return NextResponse.json({ error: "Portal inválido ou não informado" }, { status: 400 });
  }

  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/xml, application/xml, */*"
      },
      next: { revalidate: 300 } // cache de 5 minutos
    });

    if (!res.ok) {
      throw new Error(`Falha ao buscar feed: ${res.status}`);
    }

    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      
      const title = cleanCDATA(itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
      const link = cleanCDATA(itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
      const rawDescription = cleanCDATA(itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "");
      const description = stripHtml(rawDescription);
      const pubDate = cleanCDATA(itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "");

      // Procura imagem em atributos comuns do XML (url, src ou href terminando em extensões de imagem)
      const imgUrlMatch = itemXml.match(/url="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i) || 
                          itemXml.match(/src="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i) ||
                          itemXml.match(/href="([^"]+\.(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
      let imageUrl = imgUrlMatch?.[1] || "";

      // Se não encontrou imagem, tentar achar a primeira tag img no HTML da descrição
      if (!imageUrl) {
        const htmlImgMatch = rawDescription.match(/<img[^>]+src="([^"]+)"/i);
        if (htmlImgMatch) {
          imageUrl = htmlImgMatch[1];
        }
      }

      // Tentar obter o conteúdo completo do artigo
      const contentEncodedMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i) ||
                                  itemXml.match(/<content>([\s\S]*?)<\/content>/i) ||
                                  itemXml.match(/<body>([\s\S]*?)<\/body>/i);
      
      let fullContent = "";
      if (contentEncodedMatch) {
        fullContent = cleanCDATA(contentEncodedMatch[1]);
      } else {
        fullContent = rawDescription; // Fallback para a própria descrição HTML
      }

      // Se ainda não encontrou imagem, tentar achar a primeira tag img no HTML do conteúdo completo
      if (!imageUrl && fullContent) {
        const htmlImgMatch = fullContent.match(/<img[^>]+src="([^"]+)"/i);
        if (htmlImgMatch) {
          imageUrl = htmlImgMatch[1];
        }
      }

      // Limpar o HTML do conteúdo para remover elementos inseguros ou indesejados
      if (fullContent) {
        fullContent = fullContent
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
          .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, "")
          .replace(/<form[^>]*>([\s\S]*?)<\/form>/gi, "");
      }

      // Evitar links quebrados ou relativos
      if (imageUrl && imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      }

      if (imageUrl) {
        imageUrl = cleanCDATA(imageUrl);
      }

      items.push({
        title,
        link,
        description,
        pubDate,
        imageUrl,
        fullContent
      });

      // Limitar a 15 notícias
      if (items.length >= 15) {
        break;
      }
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error(`Erro ao processar RSS do portal ${portal}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
