"use client";

import React, { useState } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";

interface OwncastChatProps {
  chatUrl: string; // ex: https://tv.radioitaimbe.com.br/embed/chat/readwrite
}

export default function OwncastChat({ chatUrl }: OwncastChatProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // Para forçar o recarregamento do iframe se necessário

  const handleReload = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 backdrop-blur-md rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
      {/* Cabeçalho do Chat */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-white">Chat ao Vivo</span>
        </div>
        <button
          onClick={handleReload}
          className="text-zinc-400 hover:text-white transition-colors"
          title="Recarregar Chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Área do Iframe */}
      <div className="flex-1 relative bg-black/40 min-h-[300px] md:min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-zinc-500 font-medium">Conectando ao chat...</span>
            </div>
          </div>
        )}

        {chatUrl ? (
          <iframe
            key={key}
            src={chatUrl}
            title="Owncast Chat"
            width="100%"
            height="100%"
            className="border-none w-full h-full"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Chat Indisponível
          </div>
        )}
      </div>
    </div>
  );
}
