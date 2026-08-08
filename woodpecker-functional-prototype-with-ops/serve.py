#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import webbrowser

HOST = "127.0.0.1"
PORT = 4173
ROOT = Path(__file__).resolve().parent

os.chdir(ROOT)
url = f"http://{HOST}:{PORT}/#/overview"
print(f"Woodpecker CI + Ops functional prototype: {url}")
print("Press Ctrl+C to stop.")
try:
    webbrowser.open(url)
except Exception:
    pass
ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler).serve_forever()
