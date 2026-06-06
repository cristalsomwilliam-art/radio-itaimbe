import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Serviço | Rádio Itaimbé",
  description: "Termos de Serviço de uso da plataforma Rádio Itaimbé 87.9 FM.",
};

export default function TermsOfService() {
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
              Termos de Serviço
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Última atualização: Junho de 2026
            </p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-zinc-300 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            Bem-vindo à plataforma online da <strong>Rádio Itaimbé 87.9 FM</strong>. Ao acessar o nosso site e usar nossas funcionalidades interativas (como o chat ao vivo), você concorda em cumprir e aceitar os seguintes Termos de Serviço.
          </p>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">1. Aceitação dos Termos</h2>
            <p>
              O uso deste website é condicionado à aceitação destes termos. Se você não concorda com qualquer parte destas diretrizes, orientamos a não interagir no Chat ao Vivo ou nos formulários da plataforma.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">2. Regras de Conduta no Chat ao Vivo</h2>
            <p>
              Nosso chat é um espaço familiar e comunitário para interação com a programação de rádio e TV. Fica estritamente proibido o envio de mensagens contendo:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Linguagem obscena, pornográfica, profana ou de ódio;</li>
              <li>Ofensas, difamações, bullying ou ameaças a outros ouvintes ou locutores;</li>
              <li>Propaganda comercial não autorizada (spam), links maliciosos ou vírus;</li>
              <li>Atividades ilegais ou apologia a crimes.</li>
            </ul>
            <p className="mt-2 text-zinc-400">
              A equipe de moderação reserva-se o direito de excluir mensagens ofensivas e suspender ou banir usuários que violem repetidamente estas regras.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">3. Uso de Imagem e Mensagens na Transmissão</h2>
            <p>
              Ao enviar mensagens no Chat ao Vivo, você reconhece e autoriza que sua mensagem, nome público e avatar possam ser exibidos em tempo real na tela de transmissão de vídeo da **TV Itaimbé** (OBS overlays), sendo visualizados publicamente por outros espectadores da transmissão.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">4. Cadastro e Contas Sociais</h2>
            <p>
              Para participar do chat, você pode fazer login utilizando sua conta do Facebook ou Google. Você é responsável por manter a segurança da sua conta social. Não somos responsáveis por qualquer acesso não autorizado resultante de negligência com seus dados de login pessoais.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">5. Limitação de Responsabilidade</h2>
            <p>
              A Rádio Itaimbé se esforça para manter a plataforma online e segura, mas não garante que o serviço de streaming ou chat seja ininterrupto ou livre de erros técnicos. A plataforma é fornecida "como está" e "conforme disponível".
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-white mb-2">6. Alterações nos Termos</h2>
            <p>
              Estes Termos podem ser atualizados periodicamente. Recomendamos a leitura desta página regularmente para se manter informado sobre as condições de uso do nosso site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
