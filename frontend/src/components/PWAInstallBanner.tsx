"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 0. Registrar o Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA: Service Worker registrado com sucesso:", reg.scope))
        .catch((err) => console.error("PWA: Erro ao registrar Service Worker:", err));
    }

    // 1. Verificar se o app já está rodando instalado (standalone)
    const checkStandalone = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      );
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    // 2. Verificar se o usuário já dispensou o banner anteriormente
    const isDismissed = localStorage.getItem("pwa-install-dismissed") === "true";
    if (isDismissed) {
      return;
    }

    // 3. Detectar se é iOS (iPhone, iPad, iPod)
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
      // Evitar falsos positivos se já estiver instalado
      return isIphoneOrIpad && !(window.navigator as any).standalone;
    };

    if (detectIOS()) {
      setIsIOS(true);
      // Exibir o banner de instrução do iOS após 4 segundos
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // 4. Ouvir o evento beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar o banner após 3 segundos do carregamento inicial
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar o prompt nativo do navegador
    deferredPrompt.prompt();

    // Esperar a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Escolha do usuário na instalação: ${outcome}`);

    // Limpar o prompt
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    // Salvar no localStorage para não exibir novamente nesta sessão/dispositivo
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-fade-in">
      <div className="glass-panel rounded-2xl p-5 shadow-2xl border border-zinc-700/80 bg-zinc-950/95 flex flex-col gap-4 overflow-hidden relative glow-primary">
        
        {/* Efeito decorativo de luz de fundo */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#e81e4d]/10 rounded-full blur-2xl -z-10" />

        {/* Linha superior: Título e Botão Fechar */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e81e4d] to-[#ff2d55] flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
              <Download className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                Rádio Itaimbé no celular!
              </h3>
              <p className="text-zinc-400 text-[11px] sm:text-xs font-semibold leading-relaxed mt-0.5">
                Instale nosso aplicativo gratuito e ouça a rádio com apenas um toque.
              </p>
            </div>
          </div>
          
          {/* Botão de Fechar com alvo de toque grande (48px) */}
          <button
            onClick={handleDismiss}
            aria-label="Fechar aviso"
            className="w-12 h-12 -mr-3 -mt-3 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full transition-colors duration-200 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do banner */}
        {isIOS ? (
          /* Instruções customizadas para iOS (Safari) */
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-medium">
              No seu iPhone ou iPad, instale seguindo os passos:
            </p>
            <ol className="list-decimal list-inside text-[11px] sm:text-xs text-zinc-400 space-y-1.5 font-semibold">
              <li className="flex items-center gap-1.5">
                Toque no botão de 
                <span className="inline-flex items-center justify-center p-1 bg-zinc-800 rounded border border-zinc-700 mx-1">
                  <Share className="w-3.5 h-3.5 text-blue-400" />
                </span>
                (Compartilhar) no navegador Safari.
              </li>
              <li>Role a lista para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong>.</li>
            </ol>
          </div>
        ) : (
          /* Botão grande para Android/Desktop (mínimo de 52px de altura) */
          <div className="flex flex-col gap-2">
            <button
              onClick={handleInstallClick}
              className="w-full h-[52px] bg-[#e81e4d] hover:bg-[#ff2d55] text-white font-extrabold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] glow-accent cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Instalar Aplicativo Grátis</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-zinc-400 hover:text-white font-bold text-[11px] sm:text-xs text-center hover:bg-zinc-800/30 rounded-lg transition-colors cursor-pointer"
            >
              Agora não, obrigado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
