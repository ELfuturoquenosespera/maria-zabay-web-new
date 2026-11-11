from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import os
os.chdir('/mnt/data/miseria_edicion_12nov')
server=ThreadingHTTPServer(('127.0.0.1',8765),SimpleHTTPRequestHandler)
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page()
 try:
  page.goto('http://127.0.0.1:8765/index.html',timeout=10000)
  print('SUCCESS',page.title())
 except Exception as e:
  print('FAILED',str(e)[:300])
 b.close()
server.shutdown()
