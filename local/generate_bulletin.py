#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import time
import json
import random
import urllib.request
from datetime import datetime

# Adiciona o diretório local ao path
sys.path.append(os.path.dirname(__file__))

ALL_SIGNS = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
]

HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'bulletin_history.json')

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao ler historico do boletim: {e}")
    return {
        "last_run_date": "",
        "next_bulletin_timestamp": 0,
        "spoken_signs_today": [],
        "spoken_news_today": []
    }

def save_history(history):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar historico do boletim: {e}")

def check_and_run_bulletin(force=False):
    """
    Verifica se está na janela de execução (10h às 22h) e se o intervalo de tempo já passou.
    Se sim, gera e insere o boletim no RadioBOSS.
    """
    # Importação local para evitar importação circular
    import request_worker
    
    logger = request_worker.logger
    
    now_dt = datetime.now()
    current_hour = now_dt.hour
    current_date_str = now_dt.strftime("%Y-%m-%d")
    now_ts = time.time()
    
    # Janela das 10h às 22h (inclusive)
    is_in_window = (10 <= current_hour <= 22)
    
    if not is_in_window and not force:
        logger.debug("Fora da janela de execução do boletim (10h às 22h). Ignorando.")
        return False
        
    history = load_history()
    
    # Se mudou o dia, reinicia o histórico
    if history.get("last_run_date") != current_date_str:
        logger.info(f"Novo dia detectado ({current_date_str}). Reiniciando histórico do boletim.")
        history["last_run_date"] = current_date_str
        history["spoken_signs_today"] = []
        history["spoken_news_today"] = []
        
        # O primeiro boletim do dia roda após um delay curto de 5 a 15 minutos para aleatoriedade
        if not force:
            history["next_bulletin_timestamp"] = now_ts + random.randint(5, 15) * 60
            save_history(history)
            logger.info(f"Primeiro boletim do dia agendado para as {datetime.fromtimestamp(history['next_bulletin_timestamp']).strftime('%H:%M:%S')}")
            return False
        else:
            history["next_bulletin_timestamp"] = now_ts
            
    # Verificar se já passou o tempo agendado
    next_ts = history.get("next_bulletin_timestamp", 0)
    if now_ts < next_ts and not force:
        return False
        
    logger.info("Iniciando rotina de geração do Boletim da Rádio...")
    
    # 1. SELEÇÃO DOS SIGNOS (Prioriza inéditos no dia)
    spoken_signs = history.get("spoken_signs_today", [])
    available_signs = [s for s in ALL_SIGNS if s not in spoken_signs]
    
    logger.info(f"Signos já lidos hoje: {spoken_signs}. Signos ainda inéditos: {available_signs}")
    
    selected_signs = []
    if len(available_signs) >= 3:
        selected_signs = random.sample(available_signs, 3)
    else:
        # Se houver menos de 3 inéditos, pegamos todos os que restaram
        selected_signs = list(available_signs)
        # Resetamos a lista de signos falados para o dia para poder repetir
        history["spoken_signs_today"] = []
        # Completamos os 3 signos sorteando dos demais
        needed = 3 - len(selected_signs)
        remaining_pool = [s for s in ALL_SIGNS if s not in selected_signs]
        selected_signs.extend(random.sample(remaining_pool, needed))
        
    # Registrar no histórico
    for s in selected_signs:
        if s not in history["spoken_signs_today"]:
            history["spoken_signs_today"].append(s)
            
    logger.info(f"Signos selecionados para este boletim: {selected_signs}")
    
    # 2. SELEÇÃO DAS NOTÍCIAS (Prioriza inéditas no dia)
    news_list = []
    try:
        base_api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        # Substitui a rota da API de locutor pela rota do news-feed
        feed_base_url = base_api_url.replace("/locutor-automatico", "/news-feed")
        
        for portal in ["estadao", "jovempan", "oeste"]:
            try:
                portal_url = f"{feed_base_url}?portal={portal}"
                logger.info(f"Buscando feed do portal {portal}: {portal_url}")
                req = urllib.request.Request(
                    portal_url,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, timeout=15) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    items = data.get("items", [])
                    for item in items:
                        item["portal"] = portal
                    news_list.extend(items)
            except Exception as e_p:
                logger.warning(f"Erro ao buscar feed do portal {portal}: {e_p}")
    except Exception as e_news:
        logger.error(f"Falha na comunicação para obter notícias do feed: {str(e_news)}")
        
    import hashlib
    def get_news_hash(title_str):
        if not title_str:
            return ""
        return hashlib.md5(title_str.encode('utf-8', errors='replace')).hexdigest()

    spoken_news = history.get("spoken_news_today", [])
    available_news = [n for n in news_list if get_news_hash(n.get("title", "")) not in spoken_news]
    
    logger.info(f"Total de notícias do site carregadas: {len(news_list)}. Notícias inéditas hoje: {len(available_news)}")
    
    selected_news = []
    if len(available_news) >= 2:
        selected_news = random.sample(available_news, 2)
    elif len(news_list) >= 2:
        # Se não houver inéditas suficientes, pega o que restou e completa resetando a lista
        selected_news = list(available_news)
        history["spoken_news_today"] = []
        needed = 2 - len(selected_news)
        remaining_pool = [n for n in news_list if get_news_hash(n.get("title", "")) not in [get_news_hash(sn.get("title", "")) for sn in selected_news]]
        selected_news.extend(random.sample(remaining_pool, needed))
    else:
        # Se houver menos de 2 notícias cadastradas no total, usamos fallbacks
        selected_news = list(news_list)
        if len(selected_news) < 2:
            logger.warning("Poucas notícias carregadas do feed. Inserindo fallbacks locais.")
            fallbacks = [
                {"title": "Programação de inverno especial na Rádio Itaimbé", "excerpt": "Fique ligado nos novos horários e programas musicais com o melhor do Sul."},
                {"title": "Turismo em alta em Cambará do Sul", "excerpt": "Canyons registram grande movimento de visitantes nesta temporada."}
            ]
            needed = 2 - len(selected_news)
            selected_news.extend(fallbacks[:needed])
            
    # Registrar no histórico
    for n in selected_news:
        nhash = get_news_hash(n.get("title", ""))
        if nhash and nhash not in history["spoken_news_today"]:
            history["spoken_news_today"].append(nhash)
            
    logger.info(f"Notícias selecionadas para este boletim: {[n.get('title') for n in selected_news]}")
    
    # 3. ALEATORIEDADE DE BLOCOS
    blocks = ["previsão do tempo", "horóscopo dos signos", "manchetes das notícias"]
    random.shuffle(blocks)
    logger.info(f"Ordem dos blocos sorteada: {blocks}")
    
    # 4. REQUISIÇÃO À API
    bulletin_text = None
    try:
        api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        payload = {
            "tipo": "boletim",
            "signos": selected_signs,
            "noticias": [
                {"title": n.get("title", ""), "excerpt": n.get("excerpt", "")} for n in selected_news
            ],
            "ordem_blocos": blocks
        }
        
        req_payload = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=req_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-API-Secret": request_worker.SUPABASE_KEY
            },
            method="POST"
        )
        
        logger.info(f"Solicitando geração de boletim à API: {api_url}")
        with urllib.request.urlopen(req, timeout=90) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
            
        bulletin_text = resp_data.get("texto")
        if not bulletin_text:
            logger.error(f"Formato inválido retornado pela API do boletim: {resp_data}")
            return False
            
    except Exception as e_api:
        logger.error(f"Erro ao obter boletim da API de automação: {str(e_api)}")
        return False
        
    # 5. GERAR O TTS E INJETAR NO RADIOBOSS
    if bulletin_text:
        logger.info("Texto do boletim gerado com sucesso pela IA:")
        logger.info(f"--- TEXTO DO BOLETIM ---\n{bulletin_text}\n------------------------")
        
        locucoes_dir = os.path.join(os.path.dirname(__file__), 'locucoes')
        os.makedirs(locucoes_dir, exist_ok=True)
        output_path = os.path.join(locucoes_dir, f"boletim_{int(now_ts)}.mp3")
        
        logger.info(f"Iniciando conversão do texto em áudio neural: {output_path}")
        if request_worker.speak_text(bulletin_text, output_path):
            try:
                current_idx = request_worker.get_current_playing_index()
                target_pos = 1 if current_idx == 0 else current_idx + 1
                
                logger.info(f"Injetando boletim no RadioBOSS. Posição alvo: {target_pos}")
                if request_worker.insert_song_in_radioboss(output_path, target_pos):
                    logger.info("[OK] Boletim inserido com sucesso na fila do RadioBOSS.")
            except Exception as e_rb:
                logger.error(f"Falha ao injetar boletim no RadioBOSS: {str(e_rb)}")
        else:
            logger.error("Falha ao gerar o arquivo de áudio via TTS.")
            
    # 6. CALCULAR E AGENDAR O PRÓXIMO BOLETIM
    min_int = int(os.getenv("BULLETIN_MIN_INTERVAL_MINUTES", "90"))
    max_int = int(os.getenv("BULLETIN_MAX_INTERVAL_MINUTES", "150"))
    delay_minutes = random.randint(min_int, max_int)
    
    history["next_bulletin_timestamp"] = now_ts + delay_minutes * 60
    save_history(history)
    
    next_time_str = datetime.fromtimestamp(history["next_bulletin_timestamp"]).strftime('%H:%M:%S')
    logger.info(f"Próximo boletim agendado de forma aleatória para as {next_time_str} (daqui a {delay_minutes} minutos).")
    return True

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Boletim Automático Radio Itaimbé")
    parser.add_argument('--force', action='store_true', help="Força a execução imediata do boletim ignorando agendamentos.")
    args = parser.parse_args()
    
    # Carrega o ambiente manual para testes em console standalone
    from request_worker import load_env
    load_env()
    
    check_and_run_bulletin(force=args.force)
