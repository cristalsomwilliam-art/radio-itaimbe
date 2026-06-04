import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usando o cliente Supabase com chave do Service Role (admin) 
// para conseguir atualizar tabelas ignorando o RLS.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("pass");
  const artist = searchParams.get("artist") || "Rádio Itaimbé";
  const title = searchParams.get("title") || "Programação Musical";
  const albumart = searchParams.get("albumart");
  const listenersStr = searchParams.get("listeners") || "0";
  const nextSong = searchParams.get("next");

  const expectedToken = process.env.RADIOBOSS_SECRET_TOKEN || "itaimbe_secret_token_879";

  // 1. Validar Token de Segurança
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 2. Buscar o status atual para atualizar o histórico de músicas
    const { data: currentStatus } = await supabaseAdmin
      .from("stream_status")
      .select("current_song, current_artist, song_history")
      .eq("id", "main")
      .single();

    let updatedHistory = currentStatus?.song_history || [];

    // Se a música que terminou de tocar for diferente da padrão, adiciona ao histórico
    if (
      currentStatus &&
      currentStatus.current_song !== "Programação Musical" &&
      currentStatus.current_song !== title
    ) {
      const now = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Prepend nova música tocada
      updatedHistory = [
        {
          title: currentStatus.current_song,
          artist: currentStatus.current_artist,
          time: now,
        },
        ...updatedHistory,
      ].slice(0, 10); // Manter histórico de até 10 músicas
    }

    // 3. Atualizar o registro único no Supabase
    const { error } = await supabaseAdmin
      .from("stream_status")
      .update({
        current_song: title,
        current_artist: artist,
        album_art: albumart || null,
        listeners_count: parseInt(listenersStr, 10) || 0,
        next_song: nextSong || null,
        song_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "main");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Suporte para POST caso o RadioBOSS envie por esse método
export async function POST(request: NextRequest) {
  return GET(request);
}
