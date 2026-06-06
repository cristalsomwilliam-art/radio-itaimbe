import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação do usuário via JWT do Supabase
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Não autorizado: Token ausente" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado: Token inválido" }, { status: 401 });
    }

    // 2. Extrair dados da mensagem do body
    const body = await request.json();
    const { chatname, chatmessage, chatimg } = body;

    if (!chatmessage) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }

    // 3. Buscar session_id do Social Stream Ninja no Supabase (bypassando RLS via service role)
    const { data: config, error: configError } = await supabaseAdmin
      .from("social_stream_config")
      .select("session_id")
      .eq("id", "main")
      .single();

    if (configError) {
      console.error("Erro ao buscar config do Social Stream Ninja:", configError.message);
      return NextResponse.json({ error: "Erro ao buscar configurações do stream" }, { status: 500 });
    }

    const sessionId = config?.session_id;

    // Se não há um session ID cadastrado, a integração está desligada. Apenas retorna OK.
    if (!sessionId || !sessionId.trim()) {
      return NextResponse.json({ success: true, forwarded: false, message: "Social Stream Ninja não configurado." });
    }

    // Extrair o Session ID real caso o usuário tenha colado a URL inteira por engano
    let cleanSessionId = sessionId.trim();
    if (cleanSessionId.includes("session=")) {
      const match = cleanSessionId.match(/[?&]session=([^&]+)/);
      if (match && match[1]) {
        cleanSessionId = match[1];
      }
    } else if (cleanSessionId.includes("/")) {
      cleanSessionId = cleanSessionId.split("/").pop() || cleanSessionId;
    }

    // 4. Encaminhar para a API do Social Stream Ninja (via GET com payload JSON codificado na URL)
    const payload = {
      chatname: chatname || "Ouvinte",
      chatmessage: chatmessage,
      chatimg: chatimg || "",
      type: "custom"
    };

    const encodedValue = encodeURIComponent(JSON.stringify(payload));
    const socialStreamUrl = `https://io.socialstream.ninja/${cleanSessionId}/extContent/null/${encodedValue}`;

    const response = await fetch(socialStreamUrl, {
      method: "GET"
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao chamar API do Social Stream Ninja:", response.status, errorText);
      return NextResponse.json({ error: "Erro ao enviar mensagem para o Social Stream Ninja" }, { status: 500 });
    }

    return NextResponse.json({ success: true, forwarded: true });
  } catch (err: any) {
    console.error("Erro na rota /api/chat/forward:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
