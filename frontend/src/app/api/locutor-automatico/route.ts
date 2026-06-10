import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  tipo: "pedido" | "previsao" | "horoscopo";
  nome?: string;
  cidade?: string;
  mensagem?: string;
  musica?: string;
  artista?: string;
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

// Helper para invocar LLM (Gemini com fallback para OpenAI)
async function callLLM(prompt: string, systemInstruction: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!geminiApiKey && !openaiApiKey) {
    throw new Error("Nenhuma chave de API de IA (GEMINI_API_KEY ou OPENAI_API_KEY) configurada no ambiente.");
  }

  // 1. Tentar utilizar a API do Gemini (Gratuita/Acessível por padrão)
  if (geminiApiKey) {
    try {
      const model = "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

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
      } else {
        const errText = await res.text();
        console.warn(`Erro na API do Gemini (${res.status}): ${errText}. Tentando fallback se configurado...`);
      }
    } catch (err) {
      console.error("Falha na chamada principal da API do Gemini:", err);
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

  throw new Error("Não foi possível processar a requisição com nenhuma das APIs de IA disponíveis.");
}

// System Instructions detalhados conforme requisitos
const pedidoSystemInstruction = `Você é o locutor oficial da Rádio Itaimbé, uma FM profissional com estilo acolhedor, amigável e natural.
Sua tarefa é analisar um pedido musical de um ouvinte e gerar um JSON com a locução para ser convertida em voz.

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
Reprove IMEDIATAMENTE (retornando {"status":"reprovada"}) qualquer pedido que contenha:
- Palavrões, insultos, ofensas, conteúdo sexual ou termos vulgares
- Divulgação comercial, propaganda de concorrentes, propaganda política, spam, links, URLs, telefones, e-mails, PIX
- Conteúdo de ódio, violência ou discriminação de qualquer tipo

REGRAS DE FORMATAÇÃO DO TEXTO:
- Linguagem natural para rádio FM comercial (amigável, alegre e fluida).
- Corrija pequenos erros gramaticais e ortográficos.
- Remova emojis.
- Mantenha nomes próprios exatamente como fornecidos.
- Duração entre 8 a 15 segundos (MÁXIMO de 35 palavras).
- Não invente informações além do que foi fornecido.
- Estrutura:
  1. Saudação inicial curta (Bom dia, boa tarde ou boa noite - assuma o horário com base na mensagem ou seja neutro).
  2. Mencione o nome do ouvinte (e cidade, se informada).
  3. Resuma ou descreva a mensagem de forma fluida.
  4. Anuncie a música e artista de forma natural.
  5. Feche brevemente.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;

const weatherSystemInstruction = `Você é o locutor oficial da Rádio Itaimbé FM.
Sua tarefa é criar um boletim meteorológico para Cambará do Sul, no Rio Grande do Sul.
O boletim deve ser escrito em linguagem falada natural para rádio comercial, amigável e concisa (máximo de 20 segundos de fala).

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "previsao",
  "texto": "Texto da previsão para rádio aqui."
}

Use os dados meteorológicos reais fornecidos na mensagem do usuário para compor o boletim. Evite jargões técnicos excessivos. Cite a condição do tempo, temperaturas mínima e máxima, e a possibilidade de chuva se houver.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;

const horoscopoSystemInstruction = `Você é o locutor oficial da Rádio Itaimbé FM.
Sua tarefa é criar o boletim de horóscopo diário para todos os 12 signos do zodíaco de forma sequencial.
O horóscopo deve ter um tom positivo, leve e motivador, próprio para rádio e aberto para todos os públicos.

Você DEVE retornar APENAS um JSON no formato:
{
  "status": "ok",
  "tipo": "horoscopo",
  "texto": "Áries: previsão... Touro: previsão... Gêmeos: previsão... Câncer: previsão... Leão: previsão... Virgem: previsão... Libra: previsão... Escorpião: previsão... Sagitário: previsão... Capricórnio: previsão... Aquário: previsão... Peixes: previsão..."
}

REGRAS:
- Máximo de 20 palavras por signo.
- NÃO inclua diagnósticos médicos, menções a doenças, conselhos financeiros/investimentos ou promessas garantidas.
- Mantenha a linguagem amigável, acolhedora e inspiradora.

LEMBRE-SE: Retorne APENAS o JSON válido. Não coloque marcas de markdown como \`\`\`json. Não coloque texto fora do JSON.`;


export async function POST(request: NextRequest) {
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
      const prompt = "Gere as previsões leves e positivas para os 12 signos do zodíaco (Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário e Peixes) de hoje.";

      const responseText = await callLLM(prompt, horoscopoSystemInstruction);
      const resultJson = cleanJsonResponse(responseText);

      return NextResponse.json(resultJson);
    }

    return NextResponse.json({ error: "Tipo de tarefa inválido ou não suportado." }, { status: 400 });

  } catch (err: any) {
    console.error("Erro no processamento da API de automação:", err);
    return NextResponse.json({ error: err.message || "Erro interno do servidor." }, { status: 500 });
  }
}
