from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
from base64 import b64encode
import mimetypes
base=Path(__file__).resolve().parent

def build(name):
 s=BeautifulSoup((base/name).read_text(),'html.parser')
 for link in list(s.select('link[rel="stylesheet"][href]')):
  href=link['href'];path=base/href
  if path.exists():
   st=s.new_tag('style');st.string=path.read_text();link.replace_with(st)
 for tag in s.select('script[src]'):tag.decompose()
 for img in s.select('img[src]'):
  src=img['src'];fp=base/src
  if fp.exists() and (src in ['assets/maria-zabay-escaleras.jpg','assets/miseria-hero.png','assets/front.jpg']):
   mime=mimetypes.guess_type(fp.name)[0]
   img['src']='data:'+mime+';base64,'+b64encode(fp.read_bytes()).decode()
 return str(s)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for lang in ['index.html','index-fr.html','index-eng.html']:
  for width in [1440,390,320]:
   page=b.new_page(viewport={'width':width,'height':800},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(build(lang),wait_until='domcontentloaded')
   for js in ['js/miseria-i18n.js','js/miseria-redisenyo.js','js/miseria-lector-y-portada.js']:
    page.add_script_tag(content=(base/js).read_text())
   page.wait_for_timeout(150)
   labels=page.locator('.theme-card h3').evaluate_all('els=>els.map(el=>({name:el.textContent, h:el.getBoundingClientRect().height, font:parseFloat(getComputedStyle(el).fontSize),line:parseFloat(getComputedStyle(el).lineHeight), scroll:el.scrollWidth,client:el.clientWidth}))')
   desc=page.locator('.theme-card .desc-line').evaluate_all('els=>els.map(el=>[el.textContent,el.scrollWidth,el.clientWidth,el.getBoundingClientRect().height])')
   media=page.locator('.media-card-button')
   assert media.count()==2
   media.nth(1).click()
   assert page.locator('#mediaDialog').evaluate('(el)=>el.open')
   page.locator('#mediaDialog [data-close]').click()
   page.locator('#open-reader-cover').click()
   assert page.locator('#reader-dialog').evaluate('(el)=>el.open')
   page.locator('#close-reader').click()
   assert not errors,errors
   for l in labels:
    assert l['h']<l['line']*1.6,(lang,width,l)
   if lang=='index.html':
    page.locator('.theme-grid').scroll_into_view_if_needed()
    page.screenshot(path=str(base/f'vista_tarjetas_{width}.png'))
   print(lang,width,'all pass','theme headings:',[l['name'] for l in labels],'overflow:', [(x[0],x[1]-x[2]) for x in desc if x[1]>x[2]+1], 'doc width:',page.evaluate('document.documentElement.scrollWidth'))
   page.close()
 b.close()
