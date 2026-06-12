#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import logging
import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET
import re
import unicodedata
import argparse
from datetime import datetime

# Reconfigurar codificação do console para UTF-8 no Windows para evitar OSError [Errno 22] ao exibir caracteres especiais
if sys.platform.startswith('win'):
    try:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'request_worker.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger("RadioBossWorker")

# Carregar arquivo .env manualmente para evitar dependências adicionais
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if not os.path.exists(env_path):
        # Se não houver .env, tentar ler do ambiente ou .env.example
        logger.warning(".env não encontrado. Tentando usar variáveis de ambiente do sistema.")
        return
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            # Remover aspas extras se houver
            val = val.strip().strip('"').strip("'")
            os.environ[key.strip()] = val

load_env()

# Configurações globais
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
RADIOBOSS_API_URL = os.getenv("RADIOBOSS_API_URL", "http://127.0.0.1:9000").rstrip('/')
RADIOBOSS_PASSWORD = os.getenv("RADIOBOSS_PASSWORD", "")
MUSIC_DIRECTORIES_RAW = os.getenv("MUSIC_DIRECTORIES", "")
LOOP_INTERVAL_SECONDS = int(os.getenv("LOOP_INTERVAL_SECONDS", "5"))
TTS_VOICE = os.getenv("TTS_VOICE", "pt-BR-AntonioNeural")
TTS_RATE = os.getenv("TTS_RATE", "-8%")

# Validar configurações obrigatórias
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.critical("SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env!")
    sys.exit(1)

# Lista de pastas a varrer
MUSIC_DIRECTORIES = [d.strip() for d in MUSIC_DIRECTORIES_RAW.split(",") if d.strip()]

# Extensões de mídia suportadas (foco em mp3 e mp4)
SUPPORTED_EXTENSIONS = ('.mp3', '.mp4', '.m4a', '.wav', '.wma', '.ogg')

# ---------------------------------------------------------
# FUNÇÕES AUXILIARES DE REQUISIÇÃO HTTP (SUPABASE & RADIOBOSS)
# ---------------------------------------------------------

def supabase_request(endpoint, method='GET', body=None, extra_headers=None):
    """Realiza requisições HTTPS para o Supabase REST API usando a biblioteca padrão urllib."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    if extra_headers:
        headers.update(extra_headers)

    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.status
            response_content = response.read().decode('utf-8')
            if response_content:
                try:
                    return status, json.loads(response_content)
                except json.JSONDecodeError:
                    return status, response_content
            return status, None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        logger.error(f"Erro HTTP do Supabase na rota {endpoint}: {e.code} - {err_msg}")
        raise e
    except Exception as e:
        logger.error(f"Erro ao conectar ao Supabase {endpoint}: {str(e)}")
        raise e

def radioboss_request(action, params=None):
    """Realiza chamadas HTTP para o RadioBOSS API."""
    if params is None:
        params = {}

    # Adicionar senha da API se configurada
    if RADIOBOSS_PASSWORD:
        params['pass'] = RADIOBOSS_PASSWORD

    # Tentar o padrão REST /api/action ou fallback para query /?action=action
    # Ambos são suportados em diferentes versões do RadioBOSS
    url_rest = f"{RADIOBOSS_API_URL}/api/{action}"
    url_fallback = f"{RADIOBOSS_API_URL}/"

    # Preparar parâmetros
    query_string = urllib.parse.urlencode(params)

    # Tentar primeiro a rota REST
    target_url = f"{url_rest}?{query_string}"
    logger.debug(f"Tentando RadioBOSS API (REST): {target_url}")
    
    try:
        req = urllib.request.Request(target_url, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            resp_bytes = response.read()
            resp_str = resp_bytes.decode('utf-8', errors='ignore').strip()
            if re.match(r'^E\d{3}', resp_str):
                raise ValueError(f"REST retornou erro: {resp_str}")
            return resp_bytes
    except Exception as e_rest:
        # Se foi erro da própria API (começando com Exxx) no fallback, repassar o erro
        if isinstance(e_rest, ValueError) and "Erro da API" in str(e_rest):
            raise e_rest
            
        logger.debug(f"Chamada REST ao RadioBOSS falhou ({str(e_rest)}). Tentando formato alternativo query...")
        
        # Tentar formato de rota alternativa: /?action=action (padrão para ações da API)
        params_fallback = params.copy()
        params_fallback['action'] = action
        query_fallback = urllib.parse.urlencode(params_fallback)
        target_url_fallback = f"{url_fallback}?{query_fallback}"
        
        try:
            req = urllib.request.Request(target_url_fallback, method='GET')
            with urllib.request.urlopen(req, timeout=5) as response:
                resp_bytes = response.read()
                resp_str = resp_bytes.decode('utf-8', errors='ignore').strip()
                if re.match(r'^E\d{3}', resp_str):
                    raise ValueError(f"Erro da API do RadioBOSS: {resp_str}")
                return resp_bytes
        except Exception as e_fallback:
            if isinstance(e_fallback, ValueError) and "Erro da API" in str(e_fallback):
                raise e_fallback
            logger.error(f"RadioBOSS HTTP API está inacessível. Certifique-se de que o RadioBOSS está aberto e o Servidor HTTP está ativado em Opções -> API.")
            raise ConnectionError(f"RadioBOSS HTTP API inacessível: REST={str(e_rest)} Fallback={str(e_fallback)}")

# ---------------------------------------------------------
# EXTRAÇÃO DE METADADOS DE MÚSICAS (MP3/MP4) E NORMALIZAÇÃO
# ---------------------------------------------------------

def clean_text(text):
    """Remove espaços em branco repetidos e quebras de linha."""
    if not text:
        return ""
    return " ".join(text.strip().split())

def parse_filename(filename):
    """Tenta extrair Artista e Título baseado no nome do arquivo: 'Artista - Título.mp3'."""
    name, ext = os.path.splitext(filename)
    if ' - ' in name:
        parts = name.split(' - ', 1)
        artist = clean_text(parts[0])
        title = clean_text(parts[1])
        return artist, title
    return None, clean_text(name)

def read_id3v1_tags(filepath):
    """Lê metadados ID3v1 no final de arquivos MP3 (completamente nativo/sem dependências)."""
    try:
        if not filepath.lower().endswith('.mp3'):
            return None
        file_size = os.path.getsize(filepath)
        if file_size < 128:
            return None
        with open(filepath, 'rb') as f:
            f.seek(file_size - 128)
            tag_data = f.read(128)
            if tag_data[0:3] == b'TAG':
                title = tag_data[3:33].split(b'\x00')[0].decode('latin1', errors='ignore').strip()
                artist = tag_data[33:63].split(b'\x00')[0].decode('latin1', errors='ignore').strip()
                # Limpar caracteres não imprimíveis
                title = "".join(ch for ch in title if ch.isprintable())
                artist = "".join(ch for ch in artist if ch.isprintable())
                if title or artist:
                    return clean_text(artist), clean_text(title)
    except Exception as e:
        logger.debug(f"Erro ao ler tag ID3v1 de {filepath}: {e}")
    return None

def extract_media_metadata(filepath):
    """Extrai Artista e Título do arquivo de mídia com fallback para o nome do arquivo."""
    filename = os.path.basename(filepath)
    
    # 1. Tentar ler tags ID3v1 nativamente se for MP3
    metadata = read_id3v1_tags(filepath)
    if metadata:
        artist, title = metadata
        if artist and title:
            return artist, title

    # 2. Fallback: Parsear nome do arquivo no formato 'Artista - Titulo'
    artist, title = parse_filename(filename)
    if artist:
        return artist, title
    
    # 3. Fallback final: Nome do arquivo como título, artista como 'Repertório'
    return "Repertório", title

def normalize_string(s):
    """Normaliza texto para permitir comparação precisa (sem acentos, minúsculo)."""
    if not s:
        return ""
    s = clean_text(s)
    # Remover acentuação
    s = unicodedata.normalize('NFD', s)
    s = s.encode('ascii', 'ignore').decode('utf-8')
    s = s.lower()
    # Manter apenas letras, números e espaços simples
    s = re.sub(r'[^a-z0-9\s]', '', s)
    return " ".join(s.split())

# ---------------------------------------------------------
# MODO SCANNER: LEITURA E SINCRONIZAÇÃO DO SSD COM SUPABASE
# ---------------------------------------------------------

def scan_ssd_and_sync():
    """Varre as pastas locais do SSD e sincroniza o catálogo com o Supabase."""
    if not MUSIC_DIRECTORIES:
        logger.error("Nenhum diretório configurado em MUSIC_DIRECTORIES no .env!")
        return

    logger.info("Iniciando varredura das pastas locais no SSD...")
    local_tracks = []
    scanned_count = 0

    for directory in MUSIC_DIRECTORIES:
        if not os.path.exists(directory):
            logger.warning(f"Diretório de busca não existe: {directory}")
            continue
        
        logger.info(f"Varrendo diretório: {directory}")
        for root, _, files in os.walk(directory):
            for file in files:
                if file.lower().endswith(SUPPORTED_EXTENSIONS):
                    filepath = os.path.abspath(os.path.join(root, file))
                    scanned_count += 1
                    
                    try:
                        file_size = os.path.getsize(filepath)
                        artist, title = extract_media_metadata(filepath)
                        
                        local_tracks.append({
                            "artist": artist,
                            "title": title,
                            "file_path": filepath,
                            "file_size": file_size
                        })
                    except Exception as e:
                        logger.error(f"Erro ao processar arquivo {filepath}: {str(e)}")

                    if len(local_tracks) >= 100:
                        # Enviar em lotes de 100 para evitar payload gigante
                        logger.info(f"Enviando lote de {len(local_tracks)} músicas para o Supabase...")
                        sync_batch_to_supabase(local_tracks)
                        local_tracks = []

    # Enviar músicas restantes
    if local_tracks:
        logger.info(f"Enviando lote final de {len(local_tracks)} músicas para o Supabase...")
        sync_batch_to_supabase(local_tracks)

    logger.info(f"Varredura concluída! {scanned_count} arquivos encontrados.")
    
    # Limpeza: Remover do catálogo do Supabase músicas que foram deletadas localmente
    clean_deleted_files_from_catalog()

def sync_batch_to_supabase(tracks):
    """Envia um lote de músicas para a tabela music_catalog no Supabase via upsert."""
    # Cabeçalho especial para indicar upsert baseado na chave única file_path
    headers = {
        "Prefer": "resolution=merge-duplicates"
    }
    try:
        status, response = supabase_request("music_catalog?on_conflict=file_path", method="POST", body=tracks, extra_headers=headers)
        if status in (200, 201):
            logger.info(f"[OK] Lote sincronizado com sucesso no Supabase.")
        else:
            logger.error(f"Erro ao sincronizar lote: Status {status} - Resposta: {response}")
    except Exception as e:
        logger.error(f"Falha ao enviar lote de sincronização: {str(e)}")

def clean_deleted_files_from_catalog():
    """Busca todas as músicas cadastradas no Supabase e remove aquelas cujos caminhos não existem no SSD."""
    logger.info("Checando se existem músicas órfãs no catálogo do Supabase para remoção...")
    try:
        # 1. Obter todos os caminhos registrados (usando paginação ou limite alto)
        status, data = supabase_request("music_catalog?select=id,file_path&limit=10000")
        if status != 200 or not isinstance(data, list):
            logger.error(f"Erro ao baixar catálogo para limpeza: Status {status}")
            return

        to_delete_ids = []
        for track in data:
            db_id = track.get("id")
            path = track.get("file_path")
            if path and not os.path.exists(path):
                logger.info(f"Arquivo removido localmente, deletando do catálogo: {path}")
                to_delete_ids.append(db_id)

        # 2. Deletar em lotes do Supabase
        if to_delete_ids:
            logger.info(f"Removendo {len(to_delete_ids)} músicas inexistentes do Supabase...")
            # Supabase permite deletar usando in.id
            id_list_str = ",".join([f"{i}" for i in to_delete_ids])
            del_status, del_resp = supabase_request(f"music_catalog?id=in.({id_list_str})", method="DELETE")
            if del_status in (200, 204):
                logger.info("[OK] Limpeza de músicas deletadas realizada com sucesso.")
            else:
                logger.error(f"Erro ao deletar músicas antigas: Status {del_status}")
        else:
            logger.info("Catálogo local e remoto em perfeito sincronismo! Nenhuma remoção necessária.")
    except Exception as e:
        logger.error(f"Erro durante o processo de limpeza do catálogo: {str(e)}")

# ---------------------------------------------------------
# ALGORITMO DE BUSCA POR APROXIMAÇÃO FONÉTICA / FUZZY MATCH
# ---------------------------------------------------------

def search_fuzzy_in_catalog(song_query):
    """Busca aproximada inteligente no catálogo do banco usando consultas otimizadas do Supabase."""
    query_norm = normalize_string(song_query)
    if not query_norm:
        return None

    logger.info(f"Buscando música no catálogo para: '{song_query}' (normalizada: '{query_norm}')")
    
    # 1. Extrair termos de busca significativos (tamanho >= 3, ignorando termos comuns de rádio)
    ignore_words = {'remix', 'clean', 'intro', 'live', 'extended', 'radio', 'edit', 'video', 'music', 'version', 'anos', 'remixado'}
    raw_words = query_norm.split()
    words = [w for w in raw_words if len(w) >= 3 and w not in ignore_words]
    
    # Se não sobrarem palavras significativas, usar palavras menores
    if not words:
        words = [w for w in raw_words if len(w) >= 2]
        
    if not words:
        logger.warning("Termo de busca muito curto ou inválido.")
        return None

    # 2. Montar consulta OR para buscar candidatos correspondentes no banco
    # Vamos pesquisar apenas músicas que contenham pelo menos uma das palavras chave no título ou artista
    or_parts = []
    # Limitar às 4 maiores palavras-chave para não exceder limites de tamanho de URL de requisição
    sorted_words = sorted(words, key=len, reverse=True)[:4]
    for w in sorted_words:
        or_parts.append(f"title.ilike.%{w}%")
        or_parts.append(f"artist.ilike.%{w}%")
        
    or_query = f"or=({','.join(or_parts)})".replace('%', '%25')
    
    # Buscar até 200 candidatos no banco de dados (rápido e abrange toda a base de 22 mil músicas)
    status, data = supabase_request(f"music_catalog?select=artist,title,file_path&{or_query}&limit=200")
    if status != 200 or not isinstance(data, list):
        logger.error("Não foi possível buscar candidatos no catálogo do Supabase.")
        return None

    logger.info(f"Encontrados {len(data)} candidatos no banco de dados. Calculando aproximações...")

    best_match = None
    best_score = 0.0

    # 3. Avaliar pontuação detalhada apenas nos candidatos retornados
    for track in data:
        artist = track.get("artist", "")
        title = track.get("title", "")
        path = track.get("file_path", "")

        # Normalizar dados do banco
        artist_norm = normalize_string(artist)
        title_norm = normalize_string(title)
        
        comb1 = f"{artist_norm} {title_norm}"
        comb2 = f"{title_norm} {artist_norm}"

        # Correspondência exata ou substring direta
        if query_norm == title_norm or query_norm == comb1 or query_norm == comb2:
            logger.info(f"Correspondência exata encontrada: {path}")
            return path
        
        if query_norm in title_norm or query_norm in comb1:
            score = 0.85 + (len(query_norm) / len(comb1)) * 0.1
            if score > best_score:
                best_score = score
                best_match = path
            continue

        # Comparação baseada em conjuntos de palavras
        query_words_set = set(raw_words)
        track_words_set = set(comb1.split())
        
        intersection = query_words_set.intersection(track_words_set)
        
        if intersection:
            score_query = len(intersection) / len(query_words_set)
            score_track = len(intersection) / len(track_words_set)
            score = max(score_query, score_track)
            
            # Penalizar se a busca for longa e houver pouca correspondência
            if len(intersection) < 2 and len(query_words_set) > 3:
                score -= 0.2
                
            if score > best_score:
                best_score = score
                best_match = path

    # Definir limite mínimo de aceitação (50% de similaridade)
    if best_score >= 0.5 and best_match:
        logger.info(f"Melhor correspondência fuzzy encontrada com pontuação {best_score:.2f}: {best_match}")
        return best_match

    logger.warning("Nenhuma correspondência fuzzy aceitável encontrada nos candidatos.")
    return None

# ---------------------------------------------------------
# INTEGRAÇÃO COM RADIOBOSS HTTP API
# ---------------------------------------------------------

def get_current_playing_index():
    """Lê a playlist ativa do RadioBOSS e retorna o índice 1-based da música tocando atualmente."""
    xml_data = b""
    try:
        # 1. Tentar obter via 'playbackinfo' (método mais leve, rápido e confiável para RadioBOSS 6.x)
        try:
            xml_data = radioboss_request("playbackinfo")
            raw_str = xml_data.decode('utf-8', errors='ignore').strip()
            if raw_str and "Nothing to do" not in raw_str and "E003" not in raw_str:
                root = ET.fromstring(xml_data)
                playback = root.find('Playback')
                if playback is not None:
                    state = (playback.attrib.get('state') or playback.attrib.get('STATE') or '').lower()
                    playlistpos_str = playback.attrib.get('playlistpos') or playback.attrib.get('PLAYLISTPOS')
                    
                    if state == 'stop':
                        logger.debug("Player do RadioBOSS está parado (state='stop').")
                        return 0
                    
                    if playlistpos_str is not None:
                        # playlistpos é 0-based no RadioBOSS, retornamos 1-based para o index atual
                        idx = int(playlistpos_str) + 1
                        logger.debug(f"Índice atual de reprodução obtido via playbackinfo (estado: '{state}'): {idx}")
                        return idx
        except Exception as e_pb:
            logger.warning(f"Falha ao obter índice via 'playbackinfo' ({str(e_pb)}). Tentando fallbacks...")

        # 2. Fallback: Tentar getplaylist2 / getplaylist clássicos se playbackinfo falhar
        try:
            xml_data = radioboss_request("getplaylist2")
            # Se a resposta for vazia ou indicar playlist vazia, retornar 0
            raw_str = xml_data.decode('utf-8', errors='ignore').strip()
            if not raw_str or "Nothing to do" in raw_str or "E003" in raw_str:
                logger.debug("Playlist vazia ou inativa no RadioBOSS (Nothing to do).")
                return 0
            root = ET.fromstring(xml_data)
        except Exception as e:
            logger.warning(f"Falha ao usar 'getplaylist2' ({str(e)}). Tentando 'getplaylist' clássico...")
            xml_data = radioboss_request("getplaylist")
            # Se a resposta for vazia ou indicar playlist vazia, retornar 0
            raw_str = xml_data.decode('utf-8', errors='ignore').strip()
            if not raw_str or "Nothing to do" in raw_str or "E003" in raw_str:
                logger.debug("Playlist vazia ou inativa no RadioBOSS (Nothing to do).")
                return 0
            root = ET.fromstring(xml_data)
        
        # Encontrar a tag de track que está tocando usando o índice sequencial 1-based do loop
        for i, track in enumerate(root.findall('track'), start=1):
            playing_val = track.attrib.get('playing') or track.attrib.get('PLAYING')
            if playing_val in ('1', 'true', 'yes'):
                logger.debug(f"Índice atual de reprodução obtido via fallback de playlist: {i}")
                return i
        
        # Se nenhuma música estiver como ativa/tocando, retornar índice 0
        logger.warning("Nenhuma música marcada como ativa ('playing=1') na playlist do RadioBOSS.")
        return 0
    except ET.ParseError as e:
        raw_resp = xml_data.decode('utf-8', errors='ignore') if xml_data else "Vazio"
        logger.error(f"Erro de formato XML do RadioBOSS. Resposta recebida: '{raw_resp}'")
        raise ValueError(f"Resposta do RadioBOSS inválida: {raw_resp}")
    except Exception as e:
        logger.error(f"Erro ao obter índice de reprodução do RadioBOSS: {str(e)}")
        raise e

def get_playlist_tracks():
    """Retorna a lista de faixas da playlist ativa do RadioBOSS com seus caminhos."""
    xml_data = b""
    try:
        try:
            xml_data = radioboss_request("getplaylist2")
            raw_str = xml_data.decode('utf-8', errors='ignore').strip()
            if not raw_str or "Nothing to do" in raw_str or "E003" in raw_str:
                return []
            root = ET.fromstring(xml_data)
        except Exception:
            xml_data = radioboss_request("getplaylist")
            raw_str = xml_data.decode('utf-8', errors='ignore').strip()
            if not raw_str or "Nothing to do" in raw_str or "E003" in raw_str:
                return []
            root = ET.fromstring(xml_data)
        
        tracks = []
        for i, track in enumerate(root.findall('track'), start=1):
            filename = track.attrib.get('filename') or track.attrib.get('FILENAME')
            if filename:
                tracks.append({
                    "index": i,  # Usar estritamente o índice sequencial 1-based do loop
                    "filename": filename
                })
        return tracks
    except Exception as e:
        logger.warning(f"Erro ao obter faixas da playlist: {e}")
        return []

def insert_song_in_radioboss(filepath, target_pos):
    """Insere o arquivo físico na fila do RadioBOSS na posição especificada."""
    params = {
        "filename": filepath,
        "pos": target_pos
    }
    try:
        resp = radioboss_request("inserttrack", params)
        # Se RadioBOSS não retornar erro, inserção deu certo. Ele costuma retornar "OK" ou resposta vazia
        logger.info(f"[OK] Sucesso ao chamar API do RadioBOSS: Inserido {filepath} na posição {target_pos}.")
        return True
    except Exception as e:
        logger.error(f"Erro ao chamar API de inserção do RadioBOSS: {str(e)}")
        raise e

def cleanup_played_locutions():
    """Busca locuções já reproduzidas na playlist do RadioBOSS, as remove da playlist e deleta os arquivos do SSD."""
    try:
        current_idx = get_current_playing_index()
        if current_idx <= 0:
            return
        
        tracks = get_playlist_tracks()
        locucoes_to_delete = []
        
        for t in tracks:
            idx = t.get("index")
            filename = t.get("filename")
            if not idx or not filename:
                continue
            
            # Normalizar caminhos para comparação
            norm_filename = os.path.basename(filename).lower()
            
            # Verificar se é um arquivo de locução temporária
            if norm_filename.startswith("locucao_") and norm_filename.endswith(".mp3"):
                if idx < current_idx:
                    locucoes_to_delete.append((idx, filename))
                    
        if not locucoes_to_delete:
            return
            
        # Ordenar do maior índice para o menor para evitar que a remoção altere a posição das anteriores
        locucoes_to_delete.sort(key=lambda x: x[0], reverse=True)
        
        for idx, filepath in locucoes_to_delete:
            logger.info(f"Removendo locução já reproduzida da playlist na posição {idx}: {filepath}")
            try:
                # Deletar da playlist do RadioBOSS (1-based index)
                radioboss_request("delete", {"pos": idx})
                
                # Aguardar um instante para o RadioBOSS processar a remoção
                time.sleep(0.5)
                
                # Deletar o arquivo físico do SSD
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                        logger.info(f"Arquivo físico de locução removido com sucesso: {filepath}")
                    except Exception as e_file:
                        logger.warning(f"Não foi possível remover o arquivo físico {filepath}: {str(e_file)}")
            except Exception as e_track:
                logger.error(f"Erro ao remover faixa {filepath} na posição {idx} do RadioBOSS: {str(e_track)}")
                
    except Exception as e:
        logger.error(f"Erro ao limpar locuções antigas da playlist: {str(e)}")

# ---------------------------------------------------------
# MONITOR DE NOVOS PEDIDOS (WORKER LOOP)
# ---------------------------------------------------------

def speak_text(text, output_path):
    """Gera áudio a partir do texto usando a biblioteca edge-tts (neural) ou fallback para gTTS."""
    import subprocess
    import site
    import importlib
    
    def refresh_imports():
        try:
            user_site = site.getusersitepackages()
            if user_site and user_site not in sys.path:
                sys.path.append(user_site)
            site.addsitedir(user_site)
        except Exception:
            pass
        try:
            importlib.invalidate_caches()
        except Exception:
            pass

    # Garantir que pacotes recém-instalados ou instalados no escopo do usuário sejam visíveis
    refresh_imports()

    # 1. Tentar usar edge-tts (voz neural premium da Microsoft)
    try:
        import edge_tts
        import asyncio
        
        async def amain():
            communicate = edge_tts.Communicate(text, TTS_VOICE, rate=TTS_RATE)
            await communicate.save(output_path)
            
        asyncio.run(amain())
        logger.info(f"Áudio da locução gerado com sucesso via edge-tts em: {output_path}")
        return True
    except (ImportError, ModuleNotFoundError):
        logger.info("edge-tts não está instalado ou não foi encontrado. Tentando instalar/atualizar caminhos automaticamente...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts"])
            refresh_imports()
            import edge_tts
            import asyncio
            
            async def amain():
                communicate = edge_tts.Communicate(text, TTS_VOICE, rate=TTS_RATE)
                await communicate.save(output_path)
                
            asyncio.run(amain())
            logger.info(f"Áudio da locução gerado com sucesso via edge-tts (pós-instalação) em: {output_path}")
            return True
        except Exception as e_install:
            logger.warning(f"Não foi possível instalar ou usar edge-tts: {e_install}. Tentando fallback gTTS...")

    # 2. Fallback para gTTS (Google TTS)
    try:
        try:
            refresh_imports()
            import gtts
        except (ImportError, ModuleNotFoundError):
            subprocess.check_call([sys.executable, "-m", "pip", "install", "gTTS"])
            refresh_imports()
            import gtts
            
        tts = gtts.gTTS(text=text, lang='pt')
        tts.save(output_path)
        logger.info(f"Áudio da locução gerado com sucesso via gTTS (fallback) em: {output_path}")
        return True
    except Exception as e_gtts:
        logger.error(f"Erro ao gerar áudio por todas as alternativas de TTS: {e_gtts}")
        return False

def process_single_request(request):
    """Processa um pedido individual de música do mural."""
    req_id = request.get("id")
    name = request.get("name")
    song_title = request.get("song_title")
    file_path = request.get("file_path")
    message = request.get("message")

    logger.info(f"Processando pedido #{req_id} de '{name}' pedindo '{song_title}'")

    # 1. Atualizar status para 'processing' para evitar processamento duplicado
    supabase_request(f"music_requests?id=eq.{req_id}", method="PATCH", body={
        "status": "processing",
        "status_message": "Verificando arquivos no SSD da rádio..."
    })

    # 2. Resolver o arquivo físico no SSD
    resolved_path = None

    if file_path:
        # Se veio com caminho pré-definido pelo autocomplete do site
        if os.path.exists(file_path):
            resolved_path = file_path
            logger.info(f"Caminho do arquivo verificado com sucesso no SSD: {resolved_path}")
        else:
            logger.warning(f"Caminho especificado pelo site não existe localmente: {file_path}. Tentando busca fuzzy...")
    
    if not resolved_path:
        # Fazer busca fuzzy (tanto para pedidos sem caminho quanto para caminhos inválidos)
        resolved_path = search_fuzzy_in_catalog(song_title)

    # 3. Tratar caso de arquivo não encontrado
    if not resolved_path or not os.path.exists(resolved_path):
        logger.error(f"Música '{song_title}' não encontrada no SSD.")
        supabase_request(f"music_requests?id=eq.{req_id}", method="PATCH", body={
            "status": "not_found",
            "status_message": "Não encontramos o arquivo desta música no SSD do repertório."
        })
        return

    # --- NOVO: GERAR LOCUÇÃO INTELIGENTE (IA) E TTS ---
    locucao_text = None
    locucao_file = None
    
    try:
        # Extrair metadados da música resolvida
        meta_artist, meta_title = extract_media_metadata(resolved_path)
        
        # Tratar caso de visitante (nome no formato "Nome - Cidade")
        nome_val = name or "Ouvinte"
        cidade_val = ""
        if " - " in nome_val:
            parts = nome_val.split(" - ", 1)
            nome_val = parts[0].strip()
            cidade_val = parts[1].strip()

        payload = {
            "tipo": "pedido",
            "nome": nome_val,
            "cidade": cidade_val,
            "mensagem": message or "",
            "musica": meta_title,
            "artista": meta_artist
        }
        
        # Chamar API online do site
        api_url = "https://www.radioitaimbe.com.br/api/locutor-automatico"
        req_payload = json.dumps(payload).encode('utf-8')
        
        req = urllib.request.Request(
            api_url,
            data=req_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-API-Secret": SUPABASE_KEY
            },
            method="POST"
        )
        
        logger.info("Solicitando locução à API do site...")
        with urllib.request.urlopen(req, timeout=30) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            
            if resp_data.get("status") == "reprovada":
                logger.warning(f"Pedido #{req_id} reprovado pela moderação da IA: {payload}")
                supabase_request(f"music_requests?id=eq.{req_id}", method="PATCH", body={
                    "status": "error",
                    "status_message": "Pedido recusado pelas diretrizes de moderação da rádio."
                })
                return
                
            locucao_text = resp_data.get("locucao")
            
        if locucao_text:
            # Pasta local para salvar as locuções
            locucoes_dir = os.path.join(os.path.dirname(__file__), 'locucoes')
            os.makedirs(locucoes_dir, exist_ok=True)
            output_path = os.path.join(locucoes_dir, f"locucao_{req_id}.mp3")
            
            # Gerar TTS neural
            if speak_text(locucao_text, output_path):
                locucao_file = output_path
    except Exception as e_api:
        logger.error(f"Erro ao obter locução ou gerar TTS: {str(e_api)}. Prosseguindo apenas com a música.")

    # 4. Chamar RadioBOSS para inserir a música na playlist
    try:
        try:
            # Descobrir qual o índice tocando
            current_idx = get_current_playing_index()
            
            if current_idx == 0:
                target_pos = 1
                status_desc = "Playlist inativa, inserido no início da fila."
            else:
                # 1. Buscar caminhos de arquivos das músicas recentemente na fila no Supabase
                recent_queued_paths = set()
                try:
                    status, req_data = supabase_request("music_requests?status=eq.queued&select=file_path&limit=100")
                    if status == 200 and isinstance(req_data, list):
                        for r in req_data:
                            path = r.get("file_path")
                            if path:
                                recent_queued_paths.add(os.path.normpath(path).lower())
                except Exception as e_req:
                    logger.warning(f"Erro ao obter caminhos na fila do Supabase: {e_req}")

                # 2. Obter a playlist do RadioBOSS
                playlist_tracks = get_playlist_tracks()
                
                # 3. Começar a partir de current_idx + 1 (para tocar logo após a música atual terminar)
                target_pos = current_idx + 1
                
                # Criar mapeamento de index -> filename para busca rápida
                playlist_map = {t["index"]: os.path.normpath(t["filename"]).lower() for t in playlist_tracks}
                
                # Avançar a posição para depois de qualquer música já pedida ou locução que esteja na fila
                while True:
                    track_path = playlist_map.get(target_pos)
                    if track_path:
                        is_recent_request = track_path in recent_queued_paths
                        is_locucao = "locucao_" in os.path.basename(track_path).lower()
                        if is_recent_request or is_locucao:
                            logger.info(f"Posição {target_pos} contém música pedida ou locução ({track_path}). Avançando...")
                            target_pos += 1
                            continue
                    break
                
                status_desc = f"Inserido na fila na posição {target_pos} (respeitando ordem cronológica)"
        except Exception as e_idx:
            logger.warning(f"Não foi possível obter o índice da música tocando ({str(e_idx)}). Inserindo no final da playlist por segurança.")
            target_pos = -1  # No RadioBOSS, -1 insere no final da playlist ativa
            status_desc = "Inserido no final da playlist ativa por precaução."

        # Chamar inserção (Locução + Música, ou apenas Música se a locução falhou)
        if locucao_file and os.path.exists(locucao_file):
            if target_pos == -1:
                insert_song_in_radioboss(locucao_file, -1)
                insert_song_in_radioboss(resolved_path, -1)
            else:
                insert_song_in_radioboss(locucao_file, target_pos)
                insert_song_in_radioboss(resolved_path, target_pos + 1)
            status_desc += " com locução do locutor IA incluída antes da música."
        else:
            insert_song_in_radioboss(resolved_path, target_pos)

        # Atualizar pedido no banco de dados para sucesso
        status_msg = "Aguarde que em breve a sua musica vai tocar na radio itaimbé"
        supabase_request(f"music_requests?id=eq.{req_id}", method="PATCH", body={
            "status": "queued",
            "file_path": resolved_path,
            "status_message": status_msg
        })
        logger.info(f"[OK] Pedido #{req_id} finalizado e agendado com sucesso no RadioBOSS. ({status_desc})")

    except Exception as e:
        logger.error(f"Erro ao injetar música no RadioBOSS: {str(e)}")
        # Salvar o erro no status
        supabase_request(f"music_requests?id=eq.{req_id}", method="PATCH", body={
            "status": "error",
            "status_message": f"Erro de comunicação local: {str(e)}"
        })

def run_worker_loop():
    """Loop principal de monitoramento de novos pedidos pendentes no Supabase."""
    logger.info(f"Monitor de pedidos ativo! Buscando novos pedidos no mural a cada {LOOP_INTERVAL_SECONDS} segundos...")
    logger.info("Use Ctrl+C para encerrar o script.")
    
    while True:
        try:
            # Buscar pedidos pendentes (ordenados pelo mais antigo criado primeiro)
            status, requests_list = supabase_request("music_requests?status=eq.pending&order=created_at.asc")
            if status == 200 and isinstance(requests_list, list) and len(requests_list) > 0:
                logger.info(f"Detectado(s) {len(requests_list)} pedido(s) pendente(s) no mural.")
                for req in requests_list:
                    process_single_request(req)
            elif status != 200:
                logger.error(f"Falha ao checar pedidos no Supabase: Status {status}")
            
            # Limpar locuções antigas da playlist e do SSD
            cleanup_played_locutions()
        except KeyboardInterrupt:
            logger.info("Encerrando monitor de pedidos...")
            break
        except Exception as e:
            logger.error(f"Erro inesperado no loop do worker: {str(e)}")
        
        time.sleep(LOOP_INTERVAL_SECONDS)

# ---------------------------------------------------------
# PONTO DE ENTRADA PRINCIPAL
# ---------------------------------------------------------

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Script de integração Supabase -> RadioBOSS e varredura de músicas no SSD.")
    parser.add_argument('--scan', action='store_true', help="Executa a varredura completa das pastas do SSD, atualiza o catálogo de músicas no Supabase e finaliza.")
    args = parser.parse_args()

    if args.scan:
        scan_ssd_and_sync()
    else:
        # Se estiver rodando o worker comum, vamos garantir uma varredura inicial curta se o catálogo estiver vazio
        try:
            status, count_resp = supabase_request("music_catalog?select=id&limit=1")
            if status == 200 and len(count_resp) == 0:
                logger.info("Catálogo do Supabase parece vazio. Iniciando varredura rápida antes de rodar o monitor...")
                scan_ssd_and_sync()
        except Exception:
            pass
        
        run_worker_loop()
