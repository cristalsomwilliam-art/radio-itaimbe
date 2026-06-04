# MANUAL TÉCNICO COMPLETO - RÁDIO ITAIMBÉ 87.9 FM
Este manual reúne todas as etapas de configuração, deploy, integração e manutenção da plataforma híbrida de Rádio e TV Web da Rádio Itaimbé.

---

## 1. INSTALAÇÃO LOCAL (WINDOWS)

O computador local na rádio hospedará o servidor de vídeo da **TV Itaimbé** (Owncast), o agente do **Cloudflare Tunnel** e o **Painel de Manutenção**.

### Pré-requisitos
* Sistema Operacional: Windows 10 ou 11 (64 bits).
* Conectividade com a internet.
* Privilégios de Administrador.

### Instalação via Script PowerShell Automatizado
1. Abra o diretório `/local/` do projeto.
2. Clique com o botão direito no arquivo `install.ps1` e selecione **Executar com o PowerShell** (ou execute via Terminal do Windows como Administrador).
3. O script irá:
   * Criar a pasta central em `C:\RadioItaimbeServer\`.
   * Baixar e instalar a versão estável do **Owncast** e **FFmpeg**.
   * Adicionar o FFmpeg nas Variáveis de Ambiente do Windows automaticamente.
   * Liberar as portas de rede no Firewall do Windows Defender:
     * **8080 (TCP)**: Acesso ao player web do Owncast.
     * **1935 (TCP)**: Recepção do fluxo RTMP do OBS Studio.
   * Baixar o binário do **Cloudflare Tunnel** (`cloudflared`).
   * Solicitar o Token do Túnel da Cloudflare. Se você informar o token, ele instalará o túnel como um Serviço do Windows com inicialização automática.
   * Criar atalhos úteis no seu Desktop.

### Inicialização Manual do Owncast
Caso não tenha instalado o Cloudflare como serviço ou queira rodar o Owncast em primeiro plano para testes, basta clicar no atalho **Iniciar Servidor Owncast** criado no Desktop.

---

## 2. CONFIGURAÇÃO E DEPLOY NA VERCEL

O site principal e o painel administrativo foram desenvolvidos utilizando Next.js com App Router. Para hospedagem gratuita, o deploy deve ser feito na Vercel.

### Passos para Deploy na Vercel
1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Conecte seu repositório Git contendo o projeto.
3. Importe o diretório `frontend` como projeto principal.
4. Adicione as seguintes **Variáveis de Ambiente (Environment Variables)** nas configurações da Vercel:

| Nome da Variável | Descrição | Exemplo / Valor |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de API do seu projeto Supabase | `https://xxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anônima do Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada administrativa (Não exposta no client) | `eyJhbGciOi...` |
| `RADIOBOSS_SECRET_TOKEN` | Token de segurança para autenticar o RadioBOSS | `itaimbe_secret_token_879` |
| `OWNCAST_WEBHOOK_SECRET` | Token de segurança para validar webhooks do Owncast | `itaimbe_owncast_secret_879` |

5. Clique em **Deploy**. A Vercel gerará o link público do seu site.

---

## 3. CONFIGURAÇÃO DO BANCO DE DADOS E STORAGE (SUPABASE)

O Supabase gerenciará a programação, os locutores, as notícias, os videoclipes do modo automático e os metadados do streaming.

### Configuração do Banco de Dados
1. Crie um projeto gratuito no [supabase.com](https://supabase.com).
2. Vá até o menu **SQL Editor** no painel lateral do Supabase.
3. Crie uma nova query, copie o conteúdo do arquivo [`supabase/schema.sql`](file:///d:/Projeto%20Radio%20Itaimb%C3%A9/supabase/schema.sql) do projeto e clique em **Run**. Isso criará todas as tabelas, índices, triggers e políticas RLS (Row Level Security).

### Configuração do Supabase Storage (Buckets)
1. No painel lateral do Supabase, vá em **Storage**.
2. Execute o script contido em [`supabase/storage.sql`](file:///d:/Projeto%20Radio%20Itaimb%C3%A9/supabase/storage.sql) através do SQL Editor ou crie manualmente os seguintes buckets marcando-os como **Public**:
   * `banners`
   * `hosts-photos`
   * `news-covers`
   * `videoclips-media`
3. Certifique-se de aplicar as políticas de escrita (apenas usuários autenticados podem inserir/editar) e leitura (público total).

### Criando Usuário Administrador
No menu lateral do Supabase, vá em **Authentication** -> **Users** -> **Add User** -> **Create User**. Crie o e-mail e senha do administrador que utilizará o painel do site (ex: `/admin/login`).

---

## 4. CONFIGURAÇÃO DO RADIOBOSS (MÉTODOS E INTEGRAÇÃO)

Para exibir a música atual, artista, capa do álbum e quantidade de ouvintes no site sem recarregar a página, integramos a rádio diretamente com o RadioBOSS.

### Configurando o Envio de Metadados Automático
1. Abra o **RadioBOSS** no computador da rádio.
2. Vá em **Configurações** (Settings) -> **Opções** (Options) -> **Relatório** (Reports).
3. Na seção **Requisição HTTP (HTTP Request)**, marque a opção "Ativar requisição HTTP".
4. Configure a URL de requisição apontando para a API do seu site publicado na Vercel:
   ```http
   https://seu-site-vercel.vercel.app/api/radioboss-metadata?pass=itaimbe_secret_token_879&artist=%artist&title=%title&listeners=%listeners&next=%next
   ```
   *(Substitua `seu-site-vercel.vercel.app` pelo seu domínio oficial e certifique-se de que o parâmetro `pass` coincide com o valor cadastrado na variável `RADIOBOSS_SECRET_TOKEN` na Vercel).*
5. Altere a frequência de envio para: **A cada troca de faixa (On track change)**.
6. Clique em **Aplicar** e **OK**.

### Configurando o Codificador de Áudio (Streaming Icecast)
Para alimentar o player de áudio integrado do site:
1. No RadioBOSS, vá em **Configurações** -> **Transmissão** (Broadcasting).
2. Adicione uma nova conexão:
   * **Servidor**: `morcast.caster.fm:15366`
   * **Senha**: `Q6i7ij3oMe`
   * **Mount Point / Ponto de Montagem**: `/BZRqL`
   * **Formato**: MP3 ou AAC (AAC é altamente recomendado para melhor qualidade em bitrates mais baixos, ex: 64kbps).

---

## 5. CONFIGURAÇÃO DO OBS STUDIO PARA TRANSMISSÃO DA TV

O OBS Studio fará a captura de vídeo na rádio e enviará o stream RTMP para o servidor local do Owncast, que processa a conversão para HLS.

### Configurando a Transmissão no OBS Studio
1. Abra o **OBS Studio** no computador da rádio.
2. Clique em **Configurações** (Settings) -> **Transmissão** (Stream).
3. Ajuste as opções:
   * **Serviço**: Personalizado (Custom...)
   * **Servidor**: `rtmp://localhost/live` (ou `rtmp://127.0.0.1/live`)
   * **Chave de transmissão**: Insira a chave configurada no painel de administração do seu Owncast local (pode ser qualquer chave definida, ex: `itaimbe_live_key`).
4. Vá em **Saída** (Output) e configure as diretrizes de codificação para HLS (baixa latência e compatibilidade):
   * **Modo de Saída**: Avançado (Advanced)
   * **Codificador de Vídeo**: x264 ou Hardware (NVIDIA NVENC/AMD AMF)
   * **Controle de Taxa**: CBR
   * **Taxa de Bits (Bitrate)**: Entre `2500 Kbps` e `4000 Kbps` (ideal para 720p/1080p a 30fps sem sobrecarregar a internet local).
   * **Intervalo de Keyframe**: `2` segundos (MUITO IMPORTANTE para HLS).
   * **Perfil (Profile)**: high ou main.

---

## 6. CONFIGURAÇÃO DE DOMÍNIO E DNS (REGISTRO.BR)

Para publicar a plataforma sob o domínio oficial `radioitaimbe.com.br`, configure as seguintes zonas de DNS no seu painel do Registro.br (ou Cloudflare, se gerenciar por lá):

### Tabela de Apontamento DNS recomendada

| Subdomínio / Nome | Tipo | Alvo / Destino | Descrição |
| :--- | :--- | :--- | :--- |
| `@` (Principal) | `A` ou `CNAME` | Apontar para os servidores da Vercel (`76.76.21.21` ou `cname.vercel-dns.com`) | Site da Rádio |
| `www` | `CNAME` | `cname.vercel-dns.com` | Redirecionamento amigável |
| `tv` | `CNAME` | Apontar para o domínio gerado pelo Cloudflare Tunnel (ex: `xxxx.cfargotunnel.com`) | Endereço do streaming de vídeo local |
| `admin` | `CNAME` | Apontar para os servidores da Vercel | Opcional (se quiser mapear o dashboard em subdomínio) |

---

## 7. PROCEDIMENTOS DE EMERGÊNCIA E DIAGNÓSTICO

### Reiniciar o Sistema Rapidamente em caso de Quedas
O computador local da rádio possui um painel de monitoramento integrado. Em caso de travamento do streaming de vídeo ou desconexão do chat:
1. Abra o arquivo **Iniciar-Painel-Manutencao.bat** no Desktop (como administrador).
2. Acesse `http://localhost:3000` no navegador.
3. No painel:
   * Verifique o consumo de CPU e RAM.
   * Clique em **Reiniciar Owncast** para recarregar o transmissor de vídeo local.
   * Clique em **Reiniciar Túnel** se a TV aparecer como "offline" no site principal mesmo com o OBS transmitindo.

### Logs de Erros
Se o Owncast não iniciar ou a transmissão estiver caindo constantemente, consulte os arquivos de log gerados automaticamente em `C:\RadioItaimbeServer\logs\`.
