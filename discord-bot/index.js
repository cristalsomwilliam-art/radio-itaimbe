const { Client, GatewayIntentBits, ActivityType, SlashCommandBuilder, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus, generateDependencyReport, StreamType } = require('@discordjs/voice');
const { createClient } = require('@supabase/supabase-js');
const { REST } = require('@discordjs/rest');
const http = require('http');
const https = require('https');
require('dotenv').config();

console.log('=== RELATÓRIO DE DEPENDÊNCIAS DE ÁUDIO ===');
console.log(generateDependencyReport());
console.log('===========================================\n');

// Configura o caminho do FFmpeg estático para o bot rodar sem precisar instalar o FFmpeg no Windows
try {
  process.env.FFMPEG_PATH = require('ffmpeg-static');
  console.log('[FFmpeg] Usando binário estático local:', process.env.FFMPEG_PATH);
} catch (err) {
  console.error('[FFmpeg] Erro ao carregar ffmpeg-static:', err.message);
}

// Validação de variáveis de ambiente obrigatórias
const requiredEnv = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STREAM_URL'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`[ERRO] Variáveis de ambiente ausentes no arquivo .env: ${missingEnv.join(', ')}`);
  console.error('Por favor, configure o arquivo .env com base no .env.example antes de iniciar.');
  process.exit(1);
}

// Inicialização do Supabase com tratamento de erro
let supabase;
try {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('[Supabase] Inicializado com sucesso.');
} catch (error) {
  console.error('[Supabase] Erro crítico ao inicializar cliente Supabase:', error.message);
  process.exit(1);
}

// Inicialização do Client do Discord com as intenções necessárias
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ]
});

// Configuração do Player de Áudio Global
const player = createAudioPlayer();
let currentConnection = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectTimeout = null;
const disconnectTimeouts = new Map();

// Função auxiliar para conectar diretamente ao fluxo de áudio injetando os cabeçalhos anti-hotlink do Caster.fm
function getAudioStream(urlStr, callback) {
  try {
    const parsedUrl = new URL(urlStr);
    const clientHttp = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      headers: {
        'Referer': 'http://morcast.caster.fm/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    clientHttp.get(urlStr, options, (res) => {
      // Tratar redirecionamento HTTP (ex: 301, 302)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        getAudioStream(res.headers.location, callback);
        return;
      }
      
      if (res.statusCode !== 200) {
        callback(new Error(`Servidor de streaming retornou status HTTP ${res.statusCode}`));
        return;
      }

      console.log(`[Áudio] Conexão HTTP estabelecida. Tipo de conteúdo: ${res.headers['content-type']}`);
      callback(null, res);
    }).on('error', (err) => {
      callback(err);
    });
  } catch (err) {
    callback(err);
  }
}

// Função para iniciar o stream de áudio
function playRadio() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Se o stream URL for o do Cloudflare, podemos forçar a conexão direta ao Caster.fm para maior estabilidade
  let url = process.env.STREAM_URL;
  if (url.includes('stream.radioitaimbe.com.br')) {
    console.log('[Áudio] Redirecionando fluxo local do Cloudflare diretamente para o servidor Caster.fm para evitar quedas.');
    url = 'http://morcast.caster.fm:15366/BZRqL';
  }

  console.log(`[Áudio] Tentando conectar ao stream: ${url}`);

  getAudioStream(url, (err, stream) => {
    if (err) {
      console.error('[Áudio] Erro ao conectar ao stream de áudio:', err.message);
      handleAudioReconnect();
      return;
    }

    try {
      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });
      
      // Volume inicial padrão: 50%
      resource.volume.setVolume(0.5); 
      player.play(resource);
      reconnectAttempts = 0; // Reseta tentativas se conseguiu iniciar o player
    } catch (error) {
      console.error('[Áudio] Erro crítico ao criar/reproduzir recurso de áudio:', error.message);
      handleAudioReconnect();
    }
  });
}

// Rotina de auto-reconexão com backoff progressivo
function handleAudioReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`[Áudio] Limite máximo de reconexões (${MAX_RECONNECT_ATTEMPTS}) atingido. Aguardando ação manual.`);
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(3000 * reconnectAttempts, 30000); // Max 30 segundos de intervalo
  console.warn(`[Áudio] Tentativa de reconexão de áudio ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} em ${delay / 1000}s...`);

  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    playRadio();
  }, delay);
}

// Eventos do player de áudio
player.on(AudioPlayerStatus.Idle, () => {
  console.log('[Áudio] Player ocioso (Idle). Tentando restabelecer conexão...');
  handleAudioReconnect();
});

player.on(AudioPlayerStatus.Buffering, () => {
  console.log('[Áudio] Carregando/Buffering stream...');
});

player.on(AudioPlayerStatus.Playing, () => {
  console.log('[Áudio] Tocando ao vivo com sucesso!');
  reconnectAttempts = 0;
});

player.on('error', error => {
  console.error(`[Áudio] Erro no player de áudio: ${error.message}`);
  handleAudioReconnect();
});

// Registro dos Comandos (Slash Commands)
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Faz o bot entrar no seu canal de voz e tocar a Rádio Itaimbé ao vivo'),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Para a música e desconecta o bot do canal de voz'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Mostra informações sobre a música que está tocando agora'),
].map(command => command.toJSON());

client.once('ready', async () => {
  console.log(`\n==================================================`);
  console.log(`Bot conectado ao Discord com sucesso!`);
  console.log(`Usuário: ${client.user.tag}`);
  console.log(`ID do Bot: ${client.user.id}`);
  console.log(`==================================================\n`);
  
  // Registrar Slash Commands globalmente para qualquer servidor onde o bot for adicionado
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('[Discord API] Registrando comandos de barra (/) globalmente...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log('[Discord API] Comandos registrados com sucesso!');
  } catch (error) {
    console.error('[Discord API] Erro ao registrar comandos:', error.message);
  }

  // 1. Sincronizar status inicial do bot com base no Supabase
  fetchAndUpdatePresence();

  // 2. Ouvir mudanças em tempo real na tabela stream_status
  setupSupabaseRealtime();
});

// Busca o status atual no banco e atualiza a presença do bot
async function fetchAndUpdatePresence() {
  try {
    const { data, error } = await supabase
      .from('stream_status')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) throw error;
    if (data) {
      updatePresence(data.current_song, data.current_artist);
    }
  } catch (err) {
    console.error("[Supabase] Erro ao buscar dados iniciais de status:", err.message);
    updatePresence(null, null); // Reseta para o padrão
  }
}

// Inscreve no canal realtime do Supabase para alterações na tabela stream_status
let supabaseChannel = null;
function setupSupabaseRealtime() {
  if (supabaseChannel) {
    supabaseChannel.unsubscribe();
  }

  supabaseChannel = supabase
    .channel('discord_presence_sync')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'stream_status',
      filter: 'id=eq.main'
    }, payload => {
      const { current_song, current_artist } = payload.new;
      console.log(`[Status Rádio] Alteração detectada: ${current_artist} - ${current_song}`);
      updatePresence(current_song, current_artist);
    })
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Status da conexão: ${status}`);
      if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase Realtime] Falha na conexão de tempo real. Tentando reconectar em 10s...');
        setTimeout(() => setupSupabaseRealtime(), 10000);
      }
    });
}

// Atualiza o texto do status do bot no Discord
function updatePresence(song, artist) {
  const statusText = (song && artist && song !== 'Programação Musical') 
    ? `${artist} - ${song}` 
    : "Rádio Itaimbé 87.9 FM";

  client.user.setPresence({
    activities: [{
      name: statusText,
      type: ActivityType.Listening
    }],
    status: 'online'
  });
  console.log(`[Presença] Status do bot atualizado para: "Ouvindo ${statusText}"`);
}

// Lidar com comandos (/play, /stop, /status)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, member, guild } = interaction;

  if (commandName === 'play') {
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ 
        content: '❌ **Erro:** Você precisa estar conectado em um canal de voz para que eu possa entrar e tocar!', 
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    try {
      // Verifica se já existe uma conexão ativa nesta guilda
      const existingConnection = getVoiceConnection(guild.id);
      if (existingConnection) {
        existingConnection.destroy();
      }

      console.log(`[Voz] Iniciando conexão com o canal "${voiceChannel.name}" (ID: ${voiceChannel.id})`);
      currentConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      // Registrar listeners para diagnosticar e controlar o estado da conexão
      currentConnection.on(VoiceConnectionStatus.Signalling, () => {
        console.log('[Voz Status] Conectando... (Signalling)');
      });
      currentConnection.on(VoiceConnectionStatus.Connecting, () => {
        console.log('[Voz Status] Estabelecendo conexão UDP... (Connecting)');
      });
      currentConnection.on(VoiceConnectionStatus.Ready, () => {
        console.log('[Voz Status] Conexão estabelecida com sucesso e pronta! (Ready)');
        // Associa o player apenas quando a conexão estiver pronta
        currentConnection.subscribe(player);
        playRadio();
      });
      currentConnection.on(VoiceConnectionStatus.Disconnected, () => {
        console.warn('[Voz Status] Desconectado! (Disconnected)');
      });
      currentConnection.on('error', (error) => {
        console.error('[Voz Status] Erro na conexão de voz:', error.message);
      });

      await interaction.editReply(`📻 **Sintonizado!** Entrei no canal **${voiceChannel.name}** e comecei a transmitir a **Rádio Itaimbé 87.9 FM** ao vivo!`);
    } catch (err) {
      console.error('[Voz] Erro ao conectar ao canal de voz:', err.message);
      await interaction.editReply('❌ **Erro:** Ocorreu uma falha ao tentar conectar no canal de voz. Verifique minhas permissões de membro.');
    }
  }

  if (commandName === 'stop') {
    const activeConnection = getVoiceConnection(guild.id);
    if (activeConnection) {
      // Limpa qualquer timeout de desconexão pendente para esta guilda
      if (disconnectTimeouts.has(guild.id)) {
        clearTimeout(disconnectTimeouts.get(guild.id));
        disconnectTimeouts.delete(guild.id);
      }
      activeConnection.destroy();
      player.stop();
      currentConnection = null;
      await interaction.reply('👋 **Desconectado:** Parei a transmissão e saí do canal de voz. Obrigado por ouvir a Rádio Itaimbé!');
    } else {
      await interaction.reply({ 
        content: '⚠️ Eu não estou tocando em nenhum canal de voz deste servidor no momento.', 
        ephemeral: true 
      });
    }
  }

  if (commandName === 'status') {
    try {
      const { data, error } = await supabase
        .from('stream_status')
        .select('*')
        .eq('id', 'main')
        .single();

      if (error) throw error;

      const embed = {
        color: 0xe81e4d, // Rosa/Vermelho característico da Rádio
        title: '📻 Rádio Itaimbé 87.9 FM',
        url: 'https://www.radioitaimbe.com.br',
        description: 'Informações em tempo real da transmissão ao vivo.',
        fields: [
          { name: '🎵 Música Atual', value: data.current_song || 'Programação Musical', inline: true },
          { name: '🎙️ Locutor / Artista', value: data.current_artist || 'Rádio Itaimbé', inline: true },
          { name: '👥 Ouvintes Web', value: String(data.listeners_count || 0), inline: false },
        ],
        thumbnail: data.album_art ? { url: data.album_art } : { url: 'https://www.radioitaimbe.com.br/favicon.png' },
        timestamp: new Date().toISOString(),
        footer: { text: 'Rádio Itaimbé - A voz da nossa comunidade' }
      };

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[Comando Status] Erro ao buscar informações no Supabase:', err.message);
      await interaction.reply({ 
        content: '❌ Não foi possível buscar o status da rádio no banco de dados neste momento. Tente novamente mais tarde.', 
        ephemeral: true 
      });
    }
  }
});

// Monitora se o canal de voz ficou vazio para auto-desconectar o bot após 30 segundos


client.on('voiceStateUpdate', (oldState, newState) => {
  const guildId = oldState.guild.id || newState.guild.id;
  const connection = getVoiceConnection(guildId);
  
  if (!connection) return;

  const botChannelId = connection.joinConfig.channelId;
  if (!botChannelId) return;

  const guild = oldState.guild || newState.guild;
  const voiceChannel = guild.channels.cache.get(botChannelId);
  if (!voiceChannel) return;

  // Filtra apenas membros humanos (que não são bots)
  const humanCount = voiceChannel.members.filter(member => !member.user.bot).size;

  if (humanCount === 0) {
    // Canal ficou vazio! Inicia o timer de 30 segundos se não houver um rodando
    if (!disconnectTimeouts.has(guildId)) {
      console.log(`[Auto-Desconectar] Canal de voz "${voiceChannel.name}" está vazio. Iniciando timer de 30 segundos para sair...`);
      
      const timeout = setTimeout(() => {
        const currentChannel = guild.channels.cache.get(botChannelId);
        if (currentChannel) {
          const currentHumans = currentChannel.members.filter(member => !member.user.bot).size;
          if (currentHumans === 0) {
            console.log(`[Auto-Desconectar] Desconectando do canal "${currentChannel.name}" por inatividade.`);
            connection.destroy();
            player.stop();
            if (currentConnection === connection) {
              currentConnection = null;
            }
          }
        }
        disconnectTimeouts.delete(guildId);
      }, 30000); // 30 segundos de tolerância

      disconnectTimeouts.set(guildId, timeout);
    }
  } else {
    // Alguém entrou! Se houver um timer ativo, cancela
    if (disconnectTimeouts.has(guildId)) {
      console.log(`[Auto-Desconectar] Usuário detectado no canal "${voiceChannel.name}". Cancelando timer de saída.`);
      clearTimeout(disconnectTimeouts.get(guildId));
      disconnectTimeouts.delete(guildId);
    }
  }
});

// Tratamento global para erros não capturados para evitar que o bot caia definitivamente
process.on('unhandledRejection', error => {
  console.error('[Erro Global] Rejeição não tratada:', error);
});

process.on('uncaughtException', error => {
  console.error('[Erro Global] Exceção não tratada:', error);
});

// Login no Discord
client.login(process.env.DISCORD_TOKEN);

// Servidor HTTP simples para manter o bot vivo no Render e passar no Health Check
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Rádio Itaimbé Discord Bot está online!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Web Server] Servidor de monitoramento iniciado na porta ${PORT}`);
});
