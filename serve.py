#!/usr/bin/env python3
"""
Servidor estático de desenvolvimento para o site da Clover.
Envia cabeçalhos no-cache para o navegador SEMPRE buscar a versão mais recente
dos arquivos (evita o problema de páginas antigas ficarem em cache).

Uso:  python serve.py
"""
import http.server
import socketserver

PORT = 8123


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Clover dev server em http://localhost:{PORT} (no-cache)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            httpd.shutdown()
