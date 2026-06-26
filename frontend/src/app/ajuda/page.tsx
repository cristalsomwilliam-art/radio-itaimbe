"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Radio,
  MessageSquare,
  Smartphone,
  Plus,
  Volume2,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  RotateCcw,
  Tv,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Chrome,
  Share2,
  ExternalLink,
  Laptop
} from "lucide-react";

// Definição dos tutoriais
interface TutorialStep {
  title: string;
  narration: string;
  screenText: string;
  actionHighlight: string;
  highlightType: "play" | "volume" | "mural" | "modal" | "dots" | "share" | "mute" | "refresh" | "keys" | "check" | "modes" | "login" | "none";
}

interface Tutorial {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  duration: string;
  soundtrack: string;
  steps: TutorialStep[];
}

export default function AjudaPage() {
  // Estado para controle de tamanho da fonte (Acessibilidade)
  // 18px é o padrão (base), variando de 14px até 28px
  const [fontSize, setFontSize] = useState<number>(20);
  
  // Estado para selecionar o tutorial ativo no simulador
  const [activeTutorialId, setActiveTutorialId] = useState<number>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  
  // Estado para alternar entre "Simulador Interativo" e "Manual da Rádio" (Roteiros para gravação)
  const [viewMode, setViewMode] = useState<"simulator" | "scripts">("simulator");

  // Estado para controle do Narrador de Voz (Text-to-Speech)
  const [isNarratorMuted, setIsNarratorMuted] = useState<boolean>(false);

  // Estados para ampliação de imagens (Lightbox) e controle de erro de carregamento
  const [lightboxImage, setLightboxImage] = useState<"radio" | "live" | null>(null);
  const [radioImgError, setRadioImgError] = useState<boolean>(false);
  const [liveImgError, setLiveImgError] = useState<boolean>(false);

  // Função para falar o texto da narração de forma lenta e clara para idosos
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancela qualquer narração anterior em andamento
    window.speechSynthesis.cancel();
    
    if (isNarratorMuted) return;

    // Substitui a URL do site para uma grafia fonética antes de enviar para a voz artificial
    let audioPrompt = text.replace(/[*#]/g, "");
    audioPrompt = audioPrompt.replace(/radioitaimbe\.com\.br/gi, "rádio itaimbé ponto com ponto be r");

    const utterance = new SpeechSynthesisUtterance(audioPrompt);
    utterance.lang = "pt-BR";
    utterance.rate = 0.85; // Velocidade mais lenta para idosos ouvirem com clareza
    utterance.pitch = 1.0;

    // Buscar vozes em Português do Brasil no sistema do usuário
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(
      (v) => v.lang.includes("pt-BR") || v.lang.includes("pt_BR")
    );
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Efeito para disparar a fala da narração ao mudar de passo ou tutorial
  React.useEffect(() => {
    if (viewMode === "simulator") {
      const timer = setTimeout(() => {
        speakText(currentStep.narration);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [currentStepIndex, activeTutorialId, viewMode, isNarratorMuted]);

  // Lista dos tutoriais com todos os dados solicitados pelo usuário
  const tutorials: Tutorial[] = [
    {
      id: 1,
      title: "Como ouvir a Rádio Itaimbé",
      description: "Aprenda a entrar no site, entender os dois modos (som/vídeo) e ligar a rádio ao vivo.",
      icon: <Radio className="w-6 h-6" />,
      color: "from-pink-500 to-rose-600 border-pink-500/30 text-pink-400",
      duration: "1 minuto",
      soundtrack: "Violão acústico suave, melodia alegre e calma (ex: Sunny Days)",
      steps: [
        {
          title: "Acessar o Site",
          narration: "Olá! Ouvir a Rádio Itaimbé é muito fácil. Abra a internet no seu computador ou celular e digite no topo: radioitaimbe.com.br. Pronto, você já está na nossa página principal!",
          screenText: "PASSO 1: Abra o navegador e digite radioitaimbe.com.br",
          actionHighlight: "Olhe no topo da tela o endereço digitado",
          highlightType: "none",
        },
        {
          title: "Rádio 24h vs TV Ao Vivo",
          narration: "Nosso site funciona de duas formas automáticas: quando não há locutor no estúdio, você ouve música o dia todo no Modo Rádio 24h. Mas quando o locutor inicia a transmissão ao vivo pelo OBS Studio, o site muda sozinho para o Modo TV Ao Vivo com vídeo do estúdio e chat para conversar conosco!",
          screenText: "PASSO 2: O site muda sozinho entre a Rádio 24h (som) e a TV Ao Vivo (vídeo via OBS)",
          actionHighlight: "Compare o Modo Rádio (Som) e o Modo TV (Vídeo + Chat) na tela",
          highlightType: "modes",
        },
        {
          title: "Encontrar o Player",
          narration: "Para ouvir no Modo Rádio, olhe bem no meio da tela. Você verá um grande cartão com o título da Rádio e um botão vermelho muito chamativo escrito 'Ouvir Agora'.",
          screenText: "PASSO 3: Encontre o botão vermelho escrito 'Ouvir Agora'",
          actionHighlight: "O botão vermelho 'Ouvir Agora' está destacado com o círculo piscante",
          highlightType: "play",
        },
        {
          title: "Clicar em Play",
          narration: "Dê um toque ou clique simples nesse botão vermelho. O triângulo branco vai virar duas barrinhas verticais de pausar, e o som da rádio vai começar a tocar na hora!",
          screenText: "PASSO 4: Clique no botão vermelho para iniciar o som",
          actionHighlight: "Clique no botão 'Ouvir Agora'. O som começará a tocar!",
          highlightType: "play",
        },
        {
          title: "Ajustar o Volume",
          narration: "Se o som estiver muito baixo ou muito alto, não se preocupe! Logo abaixo do botão de tocar, use a barra de volume. Deslize a bolinha para a direita para aumentar, ou para a esquerda para abaixar o som.",
          screenText: "PASSO 5: Use a barra de volume para ajustar a altura do som",
          actionHighlight: "Ajuste o volume deslizando a barrinha horizontal",
          highlightType: "volume",
        }
      ]
    },
    {
      id: 2,
      title: "Como pedir uma música",
      description: "Peça sua música favorita, entre com redes sociais ou use a opção simplificada Sem Login.",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "from-purple-500 to-indigo-600 border-purple-500/30 text-purple-400",
      duration: "1 minuto e 40 segundos",
      soundtrack: "Piano suave de fundo, ritmo leve e compassado",
      steps: [
        {
          title: "Ache o Mural de Pedidos",
          narration: "Quer ouvir a sua música preferida e mandar um abraço especial? Nós fazemos isso por você! No lado direito do site, encontre o quadro roxo do 'Mural de Pedidos'.",
          screenText: "PASSO 1: Encontre o card roxo 'Mural de Pedidos' na página principal",
          actionHighlight: "Mural de Pedidos destacado na lateral direita",
          highlightType: "mural",
        },
        {
          title: "Abrir o Formulário",
          narration: "Abaixo das mensagens dos outros ouvintes, clique no botão vermelho escrito 'Pedir Música'. Um quadro menor vai se abrir no meio da sua tela.",
          screenText: "PASSO 2: Clique no botão vermelho 'Pedir Música'",
          actionHighlight: "Clique no botão vermelho 'Pedir Música' no card do Mural",
          highlightType: "mural",
        },
        {
          title: "Opção Sem Login (Fácil)",
          narration: "Se for o seu primeiro pedido hoje, o site perguntará como deseja se identificar por segurança. Você pode entrar usando Facebook ou Google. Mas se você achar muito complicado ou tiver dificuldades, clique no botão verde escrito 'Pedir como Visitante'. Ele permite que você peça sua música de forma rápida e sem precisar digitar nenhuma senha!",
          screenText: "PASSO 3: Clique no botão verde 'Pedir como Visitante' para pedir sem precisar de login",
          actionHighlight: "O botão verde 'Pedir como Visitante (Sem Login)' está destacado",
          highlightType: "login",
        },
        {
          title: "Nome, Cidade e Música",
          narration: "Agora que o formulário abriu, preencha os dados: digite seu Nome no primeiro campo, e a sua Cidade no segundo campo (por exemplo, Cambará do Sul). Depois, digite a música e o cantor. No último campo, escreva a sua mensagem ou dedicatória especial para quem você ama. O locutor lerá seu recado ao vivo na rádio!",
          screenText: "PASSO 4: Digite seu Nome, sua Cidade, a Música e a sua Dedicatória",
          actionHighlight: "Preencha os dados e escreva sua dedicatória de carinho para o locutor ler",
          highlightType: "modal",
        },
        {
          title: "Enviar e Aguardar",
          narration: "Por fim, clique no botão vermelho 'Confirmar' no final da janela. Seu pedido aparecerá no mural do site. Agora é só aguardar um pouquinho que a sua música vai tocar e o locutor vai mandar a sua dedicatória ao vivo na rádio para todo mundo ouvir!",
          screenText: "PASSO 5: Envie o formulário, aguarde tocar e ouça o locutor ler o seu recado ao vivo na rádio!",
          actionHighlight: "Clique no botão vermelho para enviar. O locutor lerá seu recado ao vivo!",
          highlightType: "modal",
        }
      ]
    },
    {
      id: 3,
      title: "Como ouvir pelo celular",
      description: "Acesse a rádio de qualquer lugar usando o navegador do seu smartphone.",
      icon: <Smartphone className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-600 border-blue-500/30 text-blue-400",
      duration: "40 segundos",
      soundtrack: "Acústico de violão ou ukulele leve e ritmado",
      steps: [
        {
          title: "Abrir o Navegador",
          narration: "Leve a Rádio Itaimbé com você para onde for! No seu celular, procure pelo aplicativo da internet. Geralmente é o Google Chrome ou o Safari do iPhone.",
          screenText: "PASSO 1: Abra o aplicativo da internet (Chrome ou Safari) no celular",
          actionHighlight: "Ícone do navegador destacado na tela do celular",
          highlightType: "dots",
        },
        {
          title: "Acessar o Site",
          narration: "Toque na barra de pesquisas no topo da tela do celular, digite: radioitaimbe.com.br e depois aperte o botão 'Ir' ou 'Buscar' no teclado.",
          screenText: "PASSO 2: Digite radioitaimbe.com.br na barra de cima",
          actionHighlight: "Barra de endereço do celular destacada",
          highlightType: "none",
        },
        {
          title: "Iniciar a Rádio",
          narration: "Assim que o site carregar, você verá o botão vermelho escrito 'Ouvir Agora' no centro. Dê um toque nele e a rádio começará a tocar no seu celular imediatamente. Você pode colocar no viva-voz!",
          screenText: "PASSO 3: Toque no botão vermelho 'Ouvir Agora'",
          actionHighlight: "Botão 'Ouvir Agora' destacado na versão mobile",
          highlightType: "play",
        }
      ]
    },
    {
      id: 4,
      title: "Colocar a rádio na tela do celular",
      description: "Crie um atalho na tela inicial do celular Android ou iPhone para abrir a rádio com um clique.",
      icon: <PlusCircle className="w-6 h-6" />,
      color: "from-teal-500 to-emerald-600 border-teal-500/30 text-teal-400",
      duration: "1 minuto e 15 segundos",
      soundtrack: "Música instrumental eletrônica bem suave e amigável",
      steps: [
        {
          title: "Opção 1: Celular Android",
          narration: "Quer abrir a Rádio Itaimbé com um clique, como se fosse um aplicativo? No Android, abra o site no Chrome, toque nos três pontinhos no canto superior direito e clique em 'Adicionar à tela inicial'. Confirme clicando em 'Adicionar'.",
          screenText: "No Android: Toque nos 3 pontinhos e clique em 'Adicionar à tela inicial'",
          actionHighlight: "Menu de três pontinhos do Chrome destacado no topo",
          highlightType: "dots",
        },
        {
          title: "Opção 2: iPhone (Apple)",
          narration: "Se você usa iPhone, abra o site no Safari. Toque no botão de compartilhar (aquele quadradinho com uma seta apontando para cima na parte inferior). Depois, deslize a tela e clique em 'Adicionar à Tela de Início'. Confirme no botão adicionar no topo direito.",
          screenText: "No iPhone: Toque no botão Compartilhar e clique em 'Adicionar à Tela de Início'",
          actionHighlight: "Botão de compartilhar na barra inferior do Safari",
          highlightType: "share",
        },
        {
          title: "Atalho Criado",
          narration: "Pronto! O ícone colorido da Rádio Itaimbé agora está gravado na tela principal do seu celular. Sempre que quiser nos ouvir, basta dar um toque nesse ícone!",
          screenText: "PASSO 3: Ícone salvo! Agora basta tocar no ícone na tela inicial para ouvir",
          actionHighlight: "Ícone da Rádio Itaimbé criado na tela de aplicativos do celular",
          highlightType: "check",
        }
      ]
    },
    {
      id: 5,
      title: "O som não está funcionando?",
      description: "Aprenda a resolver os problemas mais comuns caso você não esteja ouvindo a rádio.",
      icon: <Volume2 className="w-6 h-6" />,
      color: "from-amber-500 to-orange-600 border-amber-500/30 text-amber-400",
      duration: "1 minuto e 10 segundos",
      soundtrack: "Música suave e reconfortante para tranquilizar o usuário",
      steps: [
        {
          title: "Verificar o Aparelho",
          narration: "Está sem som? Vamos resolver juntos! Primeiro, veja se o volume do seu computador, tablet ou celular está ligado e alto. Às vezes o som do próprio aparelho foi colocado no silencioso sem querer.",
          screenText: "PASSO 1: Verifique se o volume geral do seu aparelho não está no zero ou mudo",
          actionHighlight: "Ajuste os botões físicos de volume do seu aparelho",
          highlightType: "none",
        },
        {
          title: "Verificar o Volume do Site",
          narration: "Segundo, veja se o próprio volume do site não está com um 'X' vermelho, o que indica que ele está mudo. Clique no ícone do alto-falante ao lado da barrinha de volume para ativar o som.",
          screenText: "PASSO 2: Verifique o alto-falante e a barrinha de volume no site",
          actionHighlight: "Botão de alto-falante/mudo e barra de volume destacados",
          highlightType: "mute",
        },
        {
          title: "Atualizar a Página",
          narration: "Se a transmissão travar por causa da internet, atualize a página. No computador, clique na setinha circular perto da barra de endereços no topo da tela, ou aperte a tecla F5 no teclado. No celular, puxe a página de cima para baixo com o dedo e solte.",
          screenText: "PASSO 3: Atualize a página da rádio (F5 ou deslizar a tela para baixo)",
          actionHighlight: "Botão de recarregar (seta circular) no topo do navegador",
          highlightType: "refresh",
        },
        {
          title: "Reiniciar o Navegador",
          narration: "Se ainda assim continuar sem som, feche o aplicativo da internet por completo e abra novamente. Isso limpa a memória e faz o som voltar a funcionar normalmente!",
          screenText: "PASSO 4: Se persistir, feche o navegador da internet e abra-o novamente",
          actionHighlight: "Feche a aba da internet e recarregue o site da rádio",
          highlightType: "none",
        }
      ]
    },
    {
      id: 6,
      title: "Como aumentar as letras do site",
      description: "Aprenda a aumentar o tamanho dos textos para ler tudo com mais facilidade.",
      icon: <Plus className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600 border-green-500/30 text-green-400",
      duration: "1 minuto",
      soundtrack: "Melodia acústica leve e calma",
      steps: [
        {
          title: "No Computador",
          narration: "Ler os textos do site está difícil? Você pode aumentar tudo no computador segurando a tecla Control (escrita Ctrl) e apertando a tecla Mais (+). Para diminuir, segure Control e aperte a tecla Menos (-).",
          screenText: "No Computador: Pressione a tecla Ctrl e a tecla Mais (+) juntas para aumentar",
          actionHighlight: "Teclas Ctrl e + indicadas no teclado",
          highlightType: "keys",
        },
        {
          title: "No Celular",
          narration: "No celular, você pode afastar dois dedos na tela (movimento de pinça) para dar zoom na página, ou dar dois toques rápidos seguidos em cima do texto que deseja ler melhor.",
          screenText: "No Celular: Use o movimento de pinça com dois dedos ou toque duas vezes rápido",
          actionHighlight: "Movimento de pinça simulado na tela do celular",
          highlightType: "none",
        },
        {
          title: "No Próprio Site",
          narration: "Você também pode usar a nossa ferramenta de acessibilidade! No topo de nossa Central de Ajuda, há dois botões: 'Aumentar Letra' com um sinal de mais, e 'Diminuir Letra' com um sinal de menos. Clique neles e as letras crescerão na hora!",
          screenText: "No Site: Clique nos botões Aumentar Letra (A+) no topo desta página de ajuda",
          actionHighlight: "Botões de Zoom no topo da página destacados",
          highlightType: "none",
        }
      ]
    },
    {
      id: 7,
      title: "Perguntas Rápidas sobre a Rádio",
      description: "Respostas diretas e simples para as dúvidas mais comuns dos ouvintes.",
      icon: <HelpCircle className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-600 border-indigo-500/30 text-indigo-400",
      duration: "1 minuto e 20 segundos",
      soundtrack: "Ritmo dinâmico de fundo com palmas e violão leve",
      steps: [
        {
          title: "A rádio é paga?",
          narration: "Primeira pergunta: A rádio é paga? De jeito nenhum! Ouvir a Rádio Itaimbé e assistir à TV Itaimbé é cem por cento gratuito. Você não paga absolutamente nada para nos acompanhar.",
          screenText: "1. A rádio é 100% GRATUITA!",
          actionHighlight: "Sinal de Grátis (R$ 0,00) destacado",
          highlightType: "check",
        },
        {
          title: "Funciona fora da cidade?",
          narration: "Segunda pergunta: Consigo ouvir fora da minha cidade? Com certeza! Como nossa transmissão é feita pela internet, você pode ouvir a rádio em qualquer cidade do Brasil e até no exterior. Leve a Itaimbé nas suas viagens!",
          screenText: "2. FUNCIONA EM QUALQUER LUGAR DO MUNDO pela internet!",
          actionHighlight: "Globo terrestre mostrando conexões",
          highlightType: "check",
        },
        {
          title: "Consome muita internet?",
          narration: "Terceira pergunta: Gasta muita internet do meu celular? Não. Nós usamos uma tecnologia moderna que otimiza o som. Ele toca com alta qualidade consumindo pouquíssimos dados da sua franquia de internet.",
          screenText: "3. GASTA POUCA INTERNET (Transmissão otimizada)",
          actionHighlight: "Gráfico de consumo de dados baixo",
          highlightType: "check",
        },
        {
          title: "Precisa instalar aplicativo?",
          narration: "Quarta pergunta: Preciso instalar algum aplicativo pesado? Não precisa! O site da rádio funciona direto pelo navegador de internet do seu celular ou computador. Rádio simples de verdade para o seu dia a dia!",
          screenText: "4. NÃO PRECISA INSTALAR APLICATIVO! Funciona direto no navegador.",
          actionHighlight: "Navegador de internet com check verde",
          highlightType: "check",
        }
      ]
    }
  ];

  // Recupera o tutorial selecionado
  const activeTutorial = tutorials.find((t) => t.id === activeTutorialId) || tutorials[0];
  const currentStep = activeTutorial.steps[currentStepIndex] || activeTutorial.steps[0];

  // Handlers para o simulador
  const nextStep = () => {
    if (currentStepIndex < activeTutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Loop ou avançar para próximo tutorial
      if (activeTutorialId < tutorials.length) {
        setActiveTutorialId(activeTutorialId + 1);
        setCurrentStepIndex(0);
      } else {
        // Volta para o primeiro
        setActiveTutorialId(1);
        setCurrentStepIndex(0);
      }
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else if (activeTutorialId > 1) {
      setActiveTutorialId(activeTutorialId - 1);
      setCurrentStepIndex(tutorials[activeTutorialId - 2].steps.length - 1);
    }
  };

  const selectTutorial = (id: number) => {
    setActiveTutorialId(id);
    setCurrentStepIndex(0);
  };

  // Funções para zoom de fonte
  const handleIncreaseFont = () => {
    if (fontSize < 30) setFontSize(fontSize + 2);
  };

  const handleDecreaseFont = () => {
    if (fontSize > 14) setFontSize(fontSize - 2);
  };

  const handleResetFont = () => {
    setFontSize(20);
  };

  return (
    <div 
      className="max-w-6xl mx-auto space-y-8 select-none transition-all duration-200"
      style={{ fontSize: `${fontSize}px` }}
    >
      
      {/* CABEÇALHO DA PÁGINA COM CONTROLES DE ACESSIBILIDADE */}
      <div className="glass-panel border border-zinc-800/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#e81e4d]/10 border border-[#e81e4d]/30 text-[#e81e4d] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 animate-pulse" />
            Central de Acessibilidade
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Como usar a Rádio Itaimbé?
          </h1>
          <p className="text-zinc-400 font-medium text-sm max-w-xl">
            Preparamos guias interativos simples, passo a passo, pensados especialmente para idosos ou pessoas com pouca experiência tecnológica.
          </p>
        </div>

        {/* Painel de Zoom da Fonte */}
        <div className="flex flex-col items-center gap-2.5 bg-zinc-950/60 border border-white/5 p-4 rounded-2xl w-full md:w-auto shadow-md">
          <span className="text-[11px] font-black text-zinc-450 uppercase tracking-widest">
            Ajustar tamanho das letras:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecreaseFont}
              className="bg-zinc-900 hover:bg-zinc-800 text-white p-3 rounded-xl border border-white/5 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Diminuir letras"
            >
              <MinusCircle className="w-5 h-5 text-zinc-300" />
            </button>
            <button
              onClick={handleResetFont}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl border border-white/5 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Normal</span>
            </button>
            <button
              onClick={handleIncreaseFont}
              className="bg-zinc-900 hover:bg-zinc-800 text-white p-3 rounded-xl border border-white/5 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Aumentar letras"
            >
              <PlusCircle className="w-5 h-5 text-[#e81e4d]" />
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold">
            Tamanho atual: {fontSize}px (ideal para ler)
          </span>
        </div>
      </div>

      {/* SELETOR DE MODO: SIMULADOR INTERATIVO VS MANUAIS DE GRAVAÇÃO */}
      <div className="flex justify-center">
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-full flex items-center gap-2 max-w-md w-full shadow-lg">
          <button
            onClick={() => setViewMode("simulator")}
            className={`flex-1 py-3 text-xs md:text-sm font-black rounded-full uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
              viewMode === "simulator"
                ? "bg-[#e81e4d] text-white shadow-lg shadow-pink-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Simulador Visual</span>
          </button>
          <button
            onClick={() => setViewMode("scripts")}
            className={`flex-1 py-3 text-xs md:text-sm font-black rounded-full uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
              viewMode === "scripts"
                ? "bg-[#e81e4d] text-white shadow-lg shadow-pink-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Roteiros de Vídeo</span>
          </button>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: LISTA DE TUTORIAIS */}
        <div className="lg:col-span-1 space-y-4">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block px-2">
            Selecione uma ajuda abaixo:
          </span>
          <div className="grid grid-cols-1 gap-3">
            {tutorials.map((tutorial) => {
              const isSelected = activeTutorialId === tutorial.id;
              return (
                <button
                  key={tutorial.id}
                  onClick={() => selectTutorial(tutorial.id)}
                  className={`text-left p-4.5 rounded-2xl border transition-all flex items-start gap-4 hover:scale-[1.02] active:scale-98 relative overflow-hidden group ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-700 shadow-xl"
                      : "bg-zinc-950/50 border-white/5 hover:border-zinc-800 hover:bg-zinc-900/40"
                  }`}
                >
                  {/* Indicador Ativo Lateral */}
                  {isSelected && (
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#e81e4d] to-pink-600 rounded-r-md"></span>
                  )}
                  
                  {/* Ícone de fundo colorido com gradiente */}
                  <div className={`w-11 h-11 rounded-xl bg-zinc-900 border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 ${
                    isSelected ? "border-zinc-700 bg-zinc-850" : "border-white/5"
                  }`}>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tutorial.color} bg-opacity-10`}>
                      {tutorial.icon}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-black text-white leading-snug group-hover:text-[#e81e4d] transition-colors truncate">
                      {tutorial.title}
                    </h3>
                    <p className="text-[11px] text-zinc-450 leading-relaxed font-medium line-clamp-2">
                      {tutorial.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5 text-[10px] text-zinc-550 font-bold uppercase">
                      <span>Tempo: {tutorial.duration}</span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-zinc-650 self-center flex-shrink-0 transition-transform ${
                    isSelected ? "translate-x-1 text-[#e81e4d]" : "group-hover:translate-x-0.5"
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA: CONTEÚDO ATIVO (SIMULADOR OU ROTEIROS) */}
        <div className="lg:col-span-2">
          {viewMode === "simulator" ? (
            
            /* MODO 1: SIMULADOR VISUAL DE VÍDEO INTERATIVO */
            <div className="glass-panel border border-zinc-800/60 rounded-3xl p-5 md:p-7 space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/50">
              
              {/* Topo do simulador */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                  <span className="text-[10px] font-black text-[#e81e4d] uppercase tracking-widest">
                    Simulador Interativo
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-bold bg-zinc-900 border border-white/5 px-3.5 py-1.5 rounded-full">
                  Tutorial {activeTutorial.id} de 7: <span className="text-white">{activeTutorial.title}</span>
                </div>
              </div>

              {/* TELA DA SIMULAÇÃO (REPRODUTOR MOCKUP) */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl flex flex-col justify-between">
                
                {/* 1. MOCKUP DE TELA DO SITE / CELULAR COM DESTAQUE VISUAL DE ACORDO COM O PASSO */}
                <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-4">
                  
                  {/* Grid do site simulado (Fundo decorativo) */}
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                  {/* ELEMENTOS DE INTERFACE SIMULADA PARA CADA TIPO DE DESTAQUE */}
                  
                  {/* Tipo: Botão Play do Player Principal */}
                  {currentStep.highlightType === "play" && (
                    <div className="w-full max-w-sm bg-gradient-to-br from-[#270b47] to-[#04010b] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-300 relative">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#e81e4d] rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-black text-zinc-350 uppercase tracking-widest">Rádio Itaimbé FM</span>
                      </div>
                      <h4 className="text-base font-black text-white">ITAIMBÉ FM 87.9</h4>
                      <p className="text-[10px] text-zinc-450">Música: Programação ao Vivo</p>
                      
                      <div className="pt-2 flex items-center gap-3 relative">
                        {/* Botão de Play Simulado com Círculo Pulsante Gigante */}
                        <div className="relative z-20">
                          <button className="bg-[#e81e4d] text-white p-3 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30">
                            OUVIR AGORA
                          </button>
                          
                          {/* CÍRCULO PULSANTE DE ACESSIBILIDADE */}
                          <span className="absolute -inset-4 rounded-full border-4 border-yellow-400 animate-ping opacity-90 pointer-events-none"></span>
                          <span className="absolute -inset-2 rounded-full border-2 border-red-500 animate-pulse pointer-events-none"></span>
                          
                          {/* SETA APONTANDO PARA O BOTÃO */}
                          <div className="absolute -top-12 left-6 text-yellow-400 text-3xl font-bold animate-bounce pointer-events-none">
                            👇
                          </div>
                        </div>
                        <span className="text-[9px] text-zinc-550">Clique Aqui</span>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Controle de Volume */}
                  {currentStep.highlightType === "volume" && (
                    <div className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-300">
                      <span className="text-[8px] font-black text-[#e81e4d] uppercase tracking-wider block">Controle de Altura</span>
                      <p className="text-[11px] text-zinc-350">Arraste a barrinha vermelha para a direita ou esquerda:</p>
                      
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 flex items-center gap-3 relative">
                        <Volume2 className="w-5 h-5 text-[#e81e4d]" />
                        <div className="flex-1 h-2.5 bg-zinc-800 rounded-full relative overflow-visible">
                          <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-gradient-to-r from-[#e81e4d] to-pink-500 rounded-full"></div>
                          {/* Controle Deslizante Destacado */}
                          <div className="absolute left-2/3 -top-1.5 w-5 h-5 bg-yellow-400 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 relative">
                            {/* Círculo visual de clique */}
                            <span className="absolute -inset-3 rounded-full border-2 border-yellow-400 animate-ping opacity-75 pointer-events-none"></span>
                          </div>
                        </div>
                        
                        {/* Indicador de Seta */}
                        <div className="absolute -top-8 right-1/4 text-yellow-400 text-2xl animate-bounce pointer-events-none">
                          👈
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Mural de Pedidos Card */}
                  {currentStep.highlightType === "mural" && (
                    <div className="w-full max-w-xs bg-gradient-to-br from-[#8b5cf6] to-[#1e1b4b] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-300 relative">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Mural de Pedidos</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      </div>
                      <div className="space-y-2 max-h-16 overflow-hidden opacity-60 text-[8px] text-zinc-300">
                        <div className="bg-white/5 p-1.5 rounded">Maria: Toca Amigo - Roberto Carlos</div>
                        <div className="bg-white/5 p-1.5 rounded">José: Abraço para a família!</div>
                      </div>
                      
                      {/* Botão de Pedido Destacado */}
                      <div className="relative pt-2">
                        <button className="w-full bg-[#e81e4d] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md animate-play-pulse">
                          Pedir Música
                        </button>
                        
                        {/* Círculos de Destaque */}
                        <span className="absolute -inset-3 rounded-2xl border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none"></span>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 text-3xl animate-bounce pointer-events-none">
                          👇
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Formulário Modal de Pedido */}
                  {currentStep.highlightType === "modal" && (
                    <div className="w-full max-w-sm bg-zinc-950 border border-white/15 rounded-2xl p-4.5 shadow-2xl space-y-2 animate-in zoom-in-95 duration-300 relative text-left">
                      <h5 className="text-[10px] font-black text-white uppercase tracking-wider border-b border-white/5 pb-1">Pedir Música</h5>
                      
                      <div className="space-y-1.5 text-[9px]">
                        <div>
                          <label className="text-zinc-400 block mb-0.5">Seu Nome:</label>
                          <input type="text" readOnly value="Ouvinte Visitante (Ex: José da Silva)" className="w-full bg-zinc-900 border border-white/5 p-1.5 rounded text-zinc-300 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-zinc-450 block mb-0.5">Sua Cidade (Obrigatório):</label>
                          <input type="text" readOnly value="Cambará do Sul" className="w-full bg-zinc-900 border border-white/5 p-1.5 rounded text-zinc-300 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-zinc-450 block mb-0.5">Música & Cantor:</label>
                          <input type="text" readOnly value="Como é Grande o Meu Amor por Você - Roberto Carlos" className="w-full bg-zinc-900 border border-white/5 p-1.5 rounded text-zinc-300 focus:outline-none" />
                        </div>
                        <div className="relative">
                          <label className="text-zinc-450 block mb-0.5">Recado / Dedicatória (Opcional):</label>
                          <textarea readOnly rows={1} value="Mande um abraço especial para toda a minha família..." className="w-full bg-zinc-900 border-2 border-yellow-400 p-1.5 rounded text-white resize-none focus:outline-none" />
                          <span className="absolute -inset-1 rounded border-2 border-yellow-400 animate-pulse pointer-events-none"></span>
                        </div>
                      </div>

                      {/* Botão de Enviar no Formulário */}
                      <div className="pt-1.5 relative">
                        <button className="w-full bg-[#e81e4d] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider animate-play-pulse">
                          CONFIRMAR
                        </button>
                        
                        {/* Seta se destacando no envio */}
                        {currentStep.title === "Enviar e Aguardar" && (
                          <>
                            <span className="absolute -inset-2 rounded-xl border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none"></span>
                            <div className="absolute -top-6 left-2/3 text-yellow-400 text-2xl animate-bounce pointer-events-none">
                              👇
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tipo: Três Pontinhos do Menu Mobile */}
                  {currentStep.highlightType === "dots" && (
                    <div className="w-full max-w-[200px] h-[340px] bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-3 relative flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-300">
                      {/* Topo do Celular */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[8px] text-zinc-500">
                        <span>Chrome</span>
                        <div className="flex items-center gap-1">
                          {/* TRÊS PONTINHOS DO MENU */}
                          <div className="relative">
                            <span className="text-white font-black text-[12px] cursor-pointer px-1 block bg-zinc-800 rounded border border-white/10">⋮</span>
                            <span className="absolute -inset-2 rounded-full border-2 border-yellow-400 animate-ping pointer-events-none"></span>
                            <div className="absolute top-6 right-2 text-yellow-400 text-lg animate-bounce pointer-events-none">
                              ☝️
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Corpo do Celular */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-2">
                          <Chrome className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-[9px] text-zinc-350 leading-relaxed font-bold">Toque nos 3 Pontinhos no topo direito do celular!</p>
                      </div>
                      
                      {/* Botão Home do Celular */}
                      <div className="w-6 h-6 bg-zinc-800 border border-white/5 rounded-full mx-auto flex-shrink-0"></div>
                    </div>
                  )}

                  {/* Tipo: Botão de Compartilhar do Safari (iPhone) */}
                  {currentStep.highlightType === "share" && (
                    <div className="w-full max-w-[200px] h-[340px] bg-zinc-900 border-4 border-zinc-700 rounded-3xl p-3 relative flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-300">
                      {/* Topo do Safari */}
                      <div className="border-b border-white/5 pb-2 text-[8px] text-zinc-500 text-center">
                        radioitaimbe.com.br
                      </div>
                      
                      {/* Corpo do Safari */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                        <span className="text-[8px] font-black text-white">Versão iPhone</span>
                        <p className="text-[9px] text-zinc-350 mt-2 font-bold">Toque no ícone de Compartilhar na barra de baixo!</p>
                      </div>
                      
                      {/* Barra Inferior com Botão de Compartilhar */}
                      <div className="border-t border-white/5 pt-2 flex items-center justify-center gap-4 text-zinc-400 relative">
                        <ArrowLeft className="w-3.5 h-3.5 opacity-30" />
                        <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                        
                        {/* ÍCONE COMPARTILHAR SAFARI */}
                        <div className="relative">
                          <Share2 className="w-4 h-4 text-blue-400" />
                          <span className="absolute -inset-2 rounded border-2 border-yellow-400 animate-ping pointer-events-none"></span>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 text-lg animate-bounce pointer-events-none">
                            👆
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Ícone Criado com Sucesso */}
                  {currentStep.highlightType === "check" && (
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/15">
                        <CheckCircle2 className="w-8 h-8 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-black text-white">Atalho Criado!</h4>
                        <p className="text-[10px] text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                          Agora, procure o ícone com a logo da Rádio Itaimbé na sua lista de aplicativos do celular. Basta um toque para nos ouvir!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Alto-falante de volume do site/Mudo */}
                  {currentStep.highlightType === "mute" && (
                    <div className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-300 relative">
                      <span className="text-[8px] font-black text-amber-400 uppercase block">Verificação de Mudo</span>
                      <p className="text-[11px] text-zinc-350">Se o botão estiver com um risco ou cor vermelha, o som está desativado. Clique para reativar:</p>
                      
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 flex items-center justify-center gap-3 relative">
                        {/* Botão de Alto Falante com Cruz / Riscos (Mudo) */}
                        <div className="relative z-10">
                          <button className="bg-zinc-900 border border-white/10 text-[#e81e4d] p-3 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                            <Volume2 className="w-5 h-5 animate-pulse text-[#e81e4d]" />
                          </button>
                          
                          {/* Círculo pulsante de destaque */}
                          <span className="absolute -inset-3 rounded-full border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none"></span>
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 text-2xl animate-bounce pointer-events-none">
                            👇
                          </div>
                        </div>
                        <span className="text-[10px] text-[#e81e4d] font-black uppercase">Som Mudo (Clique aqui)</span>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Atualizar página (Refresh) */}
                  {currentStep.highlightType === "refresh" && (
                    <div className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-300 relative">
                      <span className="text-[8px] font-black text-amber-400 uppercase block">Recarregar Página</span>
                      
                      <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 flex items-center justify-between relative">
                        <div className="flex items-center gap-2">
                          {/* Botão Recarregar do Navegador */}
                          <div className="relative">
                            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
                            <span className="absolute -inset-2 rounded-full border-2 border-yellow-400 animate-ping pointer-events-none"></span>
                            <div className="absolute top-6 left-6 text-yellow-400 text-xl animate-bounce pointer-events-none">
                              👈
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-350 font-bold">Recarregar / Atualizar</span>
                        </div>
                        <span className="text-[9px] text-zinc-550">Atalho: Tecla F5</span>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Teclas do Teclado */}
                  {currentStep.highlightType === "keys" && (
                    <div className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-300 relative text-center">
                      <span className="text-[8px] font-black text-green-400 uppercase block">Atalho no Computador</span>
                      <p className="text-[10px] text-zinc-400">Segure as duas teclas indicadas juntas para dar zoom:</p>
                      
                      <div className="flex items-center justify-center gap-4 pt-2">
                        <div className="bg-zinc-950 border-2 border-zinc-750 px-4 py-3 rounded-xl shadow font-black text-xs text-white relative">
                          Ctrl
                        </div>
                        <span className="text-xl font-black text-zinc-500">+</span>
                        <div className="bg-zinc-950 border-2 border-yellow-400 px-4 py-3 rounded-xl shadow font-black text-xs text-white relative">
                          + (Mais)
                          <span className="absolute -inset-2 rounded border border-yellow-400 animate-pulse pointer-events-none"></span>
                        </div>
                      </div>
                      
                      <div className="text-yellow-400 text-2xl mt-2 animate-bounce">
                        ⌨️
                      </div>
                    </div>
                  )}

                  {/* Tipo: Modos da Rádio (Rádio 24h vs TV Ao Vivo via OBS) */}
                  {currentStep.highlightType === "modes" && (
                    <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                      {/* Modo Rádio 24h */}
                      <div 
                        onClick={() => setLightboxImage("radio")}
                        className="bg-gradient-to-br from-[#1a0636] to-[#04010b] border-2 border-purple-500/20 hover:border-purple-500/60 rounded-xl p-3 flex flex-col justify-between text-center relative overflow-hidden cursor-zoom-in group transition-all"
                      >
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full mx-auto block mb-2">
                          Modo Rádio 24h
                        </span>
                        
                        {/* Imagem Real ou Mockup CSS */}
                        <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/5 relative bg-zinc-950 flex items-center justify-center">
                          {!radioImgError ? (
                            <img 
                              src="/modo_radio.png" 
                              alt="Modo Rádio 24h"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={() => setRadioImgError(true)}
                            />
                          ) : (
                            /* Fallback Mockup CSS */
                            <div className="absolute inset-0 p-2 flex flex-col justify-between text-left text-[6px]">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="font-bold text-white">ITAIMBÉ FM 87.9</span>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              </div>
                              <div className="my-1 flex items-center justify-between gap-2">
                                {/* Player Mock */}
                                <div className="flex-1 bg-purple-950/40 border border-purple-500/20 p-1.5 rounded space-y-1">
                                  <div className="w-8 h-1 bg-white/20 rounded"></div>
                                  <div className="w-10 py-1 bg-[#e81e4d] rounded-full text-[4px] text-center text-white font-bold">PLAY</div>
                                </div>
                                {/* Visualizer Mock */}
                                <div className="w-6 h-6 rounded-full border border-purple-500/30 flex items-center justify-center relative animate-pulse">
                                  <div className="w-4 h-4 rounded-full bg-purple-500/10"></div>
                                </div>
                              </div>
                              <div className="text-[5px] text-zinc-500 text-center font-bold">Clique para ampliar 🔍</div>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-[9px] text-zinc-350 mt-2 leading-relaxed">Quando não há locutor ao vivo, você ouve música o dia todo.</p>
                      </div>

                      {/* Modo TV Ao Vivo via OBS */}
                      <div 
                        onClick={() => setLightboxImage("live")}
                        className="bg-gradient-to-br from-[#400511] to-[#0d0104] border-2 border-[#e81e4d]/20 hover:border-[#e81e4d]/60 rounded-xl p-3 flex flex-col justify-between text-center relative overflow-hidden cursor-zoom-in group transition-all"
                      >
                        <span className="bg-[#e81e4d]/20 text-red-300 border border-[#e81e4d]/30 text-[8px] font-black uppercase px-2 py-0.5 rounded-full mx-auto block mb-2 animate-pulse">
                          🔴 TV Ao Vivo (OBS)
                        </span>
                        
                        {/* Imagem Real ou Mockup CSS */}
                        <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/5 relative bg-zinc-950 flex items-center justify-center">
                          {!liveImgError ? (
                            <img 
                              src="/modo_live.png" 
                              alt="Modo TV Ao Vivo"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={() => setLiveImgError(true)}
                            />
                          ) : (
                            /* Fallback Mockup CSS */
                            <div className="absolute inset-0 p-2 flex flex-col justify-between text-left text-[6px]">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                <span className="font-bold text-red-400 text-[5px]">🔴 TV ITAIMBÉ AO VIVO</span>
                                <span className="text-zinc-550 text-[4px]">24 assistindo</span>
                              </div>
                              <div className="my-1 grid grid-cols-3 gap-1 flex-1">
                                {/* Video area */}
                                <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center">
                                  <Tv className="w-4 h-4 text-[#e81e4d] animate-pulse" />
                                </div>
                                {/* Chat area */}
                                <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 space-y-0.5 flex flex-col justify-end">
                                  <div className="w-full h-0.5 bg-white/10 rounded"></div>
                                  <div className="w-full h-0.5 bg-white/10 rounded"></div>
                                  <div className="w-full h-1 bg-[#e81e4d] rounded-full"></div>
                                </div>
                              </div>
                              <div className="text-[5px] text-zinc-550 text-center font-bold">Clique para ampliar 🔍</div>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-[9px] text-zinc-350 mt-2 leading-relaxed">Quando o locutor entra ao vivo pelo OBS, o site vira uma TV com chat!</p>
                      </div>
                    </div>
                  )}

                  {/* Tipo: Botões de Identificação (Login com Redes Sociais) */}
                  {currentStep.highlightType === "login" && (
                    <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-300 relative text-center">
                      <div className="w-10 h-10 rounded-full bg-[#e81e4d]/10 border border-[#e81e4d]/30 flex items-center justify-center mx-auto text-[#e81e4d] mb-0.5">
                        <HelpCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Identifique-se ou Entre sem Login</h4>
                      <p className="text-[9.5px] text-zinc-450 leading-relaxed max-w-[280px] mx-auto">
                        Para enviar o seu pedido, entre com o Facebook, Google ou clique no botão verde para pedir sem login.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2 pt-1 relative">
                        {/* Botão Facebook */}
                        <div className="bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 opacity-60">
                          <span>🔵 Facebook</span>
                        </div>

                        {/* Botão Google */}
                        <div className="bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 opacity-60">
                          <span>🔴 Google (Login do YouTube)</span>
                        </div>

                        {/* Divider */}
                        <div className="relative flex py-0.5 items-center">
                          <div className="flex-grow border-t border-white/5"></div>
                          <span className="flex-shrink mx-2 text-[7px] text-zinc-600 font-bold uppercase tracking-wider">ou</span>
                          <div className="flex-grow border-t border-white/5"></div>
                        </div>

                        {/* Botão Visitante com Destaque de Clique */}
                        <div className="relative z-20">
                          <div className="bg-emerald-500/10 border-2 border-yellow-400 text-emerald-400 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5">
                            <span>🎵 Pedir como Visitante (Sem Login)</span>
                          </div>
                          
                          {/* Círculo de Destaque */}
                          <span className="absolute -inset-2.5 rounded-xl border-4 border-yellow-400 animate-ping opacity-75 pointer-events-none"></span>
                          <div className="absolute top-8 left-2/3 text-yellow-400 text-2xl animate-bounce pointer-events-none">
                            ☝️
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] text-zinc-550 block pt-0.5 font-bold">* Rápido, seguro e não precisa digitar senhas!</span>
                    </div>
                  )}

                  {/* Tipo: Outros / Respostas do FAQ */}
                  {(currentStep.highlightType === "none" || (activeTutorial.id === 7 && currentStep.highlightType === "check")) && (
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300 max-w-sm p-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-[#e81e4d]/10 border border-[#e81e4d]/20 flex items-center justify-center text-[#e81e4d]">
                        <CheckCircle2 className="w-6 h-6 text-[#e81e4d]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase">{currentStep.title}</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                          {currentStep.actionHighlight}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* 2. LEGENDA DA NARRAÇÃO EM LETRAS GIGANTES (Subtítulos para idosos) */}
                <div className="bg-black/95 border-t border-white/10 p-5 min-h-[90px] flex flex-col gap-3 justify-center">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className="text-xs text-[#e81e4d] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-[#e81e4d] rounded-full animate-ping"></span>
                      🔊 Narração por Voz
                    </span>
                    
                    {/* Botões de Controle de Voz */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(currentStep.narration)}
                        className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-white/20 text-[10px] font-black text-white hover:bg-zinc-800 rounded-lg transition-all active:scale-95 uppercase tracking-wider"
                      >
                        🔄 Repetir Voz
                      </button>
                      <button
                        onClick={() => {
                          const nextMuted = !isNarratorMuted;
                          setIsNarratorMuted(nextMuted);
                          if (nextMuted && typeof window !== "undefined" && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                          }
                        }}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all active:scale-95 uppercase tracking-wider ${
                          isNarratorMuted
                            ? "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
                            : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {isNarratorMuted ? "🔇 Voz Desativada" : "🔊 Voz Ativa"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <p className="text-zinc-100 font-extrabold text-sm md:text-base leading-relaxed tracking-wide">
                      "{currentStep.narration}"
                    </p>
                  </div>
                </div>

              </div>

              {/* 3. CAPTIONS E CONTROLES DO SIMULADOR */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-950/80 border border-white/5 p-4 rounded-2xl">
                
                {/* Passo Atual */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-450 font-bold uppercase">Passo:</span>
                  <div className="flex items-center gap-1.5">
                    {activeTutorial.steps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                          idx === currentStepIndex
                            ? "bg-[#e81e4d] text-white"
                            : "bg-zinc-900 text-zinc-450 border border-white/5 hover:text-white"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botões Voltar / Avançar */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={prevStep}
                    className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-3 rounded-xl border border-white/5 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar</span>
                  </button>

                  <button
                    onClick={nextStep}
                    className="flex-1 md:flex-none bg-[#e81e4d] hover:bg-pink-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/25 active:scale-95 animate-pulse"
                    style={{ animationDuration: '3s' }}
                  >
                    <span>{currentStepIndex === activeTutorial.steps.length - 1 ? "Próximo Guia" : "Próximo Passo"}</span>
                    <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
                  </button>
                </div>
              </div>

              {/* Box de Informações Técnicas de Gravação (Útil para o pessoal da rádio) */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest border-b border-white/5 pb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Especificações para Produção do Vídeo</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 font-bold block">Sugestão de Música de Fundo:</span>
                    <span className="text-zinc-300 font-medium">{activeTutorial.soundtrack}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold block">Tempo de Vídeo Estimado:</span>
                    <span className="text-zinc-300 font-medium">{activeTutorial.duration}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            
            /* MODO 2: MANUAIS E ROTEIROS COMPLETOS PARA GRAVAÇÃO */
            <div className="glass-panel border border-zinc-800/60 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl bg-zinc-950/40">
              
              <div className="border-b border-white/5 pb-4 space-y-1">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Manual de Mídia da Rádio</span>
                <h2 className="text-xl md:text-2xl font-black text-white">Roteiros Detalhados de Gravação</h2>
                <p className="text-xs text-zinc-400">
                  Estes roteiros foram padronizados para guiar a gravação de vídeos oficiais para redes sociais e site da Rádio Itaimbé.
                </p>
              </div>

              {/* ROTEIRO COMPLETO DO VÍDEO SELECIONADO */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-4.5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 rounded-xl">
                      {activeTutorial.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">Vídeo {activeTutorial.id}: {activeTutorial.title}</h3>
                      <p className="text-[10px] text-zinc-450 mt-0.5">Foco: Linguagem para idosos, ritmo lento e zoom visual</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-300 uppercase">
                    <span className="px-3 py-1 bg-zinc-950 border border-white/5 rounded-full">Tempo: {activeTutorial.duration}</span>
                  </div>
                </div>

                {/* Seção da Trilha Sonora */}
                <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Trilha Sonora Sugerida:</h4>
                  <p className="text-xs text-purple-300 font-medium italic">
                    "{activeTutorial.soundtrack}" (música de fundo em volume bem baixo para não atrapalhar a voz do narrador).
                  </p>
                </div>

                {/* Passo a Passo no Roteiro */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Sequência Cronológica de Gravação:</h4>
                  
                  <div className="relative border-l-2 border-zinc-850 ml-3 pl-5 space-y-6">
                    {activeTutorial.steps.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Marcador do Passo */}
                        <span className="absolute -left-[29px] top-0.5 w-4.5 h-4.5 rounded-full bg-zinc-950 border-2 border-purple-500 flex items-center justify-center text-[9px] font-black text-purple-400">
                          {idx + 1}
                        </span>

                        <div className="space-y-2.5">
                          <h5 className="text-xs font-black text-white uppercase">{step.title}</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                            <div className="bg-zinc-950/60 border border-white/5 p-3.5 rounded-xl space-y-1">
                              <span className="text-[9px] font-black text-[#e81e4d] uppercase block">O que o Narrador Fala (Narração):</span>
                              <p className="text-zinc-300 leading-relaxed italic">
                                "{step.narration}"
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="bg-zinc-950/60 border border-white/5 p-3.5 rounded-xl space-y-1">
                                <span className="text-[9px] font-black text-blue-400 uppercase block">Texto Escrito na Tela (Legendas):</span>
                                <p className="text-zinc-300 leading-relaxed font-black">
                                  {step.screenText}
                                </p>
                              </div>

                              <div className="bg-zinc-950/60 border border-white/5 p-3.5 rounded-xl space-y-1">
                                <span className="text-[9px] font-black text-amber-400 uppercase block">Instrução para a Câmera / Gravação:</span>
                                <p className="text-zinc-350 leading-relaxed">
                                  {step.actionHighlight} (utilizar zoom e efeitos de círculo vermelho ou setas coloridas piscando nos pontos de clique).
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* NOTA DE UTILIZAÇÃO E AJUDA RÁPIDA */}
      <div className="glass-panel border border-zinc-800/60 rounded-3xl p-6 text-center space-y-3 shadow-xl bg-gradient-to-r from-zinc-950 to-zinc-900/50">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Ainda tem dúvidas? Fale conosco!</h3>
        <p className="text-xs text-zinc-450 font-medium max-w-lg mx-auto leading-relaxed">
          Se você tentou todos os passos e ainda não conseguiu ouvir ou pedir música, fale com nossa equipe de suporte pelo Whatsapp oficial ou envie um e-mail. Estamos aqui para ajudar você a ter a melhor companhia no seu dia!
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-3 rounded-full border border-white/5 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
          >
            <span>Voltar para a Rádio Ao Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#e81e4d]" />
          </a>
        </div>
      </div>

      {/* LIGHTBOX MODAL PARA AMPLIAÇÃO DE IMAGENS/MOCKUPS */}
      {lightboxImage !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Botão Fechar no Topo */}
          <button 
            className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-full border border-white/10 transition-all hover:scale-105 active:scale-95 z-[100000] text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
            onClick={() => setLightboxImage(null)}
          >
            <span>❌ Fechar</span>
          </button>

          {/* Container Principal */}
          <div 
            className="w-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center relative p-2"
            onClick={(e) => e.stopPropagation()} // impede fechar ao clicar no modal
          >
            {lightboxImage === "radio" ? (
              // MODO RÁDIO
              !radioImgError ? (
                <img 
                  src="/modo_radio.png" 
                  alt="Modo Rádio 24h Ampliado"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
                  onError={() => setRadioImgError(true)}
                />
              ) : (
                // Mockup Rádio Ampliado (Fallback)
                <div className="w-full aspect-video bg-gradient-to-br from-[#270b47] via-[#110423] to-[#04010b] border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                  <div className="absolute top-10 left-1/4 w-32 h-32 bg-[#e81e4d]/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                  
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                        <Radio className="w-4 h-4 text-[#e81e4d]" />
                      </div>
                      <span className="text-xs font-black text-white tracking-widest">RÁDIO ITAIMBÉ 87.9 FM</span>
                    </div>
                    <span className="bg-[#e81e4d]/10 border border-[#e81e4d]/30 text-[#e81e4d] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Modo Rádio 24h (Automático)
                    </span>
                  </div>

                  {/* Centro Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-4">
                    <div className="space-y-4">
                      <h2 className="text-2xl md:text-3xl font-black text-white">ITAIMBÉ FM</h2>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">Você está ouvindo nossa programação automática 24 horas por dia com a melhor qualidade de som. Este modo é exibido sempre que a rádio funciona de forma automática.</p>
                      
                      {/* Player e Volume */}
                      <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center gap-3">
                          <button className="bg-[#e81e4d] text-white px-5 py-2.5 rounded-full text-xs font-black tracking-wider uppercase">
                            ▶️ OUVE AGORA
                          </button>
                          <span className="text-[10px] text-zinc-400 font-medium">Status: Conectado</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Volume2 className="w-4 h-4 text-zinc-400" />
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                            <div className="w-2/3 h-full bg-[#e81e4d] rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito Visualizer */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-32 h-32 rounded-full border border-purple-500/20 flex items-center justify-center relative animate-pulse">
                        <div className="w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e81e4d] to-purple-600 flex items-center justify-center shadow-lg">
                            <Radio className="w-6 h-6 text-white animate-pulse" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-black uppercase mt-4 tracking-wider">Ondas de Áudio Circular</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-500 text-center border-t border-white/5 pt-2 font-medium">
                    (Esta é uma simulação visual. Para exibir sua foto real, adicione o arquivo "modo_radio.png" na pasta public do site).
                  </div>
                </div>
              )
            ) : (
              // MODO LIVE
              !liveImgError ? (
                <img 
                  src="/modo_live.png" 
                  alt="Modo TV Ao Vivo Ampliado"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
                  onError={() => setLiveImgError(true)}
                />
              ) : (
                // Mockup TV Ao Vivo Ampliado (Fallback)
                <div className="w-full aspect-video bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                  
                  {/* Cabeçalho */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-xs font-black text-white uppercase tracking-widest text-red-500">🔴 TV ITAIMBÉ AO VIVO</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400">
                      <span className="bg-zinc-900 border border-white/5 px-3 py-1 rounded-full text-red-400">32 Ouvintes assistindo</span>
                    </div>
                  </div>

                  {/* Centro Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 my-4 items-stretch">
                    {/* Vídeo Player */}
                    <div className="md:col-span-2 bg-zinc-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                        <Tv className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-3 font-black uppercase tracking-wider">Transmissão em Vídeo via OBS Studio</span>
                      <span className="text-[9px] text-zinc-500 mt-1">Exibida quando o locutor entra ao vivo de nosso estúdio!</span>
                    </div>

                    {/* Chat do Site */}
                    <div className="md:col-span-1 bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-[10px] font-black text-white uppercase border-b border-white/5 pb-1 block">Chat de Ouvintes</span>
                      <div className="flex-1 my-2 overflow-y-auto space-y-2 text-[9px] flex flex-col justify-end">
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-pink-400 font-bold block">Pedro de Cambará:</span>
                          <span className="text-zinc-350">Muito boa a transmissão ao vivo, parabéns!</span>
                        </div>
                        <div className="bg-[#e81e4d]/10 border border-[#e81e4d]/20 p-2 rounded">
                          <span className="text-[#e81e4d] font-bold block">Você:</span>
                          <span className="text-zinc-300">Toca Roberto Carlos e manda um abraço!</span>
                        </div>
                      </div>
                      <input type="text" readOnly placeholder="Digite sua mensagem..." className="w-full bg-zinc-950 border border-white/5 p-1.5 rounded-lg text-[9px] text-zinc-400 outline-none" />
                    </div>
                  </div>

                  <div className="text-[10px] text-zinc-550 text-center border-t border-white/5 pt-2 font-medium">
                    (Esta é uma simulação visual. Para exibir sua foto real, adicione o arquivo "modo_live.png" na pasta public do site).
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
