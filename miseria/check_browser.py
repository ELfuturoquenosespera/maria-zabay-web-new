from playwright.sync_api import sync_playwright
from pathlib import Path
base=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files'])
    for lang in ['index.html','index-fr.html','index-eng.html']:
        for width in [1440,390,320]:
            page=browser.new_page(viewport={'width':width,'height':800},device_scale_factor=1)
            errs=[]
            page.on('pageerror',lambda e:errs.append(str(e)))
            page.goto((base/lang).as_uri(),wait_until='domcontentloaded',timeout=15000)
            page.wait_for_timeout(450)
            page.locator('#audio').scroll_into_view_if_needed()
            page.wait_for_timeout(150)
            if lang=='index.html':page.screenshot(path=str(base/f'comprobacion_audio_{width}.png'))
            cards=page.locator('.media-card-button')
            assert cards.count()==2, (lang,width,'cards',cards.count())
            cards.nth(1).click()
            assert page.locator('#mediaDialog').evaluate('(d)=>d.open'),(lang,width,'media dialog')
            assert not page.locator('#mediaAudio').is_hidden(), (lang,width,'audio invisible')
            page.locator('#mediaDialog [data-close]').click()
            page.locator('#open-reader-cover').scroll_into_view_if_needed()
            page.locator('#open-reader-cover').click()
            assert page.locator('#reader-dialog').evaluate('(d)=>d.open'),(lang,width,'reader dialog')
            page.wait_for_timeout(1000)
            page.locator('#close-reader').click()
            themes=page.locator('.theme-card')
            assert themes.count()==4
            print(lang,width,'errors:',errs[:2], 'scrollWidth:',page.evaluate('document.documentElement.scrollWidth'))
            if lang=='index.html' and width==1440:page.screenshot(path=str(base/'comprobacion_lector_1440.png'))
            page.close()
    browser.close()
