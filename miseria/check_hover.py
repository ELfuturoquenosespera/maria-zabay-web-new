exec(open('/mnt/data/miseria_edicion_12nov/check_inline.py',encoding='utf8').read().split('with sync_playwright() as p:')[0])
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900})
 page.set_content(build('index.html'))
 for js in ['js/miseria-i18n.js','js/miseria-redisenyo.js','js/miseria-lector-y-portada.js']:
  page.add_script_tag(content=(base/js).read_text())
 hero=page.locator('#hero-book-interactive')
 hero.hover(force=True);page.wait_for_timeout(550)
 assert not page.locator('#reader-dialog').evaluate('(d)=>d.open'), 'Hover should not open reader'
 hero.click()
 assert page.locator('#reader-dialog').evaluate('(d)=>d.open'), 'Click should open reader'
 assert 'MUERTE' in page.locator('#reader-page-count').inner_text()
 print('Hero hover no-op, click reader OK, starts MUERTE')
 page.locator('#close-reader').click()
 page.locator('#open-reader-cover').scroll_into_view_if_needed()
 page.screenshot(path=str(base/'vista_alonso_3d.png'))
 page.locator('#audio').scroll_into_view_if_needed()
 page.screenshot(path=str(base/'vista_audio_1440.png'))
 b.close()
