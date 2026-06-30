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
        "next_weather_timestamp": 0,
        "next_horoscope_timestamp": 0,
        "next_news_timestamp": 0,
        "spoken_signs_today": [],
        "spoken_news_today": []
    }

def save_history(history):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar historico do boletim: {e}")

def check_and_run_weather(force=False):
    """
    Verifica e executa o boletim de PREVISÃO DO TEMPO.
    """
    import request_worker
    logger = request_worker.logger
    now_dt = datetime.now()
    current_hour = now_dt.hour
    current_date_str = now_dt.strftime("%Y-%m-%d")
    now_ts = time.time()

    if not (10 <= current_hour <= 22) and not force:
        logger.debug("[Tempo] Fora da janela de execução (10h às 22h).")
        return False

    history = load_history()
    
    # Se mudou o dia, inicializa os agendamentos de forma aleatória e espalhada
    if history.get("last_run_date") != current_date_str:
        logger.info(f"Novo dia detectado ({current_date_str}). Agendando primeiros boletins.")
        history["last_run_date"] = current_date_str
        history["spoken_signs_today"] = []
        history["spoken_news_today"] = []
        
        # Espalha os horários do primeiro boletim do dia para não tocarem juntos
        history["next_weather_timestamp"] = now_ts + random.randint(5, 20) * 60
        history["next_horoscope_timestamp"] = now_ts + random.randint(20, 50) * 60
        history["next_news_timestamp"] = now_ts + random.randint(40, 80) * 60
        save_history(history)
        
        logger.info(f"[Tempo] Primeiro agendado para: {datetime.fromtimestamp(history['next_weather_timestamp']).strftime('%H:%M:%S')}")
        logger.info(f"[Signos] Primeiro agendado para: {datetime.fromtimestamp(history['next_horoscope_timestamp']).strftime('%H:%M:%S')}")
        logger.info(f"[Notícias] Primeiro agendado para: {datetime.fromtimestamp(history['next_news_timestamp']).strftime('%H:%M:%S')}")
        return False

    next_ts = history.get("next_weather_timestamp", 0)
    if now_ts < next_ts and not force:
        return False

    logger.info("[Tempo] Iniciando geração da Previsão do Tempo...")
    
    bulletin_text = None
    try:
        api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        payload = { "tipo": "previsao" }
        req_payload = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=req_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "X-API-Secret": request_worker.SUPABASE_KEY
            },
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=90) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
        bulletin_text = resp_data.get("texto")
    except Exception as e:
        logger.error(f"[Tempo] Erro ao obter previsão da API: {str(e)}")
        return False

    if bulletin_text:
        logger.info(f"[Tempo] Texto gerado:\n{bulletin_text}")
        locucoes_dir = os.path.join(os.path.dirname(__file__), 'locucoes')
        os.makedirs(locucoes_dir, exist_ok=True)
        output_path = os.path.join(locucoes_dir, f"tempo_{int(now_ts)}.mp3")
        
        logger.info(f"[Tempo] Convertendo texto em áudio: {output_path}")
        if request_worker.speak_text(bulletin_text, output_path):
            try:
                current_idx = request_worker.get_current_playing_index()
                target_pos = 1 if current_idx == 0 else current_idx + 1
                logger.info(f"[Tempo] Injetando no RadioBOSS na posição: {target_pos}")
                request_worker.insert_song_in_radioboss(output_path, target_pos)
            except Exception as e_rb:
                logger.error(f"[Tempo] Erro ao injetar no RadioBOSS: {e_rb}")
        else:
            logger.error("[Tempo] Erro na sintetização de áudio.")

    # Agendar próxima execução
    min_int = int(os.getenv("WEATHER_MIN_INTERVAL_MINUTES", "60"))
    max_int = int(os.getenv("WEATHER_MAX_INTERVAL_MINUTES", "120"))
    delay = random.randint(min_int, max_int)
    history["next_weather_timestamp"] = now_ts + delay * 60
    save_history(history)
    logger.info(f"[Tempo] Próxima previsão agendada para {datetime.fromtimestamp(history['next_weather_timestamp']).strftime('%H:%M:%S')} (daqui a {delay} minutos).")
    return True

def check_and_run_horoscope(force=False):
    """
    Verifica e executa o boletim de HORÓSCOPO (3 signos).
    """
    import request_worker
    logger = request_worker.logger
    now_dt = datetime.now()
    current_hour = now_dt.hour
    current_date_str = now_dt.strftime("%Y-%m-%d")
    now_ts = time.time()

    if not (10 <= current_hour <= 22) and not force:
        logger.debug("[Signos] Fora da janela de execução (10h às 22h).")
        return False

    history = load_history()

    # Deixar que a rotina de tempo inicialize o dia primeiro se necessário
    if history.get("last_run_date") != current_date_str:
        return False

    next_ts = history.get("next_horoscope_timestamp", 0)
    if now_ts < next_ts and not force:
        return False

    logger.info("[Signos] Iniciando geração do Horóscopo (3 signos)...")

    # Seleção de signos (priorizando inéditos no dia)
    spoken_signs = history.get("spoken_signs_today", [])
    available_signs = [s for s in ALL_SIGNS if s not in spoken_signs]
    
    selected_signs = []
    if len(available_signs) >= 3:
        selected_signs = random.sample(available_signs, 3)
    else:
        selected_signs = list(available_signs)
        history["spoken_signs_today"] = []  # Reseta para permitir repetição
        needed = 3 - len(selected_signs)
        remaining_pool = [s for s in ALL_SIGNS if s not in selected_signs]
        selected_signs.extend(random.sample(remaining_pool, needed))
        
    for s in selected_signs:
        if s not in history["spoken_signs_today"]:
            history["spoken_signs_today"].append(s)

    logger.info(f"[Signos] Selecionados: {selected_signs}")

    bulletin_text = None
    try:
        api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        payload = {
            "tipo": "boletim_signos",
            "signos": selected_signs
        }
        req_payload = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=req_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "X-API-Secret": request_worker.SUPABASE_KEY
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=90) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
        bulletin_text = resp_data.get("texto")
    except Exception as e:
        logger.error(f"[Signos] Erro ao obter horóscopo da API: {str(e)}")
        return False

    if bulletin_text:
        logger.info(f"[Signos] Texto gerado:\n{bulletin_text}")
        locucoes_dir = os.path.join(os.path.dirname(__file__), 'locucoes')
        os.makedirs(locucoes_dir, exist_ok=True)
        output_path = os.path.join(locucoes_dir, f"signos_{int(now_ts)}.mp3")
        
        logger.info(f"[Signos] Convertendo texto em áudio: {output_path}")
        if request_worker.speak_text(bulletin_text, output_path):
            try:
                current_idx = request_worker.get_current_playing_index()
                target_pos = 1 if current_idx == 0 else current_idx + 1
                logger.info(f"[Signos] Injetando no RadioBOSS na posição: {target_pos}")
                request_worker.insert_song_in_radioboss(output_path, target_pos)
            except Exception as e_rb:
                logger.error(f"[Signos] Erro ao injetar no RadioBOSS: {e_rb}")
        else:
            logger.error("[Signos] Erro na sintetização de áudio.")

    # Agendar próxima execução
    min_int = int(os.getenv("HOROSCOPE_MIN_INTERVAL_MINUTES", "90"))
    max_int = int(os.getenv("HOROSCOPE_MAX_INTERVAL_MINUTES", "180"))
    delay = random.randint(min_int, max_int)
    history["next_horoscope_timestamp"] = now_ts + delay * 60
    save_history(history)
    logger.info(f"[Signos] Próximo horóscopo agendado para {datetime.fromtimestamp(history['next_horoscope_timestamp']).strftime('%H:%M:%S')} (daqui a {delay} minutos).")
    return True

def check_and_run_news(force=False):
    """
    Verifica e executa o boletim de NOTÍCIAS (2 manchetes do site).
    """
    import request_worker
    logger = request_worker.logger
    now_dt = datetime.now()
    current_hour = now_dt.hour
    current_date_str = now_dt.strftime("%Y-%m-%d")
    now_ts = time.time()

    if not (10 <= current_hour <= 22) and not force:
        logger.debug("[Notícias] Fora da janela de execução (10h às 22h).")
        return False

    history = load_history()

    # Deixar que a rotina de tempo inicialize o dia primeiro se necessário
    if history.get("last_run_date") != current_date_str:
        return False

    next_ts = history.get("next_news_timestamp", 0)
    if now_ts < next_ts and not force:
        return False

    logger.info("[Notícias] Iniciando geração do Boletim de Notícias...")

    # Buscar feeds do site
    news_list = []
    try:
        base_api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        feed_base_url = base_api_url.replace("/locutor-automatico", "/news-feed")
        
        for portal in ["estadao", "jovempan", "oeste"]:
            try:
                portal_url = f"{feed_base_url}?portal={portal}"
                req = urllib.request.Request(
                    portal_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                )
                with urllib.request.urlopen(req, timeout=15) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    items = data.get("items", [])
                    for item in items:
                        item["portal"] = portal
                    news_list.extend(items)
            except Exception as e_p:
                logger.warning(f"[Notícias] Erro ao buscar feed {portal}: {e_p}")
    except Exception as e_news:
        logger.error(f"[Notícias] Falha geral ao obter notícias: {e_news}")
        
    import hashlib
    def get_news_hash(title_str):
        if not title_str:
            return ""
        return hashlib.md5(title_str.encode('utf-8', errors='replace')).hexdigest()

    spoken_news = history.get("spoken_news_today", [])
    available_news = [n for n in news_list if get_news_hash(n.get("title", "")) not in spoken_news]
    
    logger.info(f"[Notícias] Total de notícias carregadas: {len(news_list)}. Notícias inéditas hoje: {len(available_news)}")

    selected_news = []
    if len(available_news) >= 2:
        selected_news = random.sample(available_news, 2)
    elif len(news_list) >= 2:
        selected_news = list(available_news)
        history["spoken_news_today"] = []  # Reseta para permitir repetição
        needed = 2 - len(selected_news)
        remaining_pool = [n for n in news_list if get_news_hash(n.get("title", "")) not in [get_news_hash(sn.get("title", "")) for sn in selected_news]]
        selected_news.extend(random.sample(remaining_pool, needed))
    else:
        selected_news = list(news_list)
        if len(selected_news) < 2:
            logger.warning("[Notícias] Poucas notícias nos feeds. Inserindo fallbacks locais.")
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

    logger.info(f"[Notícias] Selecionadas: {[n.get('title') for n in selected_news]}")

    bulletin_text = None
    try:
        api_url = os.getenv("LOCUTOR_API_URL", "https://www.radioitaimbe.com.br/api/locutor-automatico")
        payload = {
            "tipo": "boletim_noticias",
            "noticias": [
                {"title": n.get("title", ""), "excerpt": n.get("excerpt", "")} for n in selected_news
            ]
        }
        req_payload = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            api_url,
            data=req_payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "X-API-Secret": request_worker.SUPABASE_KEY
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=90) as response:
            resp_data = json.loads(response.read().decode('utf-8'))
        bulletin_text = resp_data.get("texto")
    except Exception as e:
        logger.error(f"[Notícias] Erro ao obter notícias da API: {str(e)}")
        return False

    if bulletin_text:
        logger.info(f"[Notícias] Texto gerado:\n{bulletin_text}")
        locucoes_dir = os.path.join(os.path.dirname(__file__), 'locucoes')
        os.makedirs(locucoes_dir, exist_ok=True)
        output_path = os.path.join(locucoes_dir, f"noticias_{int(now_ts)}.mp3")
        
        logger.info(f"[Notícias] Convertendo texto em áudio: {output_path}")
        if request_worker.speak_text(bulletin_text, output_path):
            try:
                current_idx = request_worker.get_current_playing_index()
                target_pos = 1 if current_idx == 0 else current_idx + 1
                logger.info(f"[Notícias] Injetando no RadioBOSS na posição: {target_pos}")
                request_worker.insert_song_in_radioboss(output_path, target_pos)
            except Exception as e_rb:
                logger.error(f"[Notícias] Erro ao injetar no RadioBOSS: {e_rb}")
        else:
            logger.error("[Notícias] Erro na sintetização de áudio.")

    # Agendar próxima execução
    min_int = int(os.getenv("NEWS_MIN_INTERVAL_MINUTES", "75"))
    max_int = int(os.getenv("NEWS_MAX_INTERVAL_MINUTES", "150"))
    delay = random.randint(min_int, max_int)
    history["next_news_timestamp"] = now_ts + delay * 60
    save_history(history)
    logger.info(f"[Notícias] Próximo boletim de notícias agendado para {datetime.fromtimestamp(history['next_news_timestamp']).strftime('%H:%M:%S')} (daqui a {delay} minutos).")
    return True

def check_and_run_bulletin():
    """
    Coordena as execuções independentes de cada boletim (chamada contínua no loop).
    """
    check_and_run_weather()
    check_and_run_horoscope()
    check_and_run_news()

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Boletins Automáticos Independentes Radio Itaimbé")
    parser.add_argument('--force', action='store_true', help="Força a execução imediata.")
    parser.add_argument('--type', choices=['tempo', 'signos', 'noticias', 'todos'], default='todos',
                        help="Tipo de boletim para executar/forçar (tempo, signos, noticias ou todos).")
    args = parser.parse_args()
    
    # Carrega configurações locais
    from request_worker import load_env
    load_env()
    
    if args.type == 'tempo':
        check_and_run_weather(force=args.force)
    elif args.type == 'signos':
        check_and_run_horoscope(force=args.force)
    elif args.type == 'noticias':
        check_and_run_news(force=args.force)
    else:
        # Se for todos, roda cada um deles individualmente
        check_and_run_weather(force=args.force)
        check_and_run_horoscope(force=args.force)
        check_and_run_news(force=args.force)
