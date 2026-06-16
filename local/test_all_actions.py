import os
import sys
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

def test_action(action, params=None):
    if params is None:
        params = {}
    if RADIOBOSS_PASSWORD:
        params['pass'] = RADIOBOSS_PASSWORD
    
    # Testar formato REST
    url_rest = f"{RADIOBOSS_API_URL}/api/{action}"
    query = urllib.parse.urlencode(params)
    target_rest = f"{url_rest}?{query}"
    
    # Testar formato Fallback
    params_fallback = params.copy()
    params_fallback['action'] = action
    query_fallback = urllib.parse.urlencode(params_fallback)
    target_fallback = f"{RADIOBOSS_API_URL}/?{query_fallback}"
    
    results = {}
    
    # 1. REST
    try:
        req = urllib.request.Request(target_rest, method='GET')
        with urllib.request.urlopen(req, timeout=3) as response:
            results['REST'] = {
                'status': response.status,
                'data': response.read().decode('utf-8', errors='ignore')[:300]
            }
    except Exception as e:
        results['REST'] = {'error': str(e)}
        
    # 2. Fallback
    try:
        req = urllib.request.Request(target_fallback, method='GET')
        with urllib.request.urlopen(req, timeout=3) as response:
            results['Fallback'] = {
                'status': response.status,
                'data': response.read().decode('utf-8', errors='ignore')[:300]
            }
    except Exception as e:
        results['Fallback'] = {'error': str(e)}
        
    return results

def run():
    actions = ["playbackinfo", "getplaylist", "getplaylist2", "status", "getsong", "trackinfo"]
    report = []
    report.append("=== TESTANDO VÁRIAS AÇÕES DA API DO RADIOBOSS ===")
    report.append(f"URL: {RADIOBOSS_API_URL}")
    report.append("")
    
    for action in actions:
        report.append(f"--- Ação: {action} ---")
        results = test_action(action)
        for mode, res in results.items():
            if 'error' in res:
                report.append(f"  [{mode}] Erro: {res['error']}")
            else:
                report.append(f"  [{mode}] Status: {res['status']}")
                report.append(f"  [{mode}] Dados: {res['data'].strip()}")
        report.append("")
        
    report_content = "\n".join(report)
    out_path = os.path.join(os.path.dirname(__file__), "api_test_results.txt")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print("==================================================")
    print("Teste concluído com sucesso!")
    print(f"O resultado foi salvo em: {out_path}")
    print("==================================================")
    print(report_content)

if __name__ == '__main__':
    run()
