from pathlib import Path
import zipfile,re,hashlib
from bs4 import BeautifulSoup
from urllib.parse import urlsplit,unquote
base=Path('/mnt/data/miseria_edicion_12nov')
original=Path('/mnt/data/MISERIA_REVISION_TRES_IDIOMAS_11NOV.zip')
full=Path('/mnt/data/MISERIA_WEB_AJUSTADA_3_IDIOMAS_11NOV.zip')
patch=Path('/mnt/data/MISERIA_SOLO_6_ARCHIVOS_MODIFICADOS_11NOV.zip')
changed=['index.html','index-fr.html','index-eng.html','css/miseria-multilingue.css','css/miseria-lector-y-portada.css','js/miseria-lector-y-portada.js']
readme='''MISERIA — Ajustes de la versión trilingüe (11 de noviembre de 2026)

Archivo principal: index.html (español)
Idiomas adicionales: index-fr.html / index-eng.html

CAMBIOS:
- La portada del inicio abre el libro 3D solo al pulsar o tocar, nunca al pasar el ratón.
- El libro de Alonso utiliza el mismo recurso gráfico 3D de la portada y el cierre.
- Retiradas las tres notas bajo los botones de Alonso (idioma del libro, instrucciones y PDF).
- Las dos cajas de vídeo y debate son ahora botones completos, sin el pie ni el texto superior de introducción.
- La sección de medios se limita a las tres cajas; sus títulos permanecen en español porque los destinos son páginas en español.
- Las cuatro tarjetas temáticas tienen títulos de una sola línea y texto secundario de dos líneas, alineado en todos los tamaños.
- Las obras aparecen con El zapato de la lengua rota en primer lugar y Valentina en segundo.
- Etiquetas femeninas: Autora (español), Autrice (francés); Author (inglés, neutro).

ARCHIVOS MODIFICADOS: index.html, index-fr.html, index-eng.html,
css/miseria-multilingue.css, css/miseria-lector-y-portada.css,
js/miseria-lector-y-portada.js

Para instalar solo cambios, respete la estructura de carpetas al descomprimir
el ZIP de actualización en la raíz del sitio. El ZIP completo contiene la web entera.
'''
(base/'LEEME_AJUSTES_TARJETAS_Y_LIBRO.txt').write_text(readme,encoding='utf-8')
with zipfile.ZipFile(original) as z:
    original_names=[n for n in z.namelist() if not n.endswith('/')]
    differences=[]
    for n in original_names:
        p=base/n
        assert p.is_file(),f'Falta archivo {n}'
        if z.read(n)!=p.read_bytes():differences.append(n)
    assert set(differences)==set(changed),(differences,changed)
    print('Archivos originales modificados:', differences)

for filename in ['index.html','index-fr.html','index-eng.html']:
    soup=BeautifulSoup((base/filename).read_text(encoding='utf-8'),'html.parser')
    assert len(soup.select('.media-card-button[data-media]'))==2
    assert len(soup.select('.press-card'))==3
    assert len(soup.select('.theme-card .desc-line'))==8
    assert soup.select_one('#open-reader-cover img')['src']=='assets/miseria-hero.png'
    assert not soup.select_one('#primera-pagina .translation-note')
    assert not soup.select_one('#primera-pagina .pdf-alternative')
    books=soup.select('.book-shelf .shelf-book')
    assert 'zapato' in books[0].get_text().lower() and 'Valentina' in books[1].get_text()
    for elt in soup.select('[src],[href]'):
        val=elt.get('src') or elt.get('href')
        if not val or val.startswith(('#','mailto:','tel:','javascript:','data:','//')):continue
        parsed=urlsplit(val)
        if parsed.scheme or not parsed.path or parsed.path in ('/','.') :continue
        loc=(base/unquote(parsed.path.lstrip('/')))
        assert loc.is_file(),f'{filename} -> {val}'
    print('HTML verificado:',filename)

for path,names in [(full,original_names+['LEEME_AJUSTES_TARJETAS_Y_LIBRO.txt']), (patch,changed+['LEEME_AJUSTES_TARJETAS_Y_LIBRO.txt'])]:
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for n in names: z.write(base/n,n)
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        print(path, len(z.namelist()),path.stat().st_size,'bytes OK')
