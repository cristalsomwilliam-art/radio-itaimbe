import os
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import re

# Carregar env
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

env = load_env()
RADIOBOSS_API_URL = env.get("RADIOBOSS_API_URL", "http://127.0.0.1:9000").rstrip('/')
RADIOBOSS_PASSWORD = env.get("RADIOBOSS_PASSWORD", "")

def radioboss_request(action, params=None):
    if params is None:
        params = {}
    if RADIOBOSS_PASSWORD:
        params['pass'] = RADIOBOSS_PASSWORD
    
    url = f"{RADIOBOSS_API_URL}/api/{action}"
    query = urllib.parse.urlencode(params)
    target = f"{url}?{query}"
    
    try:
        req = urllib.request.Request(target, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read()
    except Exception as e_rest:
        # Fallback query
        params_fallback = params.copy()
        params_fallback['action'] = action
        query_fallback = urllib.parse.urlencode(params_fallback)
        target_fallback = f"{RADIOBOSS_API_URL}/?{query_fallback}"
        req = urllib.request.Request(target_fallback, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.read()

def run_diagnostics():
    report = []
    report.append("=== DIAGNÓSTICO DO INTEGRADOR RADIOBOSS ===")
    report.append(f"URL da API: {RADIOBOSS_API_URL}")
    report.append(f"Senha configurada: {'Sim' if RADIOBOSS_PASSWORD else 'Não'}")
    report.append("")

    # 1. Testar playbackinfo
    try:
        xml_pb = radioboss_request("playbackinfo")
        report.append("--- TESTE PLAYBACKINFO ---")
        report.append("Sucesso ao conectar!")
        pb_str = xml_pb.decode('utf-8', errors='ignore')
        report.append("Retorno XML (primeiros 1000 caracteres):")
        report.append(pb_str[:1000])
        report.append("")
        
        # Analisar estrutura
        root = ET.fromstring(xml_pb)
        playback = root.find('Playback')
        if playback is not None:
            report.append("Tag <Playback> encontrada!")
            report.append(f"Atributos da tag <Playback>: {playback.attrib}")
            state = (playback.attrib.get('state') or playback.attrib.get('STATE') or '').lower()
            playlistpos = playback.attrib.get('playlistpos') or playback.attrib.get('PLAYLISTPOS')
            report.append(f"state: {state} | playlistpos: {playlistpos}")
        else:
            report.append("Tag <Playback> NÃO encontrada no XML de playbackinfo.")
            # Listar tags filhas do root
            tags = [child.tag for child in root]
            report.append(f"Tags filhas do elemento raiz: {tags}")
    except Exception as e:
        report.append(f"Erro no teste de playbackinfo: {str(e)}")
    report.append("")

    # 2. Testar getplaylist2
    try:
        xml_pl = radioboss_request("getplaylist2")
        report.append("--- TESTE GETPLAYLIST2 ---")
        report.append("Sucesso ao conectar!")
        pl_str = xml_pl.decode('utf-8', errors='ignore')
        report.append("Retorno XML (primeiros 500 caracteres):")
        report.append(pl_str[:500])
        report.append("")
        
        root = ET.fromstring(xml_pl)
        tracks = root.findall('track')
        report.append(f"Total de faixas na playlist: {len(tracks)}")
        
        playing_tracks = []
        for i, track in enumerate(tracks, start=1):
            playing_val = track.attrib.get('playing') or track.attrib.get('PLAYING')
            if playing_val:
                playing_tracks.append((i, track.attrib.get('filename'), playing_val))
            
            # Printar detalhes das primeiras 3 faixas
            if i <= 3:
                report.append(f"Faixa #{i} atributos: {track.attrib}")
                
        report.append(f"Faixas com atributo 'playing' ativo: {playing_tracks}")
    except Exception as e:
        report.append(f"Erro no teste de getplaylist2: {str(e)}")
    report.append("")

    # Salvar relatório
    report_content = "\n".join(report)
    out_path = os.path.join(os.path.dirname(__file__), "diagnose_result.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    
    print("==================================================")
    print("Diagnóstico concluído com sucesso!")
    print(f"O resultado foi salvo em: {out_path}")
    print("==================================================")
    print(report_content)

if __name__ == '__main__':
    run_diagnostics()
