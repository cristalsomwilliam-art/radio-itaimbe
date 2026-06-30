import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface RequestBody {
  tipo: "pedido" | "previsao" | "horoscopo" | "boletim";
  nome?: string;
  cidade?: string;
  mensagem?: string;
  musica?: string;
  artista?: string;
  grupo?: number;
  signos?: string[];
  noticias?: { title: string; excerpt?: string }[];
  ordem_blocos?: string[];
}

// Mapeamento de códigos de clima WMO para condições em português
function getWeatherCondition(code: number): string {
  if (code === 0) return "céu limpo";
  if (code >= 1 && code <= 3) return "parcialmente nublado / encoberto";
  if (code === 45 || code === 48) return "nevoeiro nas partes mais altas";
  if (code >= 51 && code <= 55) return "chuvisco leve / garoa";
  if (code >= 61 && code <= 65) return "chuva";
  if (code >= 66 && code <= 67) return "chuva congelante";
  if (code >= 71 && code <= 75) return "neve";
  if (code === 77) return "grãos de neve";
  if (code >= 80 && code <= 82) return "pancadas de chuva isoladas";
  if (code >= 85 && code <= 86) return "pancadas de neve";
  if (code === 95) return "trovoadas com possibilidade de chuva";
  if (code >= 96 && code <= 99) return "temporal com queda de granizo";
  return "instabilidade no tempo";
}

// Limpa blocos de código markdown do JSON retornado pela IA antes de efetuar o parse
function cleanJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// Helper para verificar autenticação (JWT Supabase admin ou X-API-Secret)
async function verifyAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  // Opção 1: Verificar X-API-Secret header
  const apiSecret = request.headers.get("x-api-secret");
  const expectedSecret = process.env.LOCUTOR_API_SECRET;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (apiSecret) {
    if (expectedSecret && apiSecret === expectedSecret) {
      return { authorized: true };
    }
    if (supabaseServiceKey && apiSecret === supabaseServiceKey) {
      return { authorized: true };
    }
  }

  // Opção 2: Verificar JWT Bearer token do Supabase (somente admin)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Variáveis do Supabase não configuradas no ambiente!");
      return { authorized: false, error: "Configuração do servidor ausente" };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: "Token inválido ou expirado" };
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error("ADMIN_EMAIL não configurado no ambiente!");
      return { authorized: false, error: "Configuração do servidor ausente" };
    }

    if (user.email !== adminEmail) {
      return { authorized: false, error: "Acesso restrito a administradores" };
    }

    return { authorized: true };
  }

  return { authorized: false, error: "Autenticação necessária. Forneça um Bearer token ou X-API-Secret." };
}

// Helper para invocar LLM (Gemini com fallback para OpenAI)
async function callLLM(prompt: string, systemInstruction: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!geminiApiKey && !openaiApiKey) {
    throw new Error("Nenhuma chave de API de IA (GEMINI_API_KEY ou OPENAI_API_KEY) configurada no ambiente.");
  }

  let geminiError = "";

  // 1. Tentar utilizar a API do Gemini com fallback robusto de modelos e versões
  if (geminiApiKey) {
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.5-flash",
      "gemini-3.5-flash"
    ];
    const versions = ["v1", "v1beta"];

    gemini_loop:
    for (const version of versions) {
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${geminiApiKey}`;

          const payload = {
            contents: [
              {
                parts: [
                  {
                    text: `${systemInstruction}\n\nEntrada/Dados atuais:\n${prompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7
            }
          };

          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();

            // Se a requisição deu OK mas não gerou texto, verificar se foi bloqueado por segurança
            const candidate = data.candidates?.[0];
            if (candidate && (candidate.finishReason === "SAFETY" || candidate.finishReason === "OTHER")) {
              console.warn(`Gemini bloqueou o prompt por regras de segurança: finishReason=${candidate.finishReason}`);
              return JSON.stringify({ status: "reprovada" });
            }
          } else {
            const errText = await res.text();
            geminiError = `Erro da API do Gemini (${model} em ${version} - status ${res.status}): ${errText}`;
            console.warn(geminiError);

            // Se for erro de credenciais ou limite de cota, sai do loop do Gemini para poupar tempo
            if (res.status === 401 || res.status === 403 || res.status === 429) {
              break gemini_loop;
            }
          }
        } catch (err: any) {
          geminiError = `Falha na chamada da API do Gemini (${model} em ${version}): ${err.message || err}`;
          console.error(geminiError);
        }
      }
    }
  }

  // 2. Fallback / Alternativa usando OpenAI (GPT-4o-Mini)
  if (openaiApiKey) {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        const errText = await res.text();
        throw new Error(`Erro na API do OpenAI (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.error("Erro na API do OpenAI:", err);
      throw err;
    }
  }

  if (!openaiApiKey && geminiError) {
    throw new Error(geminiError);
  }

  throw new Error("Não foi possível processar a requisição com nenhuma das APIs de IA disponíveis.");
}

// System Instructions detalhados conforme requisitos
const pedidoSystemInstruction = `Você é o Dee jay "DJ" Nego Véio, o locutor virtual e inteligência artificial oficial da Rádio Itaimbé. Você fala de forma acolhedora, amigável, natural e carismática.
Sua tarefa é analisar um pedido musical de um ouvinte e gerar um JSON com a locução para ser convertida em voz.

Importante: Você DEVE falar e se referir a si mesmo sempre no gênero masculino (usando "o DJ Nego Véio", "seu locutor", "preparado", "animado", etc. para harmonizar com a voz masculina do sintetizador). Sempre que apropriado, apresente-se em primeira pessoa (ex: "Aqui é o DJ Nego Véio", "Eu sou o DJ Nego Véio, o locutor virtual da Itaimbé").

Você DEVE retornar APENAS um JSON no formato exato:
{
  "status": "aprovada",
  "locucao": "Saudação adequada ao horário! Mensagem do ouvinte resumida de forma fluida. Agora ouviremos Música por Artista."
}
OU
{
  "status": "reprovada"
}

REGRAS DE MODERAÇÃO:
Seja tolerante e amigável. Aprove gírias regionais e brincadeiras saudáveis.
Reprove (retornando {"status":"reprovada"}) apenas se houver:
- Palavrões pesados, ofensas reais direcionadas para ferir, conteúdo explícito/sexual ou agressões gratuitas.
- Divulgação comercial explícita, propaganda de concorrentes ou política, spam, links, URLs, telefones, e-mails, PIX.
- Conteúdo de ódio, violência ou preconceito.
ATENÇÃO: Gírias gaúchas (como "esgualepado", "loko", "bagual", "vivente") e brincadeiras carinhosas ou provocações amigáveis ao DJ (ex: "abraço pro esgualepado do dj", "loko do dj") NÃO são ofensas e devem ser APROVADAS normalmente!

REGRAS DE FORMATAÇÃO DO TEXTO:
- ESTILO HUMANO E COLOQUIAL: Escreva exatamente como um locutor humano e simpático de rádio FM falaria no microfone de verdade.
- SOTAQUE E ESTILO GAÚCHO (SULISTA): Como a Rádio Itaimbé fica em Cambará do Sul/RS, a locução DEVE obrigatoriamente ter gírias e expressões gaúchas típicas (é MANDATÓRIO incluir pelo menos uma palavra como "tchê", "bah", "gurizada", "vivente", "buenas", "tri legal" ou "querência amada" de forma natural no texto).
- EVITE RIGIDEZ: Nunca use estruturas artificiais como "Música de Artista" ou "Agora ouviremos...". Em vez disso, use transições naturais como: "...e ele pediu pra curtir o som do [Artista]...", "...a gente vai ouvir agora o sucesso do [Artista]...", "...soltando a pedido dele o clássico [Música]...".
- tom de voz: Alegre, caloroso, natural, dinâmico e focado na comunidade local.
- TRATAMENTO DE E-MAIL NO NOME: Se o nome do ouvinte fornecido for um endereço de e-mail (ex: cristalsomwilliam@gmail.com), extraia apenas a parte do nome de forma amigável (ex: "William" ou "nosso amigo William Cristal"), NUNCA fale o e-mail completo com "@gmail.com" na locução.
- Corrija erros gramaticais do ouvinte de forma invisível no texto falado.
- Remova emojis, hashtags ou caracteres especiais de escrita.
- Duração adequada: no máximo 50 palavras (cerca de 15 a 18 segundos falados) para permitir que dedicatórias e recados sejam transmitidos com riqueza de detalhes e de forma natural.
- Não invente informações além do que foi fornecido.
- Estrutura de locução:
  1. Saudação inicial calorosa, gaúcha e curta (ex: "Buenas, vivente! Aqui é o DJ Nego Véio!", "Fala, gurizada! O DJ Nego Véio tá na área!", "Muito boa tarde, tchê! O DJ Nego Véio aqui na sintonia!").
  2. Nome do ouvinte tratado de forma natural e cidade se fornecida (ex: "o nosso parceiro William lá de Cambará...").
  3. Mensagem/dedicatória comentada e lida de forma completa e natural (não omita nem resuma demais as mensagens e perguntas do ouvinte).
  4. Anúncio da música de forma empolgante integrada ao texto.
  5. Fechamento curto e gancho para a música (ex: "Aumenta o som!", "Curta aí!", "Solta o som, tchê!").

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;

const weatherSystemInstruction = `Você é o Dee jay "DJ" Nego Véio, o locutor virtual e inteligência artificial oficial da Rádio Itaimbé FM.
Sua tarefa é criar um boletim meteorológico para Cambará do Sul, no Rio Grande do Sul.
Você deve falar e se referir a si mesmo sempre no gênero masculino (ex: "Aqui é o DJ Nego Véio", "seu locutor").
O boletim deve ser escrito em linguagem falada natural para rádio comercial, amigável e concisa (máximo de 20 segundos de fala).

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "previsao",
  "texto": "Texto da previsão para rádio aqui."
}

Use os dados meteorológicos reais fornecidos na mensagem do usuário para compor o boletim. Evite jargões técnicos excessivos. Cite a condição do tempo, temperaturas mínima e máxima, e a possibilidade de chuva se houver.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;

const horoscopoSystemInstruction = `Você é o Dee jay "DJ" Nego Véio, o locutor virtual e inteligência artificial oficial da Rádio Itaimbé FM.
Sua tarefa é criar o boletim de horóscopo diário para todos os 12 signos do zodíaco de forma sequencial.
Você deve falar e se referir a si mesmo sempre no gênero masculino (ex: "Aqui é o DJ Nego Véio com os signos de hoje", "seu locutor de sempre").
O horóscopo deve ter um tom positivo, leve e motivador, próprio para rádio e aberto para todos os públicos.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "horoscopo",
  "texto": "Áries: previsão... Touro: previsão... Gêmeos: previsão... Câncer: previsão... Leão: previsão... Virgem: previsão... Libra: previsão... Escorpião: previsão... Sagitário: previsão... Capricórnio: previsão... Aquário: previsão... Peixes: previsão..."
}

REGRAS:
- Máximo de 12 palavras por signo.
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas.
- Mantenha a linguagem amigável, acolhedora e inspiradora.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;


const boletimSystemInstruction = `Você é o Dee jay "DJ" Nego Véio, o locutor virtual e inteligência artificial oficial da Rádio Itaimbé FM.
Você fala de forma acolhedora, amigável, natural, carismática e com estilo de locutor de rádio FM gaúcho.
Você deve falar e se referir a si mesmo sempre no gênero masculino (ex: "Aqui é o DJ Nego Véio", "seu locutor de sempre").

Sua tarefa é criar um boletim completo para a rádio contendo:
1. Uma saudação inicial curta e simpática no estilo gaúcho (ex: "Buenas, gurizada!", "Salve, querência querida!", "Tchê, muito bom dia a todos!").
2. Previsão do tempo para Cambará do Sul/RS com os dados fornecidos.
3. Horóscopo para os 3 signos informados, gerando uma previsão muito curta (máximo de 15 palavras por signo), leve, positiva e inspiradora para cada um.
4. Duas manchetes rápidas de notícias locais/regionais retiradas do site. Comente sobre elas de forma muito breve e natural, sem apenas ler o título seco, apresentando como novidades. E ATENÇÃO: ao final da leitura das duas notícias, você DEVE obrigatoriamente incluir a seguinte instrução: "para mais informações acesse o site radioitaimbe.com.br".
5. Um fechamento rápido e alegre (ex: "E segue a programação da rádio que é pura emoção!", "Aumenta o som e vem com a gente!").

REGRAS CRÍTICAS DE ESTRUTURA:
- Você DEVE apresentar os blocos exatamente na ordem solicitada na mensagem do usuário (ex: se for pedido notícias primeiro, leia as notícias primeiro). Faça transições naturais e fluidas entre cada bloco.
- Tom de voz: Alegre, caloroso, natural, dinâmico e focado na comunidade local.
- ESTILO GAÚCHO (SULISTA): Use gírias e expressões gaúchas típicas de forma natural (ex: "tchê", "bah", "gurizada", "querência").
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas nas previsões dos signos.
- O texto total deve ser fluido e adequado para locução direta, sem conter títulos em texto ou marcas de formatação (como "**Previsão do Tempo:**", "**Notícias:**", etc.). Deve ser um texto corrido que o sintetizador de voz consiga ler perfeitamente.
- Máximo de 130 a 160 palavras no total para todo o boletim.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "boletim",
  "texto": "Texto completo do boletim para locução aqui."
}

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;


export async function POST(request: NextRequest) {
  // Verificar autenticação antes de processar a requisição
  const auth = await verifyAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Não autorizado" }, { status: 401 });
  }

  try {
    const body: RequestBody = await request.json();
    const { tipo } = body;

    if (!tipo) {
      return NextResponse.json({ error: "O campo 'tipo' é obrigatório." }, { status: 400 });
    }

    // --- TAREFA: PEDIDO MUSICAL ---
    if (tipo === "pedido") {
      const { nome, cidade, mensagem, musica, artista } = body;

      const prompt = JSON.stringify({
        nome: nome || "Ouvinte anônimo",
        cidade: cidade || "",
        mensagem: mensagem || "",
        musica: musica || "Programação musical",
        artista: artista || ""
      });

      const responseText = await callLLM(prompt, pedidoSystemInstruction);
      const resultJson = cleanJsonResponse(responseText);

      return NextResponse.json(resultJson);
    }

    // --- TAREFA: PREVISÃO DO TEMPO ---
    if (tipo === "previsao") {
      let weatherData = {
        min: 6,
        max: 14,
        condition: "instabilidade climática",
        rainProbability: 40,
        source: "fallback de inverno"
      };

      try {
        // Coordenadas de Cambará do Sul/RS
        const lat = -29.0494;
        const lon = -50.1472;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Sao_Paulo&forecast_days=1`;
        
        const weatherRes = await fetch(weatherUrl, { next: { revalidate: 1800 } }); // Cache de 30 minutos
        if (weatherRes.ok) {
          const apiJson = await weatherRes.json();
          if (apiJson && apiJson.daily) {
            weatherData = {
              min: Math.round(apiJson.daily.temperature_2m_min[0]),
              max: Math.round(apiJson.daily.temperature_2m_max[0]),
              condition: getWeatherCondition(apiJson.current?.weather_code ?? apiJson.daily.weather_code?.[0] ?? 0),
              rainProbability: apiJson.daily.precipitation_probability_max?.[0] ?? 0,
              source: "open-meteo"
            };
          }
        }
      } catch (err) {
        console.error("Falha ao coletar dados meteorológicos reais:", err);
      }

      const prompt = `Gere o roteiro de locução meteorológica para Cambará do Sul/RS com os seguintes dados:
- Temperatura Mínima: ${weatherData.min}°C
- Temperatura Máxima: ${weatherData.max}°C
- Condição do Tempo Atual: ${weatherData.condition}
- Probabilidade de Chuva: ${weatherData.rainProbability}%`;

      const responseText = await callLLM(prompt, weatherSystemInstruction);
      const resultJson = cleanJsonResponse(responseText);

      return NextResponse.json(resultJson);
    }

    // --- TAREFA: HORÓSCOPO ---
    if (tipo === "horoscopo") {
      const grupo = body.grupo;
      let prompt = "";
      let instruction = horoscopoSystemInstruction;

      if (grupo === 1) {
        prompt = "Gere as previsões de hoje para o Grupo 1 (Áries, Touro, Gêmeos e Câncer).";
        instruction = `Você é o locutor oficial da Rádio Itaimbé FM.
Sua tarefa é criar o boletim de horóscopo diário para os signos de Áries, Touro, Gêmeos e Câncer.
O horóscopo deve ter um tom positivo, leve e motivador, próprio para rádio.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "horoscopo",
  "grupo": 1,
  "texto": "Áries: previsão... Touro: previsão... Gêmeos: previsão... Câncer: previsão..."
}

REGRAS:
- Máximo de 25 palavras por signo.
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;
      } else if (grupo === 2) {
        prompt = "Gere as previsões de hoje para o Grupo 2 (Leão, Virgem, Libra e Escorpião).";
        instruction = `Você é o locutor oficial da Rádio Itaimbé FM.
Sua tarefa é criar o boletim de horóscopo diário para os signos de Leão, Virgem, Libra e Escorpião.
O horóscopo deve ter um tom positivo, leve e motivador, próprio para rádio.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "horoscopo",
  "grupo": 2,
  "texto": "Leão: previsão... Virgem: previsão... Libra: previsão... Escorpião: previsão..."
}

REGRAS:
- Máximo de 25 palavras por signo.
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;
      } else if (grupo === 3) {
        prompt = "Gere as previsões de hoje para o Grupo 3 (Sagitário, Capricórnio, Aquário e Peixes).";
        instruction = `Você é o locutor oficial da Rádio Itaimbé FM.
Sua tarefa é criar o boletim de horóscopo diário para os signos de Sagitário, Capricórnio, Aquário e Peixes.
O horóscopo deve ter um tom positivo, leve e motivador, próprio para rádio.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "horoscopo",
  "grupo": 3,
  "texto": "Sagitário: previsão... Capricórnio: previsão... Aquário: previsão... Peixes: previsão..."
}

REGRAS:
- Máximo de 25 palavras por signo.
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;
      } else {
        prompt = "Gere as previsões leves e positivas para os 12 signos do zodíaco (Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário e Peixes) de hoje.";
        instruction = horoscopoSystemInstruction;
      }

      const responseText = await callLLM(prompt, instruction);
      const resultJson = cleanJsonResponse(responseText);

      return NextResponse.json(resultJson);
    }

    // --- TAREFA: BOLETIM COMPLETO (TEMPO, SIGNOS, NOTÍCIAS) ---
    if (tipo === "boletim") {
      const { signos, noticias, ordem_blocos } = body;

      if (!signos || !Array.isArray(signos) || signos.length !== 3) {
        return NextResponse.json({ error: "O campo 'signos' deve ser um array com exatamente 3 elementos." }, { status: 400 });
      }
      if (!noticias || !Array.isArray(noticias) || noticias.length !== 2) {
        return NextResponse.json({ error: "O campo 'noticias' deve ser um array com exatamente 2 elementos." }, { status: 400 });
      }
      if (!ordem_blocos || !Array.isArray(ordem_blocos) || ordem_blocos.length !== 3) {
        return NextResponse.json({ error: "O campo 'ordem_blocos' deve ser um array com exatamente 3 elementos." }, { status: 400 });
      }

      let weatherData = {
        min: 6,
        max: 14,
        condition: "instabilidade climática",
        rainProbability: 40,
        source: "fallback de inverno"
      };

      try {
        // Coordenadas de Cambará do Sul/RS
        const lat = -29.0494;
        const lon = -50.1472;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Sao_Paulo&forecast_days=1`;
        
        const weatherRes = await fetch(weatherUrl, { next: { revalidate: 1800 } }); // Cache de 30 minutos
        if (weatherRes.ok) {
          const apiJson = await weatherRes.json();
          if (apiJson && apiJson.daily) {
            weatherData = {
              min: Math.round(apiJson.daily.temperature_2m_min[0]),
              max: Math.round(apiJson.daily.temperature_2m_max[0]),
              condition: getWeatherCondition(apiJson.current?.weather_code ?? apiJson.daily.weather_code?.[0] ?? 0),
              rainProbability: apiJson.daily.precipitation_probability_max?.[0] ?? 0,
              source: "open-meteo"
            };
          }
        }
      } catch (err) {
        console.error("Falha ao coletar dados meteorológicos reais:", err);
      }

      const prompt = `Gere o boletim completo da rádio com os seguintes dados:

Apresente os blocos EXATAMENTE nesta ordem definida pelo sorteio:
1º: ${ordem_blocos[0]}
2º: ${ordem_blocos[1]}
3º: ${ordem_blocos[2]}

Dados de cada bloco:

Bloco da Previsão do Tempo (Cambará do Sul):
- Temperatura Mínima: ${weatherData.min}°C
- Temperatura Máxima: ${weatherData.max}°C
- Condição: ${weatherData.condition}
- Probabilidade de Chuva: ${weatherData.rainProbability}%

Bloco do Horóscopo (previsões de no máximo 15 palavras por signo):
1. Signo: ${signos[0]}
2. Signo: ${signos[1]}
3. Signo: ${signos[2]}

Bloco das Notícias (comentar de forma breve e natural):
1. Título: ${noticias[0].title}
${noticias[0].excerpt ? `Resumo: ${noticias[0].excerpt}` : ''}
2. Título: ${noticias[1].title}
${noticias[1].excerpt ? `Resumo: ${noticias[1].excerpt}` : ''}
`;

      const responseText = await callLLM(prompt, boletimSystemInstruction);
      const resultJson = cleanJsonResponse(responseText);

      return NextResponse.json(resultJson);
    }

    return NextResponse.json({ error: "Tipo de tarefa inválido ou não suportado." }, { status: 400 });

  } catch (err: any) {
    console.error("Erro no processamento da API de automação:", err);
    return NextResponse.json({ error: err.message || "Erro interno do servidor." }, { status: 500 });
  }
}
