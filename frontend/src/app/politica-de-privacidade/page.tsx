import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Rádio Itaimbé",
  description: "Política de Privacidade da Rádio Itaimbé 87.9 FM. Saiba como gerenciamos os seus dados pessoais.",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Botão Voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a Rádio
      </Link>

      <div className="glass-panel rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Efeito Visual */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#e81e4d]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
              Política de Privacidade
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Última atualização: Junho de 2026
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-zinc-300 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            A <strong>Rádio Itaimbé 87.9 FM</strong>, acessível a partir do domínio{" "}
            <a href="https://radioitaimbe.com.br" className="text-[#e81e4d] hover:underline font-semibold">
              radioitaimbe.com.br
            </a>
            , valoriza a privacidade dos seus usuários. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos as informações fornecidas por você ao utilizar a nossa plataforma.
          </p>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">1. Coleta de Informações</h2>
            <p>
              Ao utilizar o login social (Facebook ou Google) para interagir em nosso Chat ao Vivo, coletamos os seguintes dados básicos fornecidos pelo respectivo provedor:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nome público de perfil (utilizado para identificação no chat);</li>
              <li>E-mail cadastrado (utilizado estritamente para identificação única de conta e controle administrativo de moderação);</li>
              <li>Foto de perfil (utilizada para exibir o avatar de quem envia a mensagem).</li>
            </ul>
            <p className="mt-2 text-zinc-400">
              Nenhum dado pessoal extra, histórico de navegação ou informações financeiras são solicitados ou armazenados.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">2. Uso dos Dados</h2>
            <p>
              Os dados coletados são usados exclusivamente para:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Permitir o envio de mensagens em nosso Chat ao Vivo e exibir seu avatar de forma correta;</li>
              <li>Identificar e combater abusos, spam ou condutas inapropriadas no chat (como banimento ou exclusão de mensagens por parte da moderação da Rádio);</li>
              <li>Garantir a conformidade técnica das mensagens enviadas ao painel do OBS Studio através de integrações autorizadas (como o Social Stream Ninja).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">3. Compartilhamento e Divulgação</h2>
            <p>
              Nós **não vendemos, alugamos ou comercializamos** seus dados pessoais a terceiros. As mensagens enviadas no chat são públicas e exibidas em tempo real para os visitantes do site, bem como integradas na transmissão de vídeo da rádio (exibidas na tela da TV Itaimbé via OBS).
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">4. Segurança dos Dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acessos não autorizados, alterações ou perdas. Toda a comunicação com a nossa plataforma é criptografada via protocolo seguro HTTPS e nossos bancos de dados são hospedados na infraestrutura do Supabase.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">5. Direitos do Usuário</h2>
            <p>
              Você pode, a qualquer momento, solicitar a exclusão de suas mensagens enviadas ou pedir a remoção da sua conta e dados salvos do chat entrando em contato direto com a administração da rádio.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">6. Contato</h2>
            <p>
              Para esclarecer dúvidas sobre esta Política de Privacidade ou solicitar a remoção de informações pessoais, entre em contato através do e-mail oficial:{" "}
              <span className="text-white font-semibold">cristalsomwilliam@gmail.com</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
