import http.server
import urllib.request
import socketserver
import sys

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Desativar logs excessivos de requisições de áudio no console
        return

    def do_GET(self):
        # Ignorar favicon
        if self.path == '/favicon.ico':
            self.send_response(404)
            self.end_headers()
            return

        url = "http://morcast.caster.fm:15366/BZRqL"
        
        # Criar requisição com os cabeçalhos que enganam o anti-hotlinking do Caster.fm
        req = urllib.request.Request(url)
        req.add_header('Referer', 'http://morcast.caster.fm/')
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        try:
            # Conectar ao Caster.fm
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(200)
                
                # Copiar cabeçalhos importantes de áudio e streaming
                for header, value in response.getheaders():
                    h_lower = header.lower()
                    if h_lower in ['content-type', 'server', 'ice-audio-info', 'icy-br', 'icy-description', 'icy-genre', 'icy-name', 'icy-pub', 'icy-url', 'cache-control']:
                        self.send_header(header, value)
                
                # Cabeçalho para permitir requisições cross-origin no player do site
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # Transmitir os blocos de áudio de forma contínua para o cliente
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    
        except Exception as e:
            try:
                self.send_response(500)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Erro no Proxy: {str(e)}".encode('utf-8'))
            except Exception:
                pass

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    # Permite reutilizar a porta imediatamente ao reiniciar
    allow_reuse_address = True

if __name__ == '__main__':
    port = 8000
    server = ThreadingHTTPServer(('0.0.0.0', port), ProxyHandler)
    print(f"[OK] Proxy do Stream HTTP -> HTTPS iniciado localmente na porta {port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Desligando o servidor proxy...")
        server.server_close()
        sys.exit(0)
