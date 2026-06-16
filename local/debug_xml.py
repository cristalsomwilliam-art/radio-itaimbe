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
    
    # Usar formato de query para compatibilidade
    params_fallback = params.copy()
    params_fallback['action'] = action
    query_fallback = urllib.parse.urlencode(params_fallback)
    target_url = f"{RADIOBOSS_API_URL}/?{query_fallback}"
    
    req = urllib.request.Request(target_url, method='GET')
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.read()

try:
    print("=== TESTE DE DIAGNÓSTICO XML ===")
    xml_data = radioboss_request("playbackinfo")
    print("1. XML bruto obtido:")
    raw_str = xml_data.decode('utf-8', errors='ignore').strip()
    print(raw_str)
    print("\n2. Tentando fazer parse do XML...")
    root = ET.fromstring(xml_data)
    print(f"Sucesso! Root tag: '{root.tag}'")
    
    print("\n3. Buscando tag 'Playback' (método find padrão):")
    pb = root.find('Playback')
    print("Encontrado:", pb is not None)
    
    print("\n4. Buscando tag './/Playback' (método find profundo):")
    pb_deep = root.find('.//Playback')
    print("Encontrado:", pb_deep is not None)
    if pb_deep is not None:
        print("Atributos de Playback:", pb_deep.attrib)
        
    print("\n5. Listando todas as tags filhas diretas do root:")
    for child in root:
        print(f" - Tag: '{child.tag}' | Atributos: {list(child.attrib.keys())}")
        for subchild in child:
            print(f"    * Subtag: '{subchild.tag}' | Atributos: {list(subchild.attrib.keys())}")

except Exception as e:
    print("\nOcorreu um erro no diagnóstico:", e)
