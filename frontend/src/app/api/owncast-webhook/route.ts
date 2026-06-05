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
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const expectedSecret = process.env.OWNCAST_WEBHOOK_SECRET || "itaimbe_owncast_secret_879";

  // 1. Validar Webhook Secret
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const eventType = payload.type;
    const eventData = payload.eventData || {};

    let tvOnline = false;
    let viewersCount = 0;
    let streamTitle = "Transmissão Ao Vivo";

    // 2. Tratar os tipos de evento do Owncast
    // STREAM_STARTED: Iniciou live
    // STREAM_STOPPED: Parou live
    // USER_JOINED / USER_LEFT / SYSTEM: Eventos que atualizam contagem de espectadores
    if (eventType === "STREAM_STARTED") {
      tvOnline = true;
      streamTitle = eventData.stream?.title || "Transmissão Especial";
    } else if (eventType === "STREAM_STOPPED") {
      tvOnline = false;
    } else {
      // Para outros eventos, ler o status anterior para não sobrescrever
      const { data: currentStatus } = await supabaseAdmin
        .from("stream_status")
        .select("tv_online, tv_stream_title, tv_viewers_count")
        .eq("id", "main")
        .single();

      tvOnline = currentStatus?.tv_online || false;
      streamTitle = currentStatus?.tv_stream_title || "Transmissão Especial";
      
      if (payload.viewerCount !== undefined) {
        viewersCount = payload.viewerCount;
      } else {
        viewersCount = currentStatus?.tv_viewers_count || 0;
      }
    }

    // 3. Atualizar no banco de dados Supabase
    const { error } = await supabaseAdmin
      .from("stream_status")
      .update({
        tv_online: tvOnline,
        tv_viewers_count: viewersCount,
        tv_stream_title: streamTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
