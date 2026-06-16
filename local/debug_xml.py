import os
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse

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
    
    params_fallback = params.copy()
    params_fallback['action'] = action
    query_fallback = urllib.parse.urlencode(params_fallback)
    target_url = f"{RADIOBOSS_API_URL}/?{query_fallback}"
    
    req = urllib.request.Request(target_url, method='GET')
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.read()

def debug_action(action):
    try:
        print(f"\n=== TESTANDO AÇÃO: {action} ===")
        xml_data = radioboss_request(action)
        raw_str = xml_data.decode('utf-8', errors='ignore').strip()
        print(f"XML bruto ({len(raw_str)} caracteres):")
        print(raw_str[:800])
        if len(raw_str) > 800:
            print("... [TRUNCADO]")
            
        root = ET.fromstring(xml_data)
        print(f"Parse OK! Root tag: '{root.tag}'")
        
        # Testar buscas comuns
        tracks_standard = root.findall('track')
        tracks_standard_upper = root.findall('TRACK')
        tracks_deep = root.findall('.//track')
        tracks_deep_upper = root.findall('.//TRACK')
        tracks_deep_camel = root.findall('.//Track')
        
        print(f"Buscas direct child:")
        print(f" - 'track': {len(tracks_standard)}")
        print(f" - 'TRACK': {len(tracks_standard_upper)}")
        print(f"Buscas profundas (deep/any depth):")
        print(f" - './/track': {len(tracks_deep)}")
        print(f" - './/TRACK': {len(tracks_deep_upper)}")
        print(f" - './/Track': {len(tracks_deep_camel)}")
        
        # Listar as primeiras tags filhas
        children = list(root)
        print(f"Total de filhos diretos do root: {len(children)}")
        for i, child in enumerate(children[:5]):
            print(f"  * Filho #{i+1}: Tag='{child.tag}' | Atributos={list(child.attrib.keys())}")
            
    except Exception as e:
        print(f"Erro na ação {action}: {e}")

try:
    print("=== INICIANDO DIAGNÓSTICO COMPLETO DE APIs ===")
    debug_action("playbackinfo")
    debug_action("getplaylist2")
    debug_action("getplaylist")
except Exception as e:
    print("Erro geral:", e)
