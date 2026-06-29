const { Client, GatewayIntentBits, ActivityType, SlashCommandBuilder, Routes } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus, generateDependencyReport } = require('@discordjs/voice');
const { createClient } = require('@supabase/supabase-js');
const { REST } = require('@discordjs/rest');
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

// Função para iniciar o stream de áudio
function playRadio() {
  try {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    console.log(`[Áudio] Tentando conectar ao stream: ${process.env.STREAM_URL}`);
    const resource = createAudioResource(process.env.STREAM_URL, {
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
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Rádio Itaimbé Discord Bot está online!\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[Web Server] Servidor de monitoramento iniciado na porta ${PORT}`);
});
