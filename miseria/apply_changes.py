from pathlib import Path
from bs4 import BeautifulSoup
import re

root=Path(__file__).resolve().parent
languages={
 'index.html':{
   'audio_label':'Audio y vídeo de Miseria','media_aria':['Reproducir el vídeo: ¿De qué va Miseria?','Reproducir el audio: Debate sobre Miseria'],
   'press_label':'Miseria en los medios', 'numbers':['1 DE 4','2 DE 4','3 DE 4','4 DE 4'],
   'two_lines':[
      ('Quien manda también','puede acabar preso'),
      ('Un apellido abre','y cierra puertas'),
      ('El deseo puede','acabar dominando'),
      ('Sobrevivir exige','mirarse de frente')],
   'title':'Haz clic para abrir el libro y escuchar la narración',
 },
 'index-fr.html':{
   'audio_label':'Audio et vidéo de Miseria','media_aria':['Lancer la vidéo : De quoi parle Miseria ?','Écouter le débat sur Miseria'],
   'press_label':'Miseria dans les médias', 'numbers':['1 SUR 4','2 SUR 4','3 SUR 4','4 SUR 4'],
   'two_lines':[
      ('Le pouvoir peut','aussi emprisonner'),
      ('Un nom qui ouvre','et ferme des portes'),
      ('Le désir peut','devenir domination'),
      ('Survivre exige','de se regarder en face')],
   'title':'Cliquez pour ouvrir le livre et écouter la lecture',
 },
 'index-eng.html':{
   'audio_label':'Miseria audio and video','media_aria':['Play the video: What is Miseria about?','Play the Miseria discussion'],
   'press_label':'Miseria in the media', 'numbers':['1 OF 4','2 OF 4','3 OF 4','4 OF 4'],
   'two_lines':[
      ('Power can trap','those who hold it'),
      ('A name that opens','and shuts doors'),
      ('Desire can become','another kind of power'),
      ('Survival demands','an honest reflection')],
   'title':'Click to open the book and listen to the narration',
 },
}

def change_section(html,id,editor):
    rex=rf'<section class="section shell" id="{re.escape(id)}">.*?</section>'
    mat=re.search(rex,html,re.S)
    if not mat: raise AssertionError(f'section not found: {id}')
    soup=BeautifulSoup(mat.group(0),'html.parser')
    editor(soup,soup.section)
    return html[:mat.start()]+str(soup.section)+html[mat.end():]

def edit_audio(soup,section,d):
    section['aria-label']=d['audio_label']
    section['class'].append('cards-only-section')
    grid=section.select_one('.media-grid')
    assert grid and len(grid.select('.media-card'))==2
    for child in list(section.children):
        if child is not grid and getattr(child,'name',None): child.decompose()
    for idx,card in enumerate(list(grid.select('.media-card'))):
        link=card.select_one('[data-media]')
        assert link and link['data-media'] in ['video','debate']
        new=soup.new_tag('button')
        new['type']='button'
        new['class']=['surface','media-card','media-card-button']
        new['data-media']=link['data-media']
        new['aria-label']=d['media_aria'][idx]
        main=card.find('div',recursive=False)
        assert main is not None
        new.append(main.extract())
        card.replace_with(new)

def edit_medios(soup,section,d):
    section['aria-label']=d['press_label']
    section['class'].append('cards-only-section')
    grid=section.select_one('.press-grid')
    assert grid and len(grid.select('.press-card'))==3
    for child in list(section.children):
        if child is not grid and getattr(child,'name',None):child.decompose()
    # Secciones de prensa enlazadas a materiales originales, en español, también desde FR/EN
    titles=['Prensa escrita','Radio y televisión','Blog y podcast']
    for idx,card in enumerate(grid.select('.press-card')):
        card.select_one('.eyebrow').string=f'{idx+1:02d} / MEDIOS'
        card.select_one('h3').string=titles[idx]

def edit_first_page(soup,section,d):
    cover=section.select_one('#open-reader-cover img')
    assert cover and cover['src']=='assets/front.jpg'
    # Igual imagen 3D que la cabecera y el bloque final, conservando el mismo visor interactivo
    cover['src']='assets/miseria-hero.png'
    cover['alt']='Miseria, libro en tres dimensiones' if d is languages['index.html'] else ('Miseria, livre en trois dimensions' if d is languages['index-fr.html'] else 'Miseria, three-dimensional book')
    for p in section.select('.translation-note, .pdf-alternative'):
        if p.name=='a':
            parent=p.parent
            if parent and parent.name=='p': parent.decompose()
        else:p.decompose()
    for p in section.select('p.muted'):
        if 'PDF' in p.get_text() or ('libro' in p.get_text() and 'páginas' in p.get_text()) or ('book' in p.get_text() and 'pages' in p.get_text()) or ('livre' in p.get_text() and 'pages' in p.get_text()):
            p.decompose()
    assert not section.select('.translation-note, .pdf-alternative')

def edit_sinopsis(soup,section,d):
    cards=section.select('.theme-card')
    assert len(cards)==4
    for i,card in enumerate(cards):
        card.select_one('.index').string=d['numbers'][i]
        p=card.select_one('p')
        p.clear()
        for j,line in enumerate(d['two_lines'][i]):
            sp=soup.new_tag('span',attrs={'class':'desc-line'})
            sp.string=line
            p.append(sp)

def edit_autora(soup,section,d):
    shelf=section.select_one('.book-shelf')
    books=shelf.find_all('div',class_='shelf-book',recursive=False)
    assert len(books)>=2 and books[0].get_text(strip=True)=='Valentina' and books[1].get_text(strip=True)=='El zapato de la lengua rota'
    books[1].extract()
    shelf.insert(0,books[1])

for fn,d in languages.items():
    file=root/fn
    html=file.read_text(encoding='utf-8')
    # Hero: se abre con clic, nunca al pasar el ratón.
    html, n = re.subn(r'(class="hero-book-interactive" id="hero-book-interactive" title=")[^"]*(")',lambda m:m.group(1)+d['title']+m.group(2), html)
    assert n==1,(fn,'hero title',n)
    for id,fnedit in [('sinopsis',edit_sinopsis),('primera-pagina',edit_first_page),('audio',edit_audio),('medios',edit_medios),('autora',edit_autora)]:
        html=change_section(html,id,lambda s,sec,fx=fnedit:fx(s,sec,d))
    file.write_text(html,encoding='utf-8')

# Elimina la apertura por hover (JS) y la inclinación hover de la cabecera (CSS).
js=root/'js/miseria-lector-y-portada.js'
s=js.read_text()
s,n=re.subn(r" const canHover=window\.matchMedia\('\(hover:hover\) and \(pointer:fine\)'\);.*? hero\?\.addEventListener\('click',\(\)=>\{clearTimeout\(heroTimer\);heroHoverBlocked=true;openReader\(7,true,hero\.querySelector\('\.hero-book'\)\);\}\);",
             " // Apertura controlada: solo clic o toque sobre la cubierta.\n hero?.addEventListener('click',()=>openReader(7,true,hero.querySelector('.hero-book')));",s,flags=re.S)
assert n==1,('hero javascript',n)
s,n=re.subn(r"dialog\.addEventListener\('close',\(\)=>\{heroHoverBlocked=true;setTimeout\(\(\)=>\{if\(!hero\?\.matches\(':hover'\)\)heroHoverBlocked=false\},90\);", "dialog.addEventListener('close',()=>{",s)
assert n==1,('close javascript',n)
js.write_text(s)

css=root/'css/miseria-lector-y-portada.css'
s=css.read_text()
s,n=re.subn(r'@media\(hover:hover\) and \(pointer:fine\)\{\s*\.hero-book-interactive:hover\{[^}]*\}\s*\}\s*', '', s)
assert n==1,('remove hover css',n)
css.write_text(s)

# Ajustes de forma compartidos; la maqueta de la web permanece intacta.
css=root/'css/miseria-multilingue.css'
s=css.read_text()
s+='''
/* Ajustes definitivos: tarjetas multimedia pulsables en toda su superficie. */
.cards-only-section .media-grid,.cards-only-section .press-grid{margin-top:0}
.media-card-button{width:100%;text-align:left;color:inherit;font:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.media-card-button:hover{transform:translateY(-4px);box-shadow:0 18px 32px rgba(0,0,0,.12);border-color:#111}
.media-card-button:focus-visible{outline:3px solid #111;outline-offset:4px}
.media-card-button h3,.media-card-button p{color:inherit}
.media-card-button>div{width:100%}
/* Cuatro tarjetas: títulos en una línea, texto secundario alineado en dos. */
.theme-card>div{width:100%;display:flex;flex-direction:column;justify-content:flex-end}
.theme-card h3{font-size:clamp(19px,1.9vw,29px);white-space:nowrap;line-height:1.2;letter-spacing:-.055em;margin-bottom:15px}
.theme-card p{font-size:13px;line-height:1.5;min-height:3em;display:block}
.theme-card .desc-line{display:block;white-space:nowrap}
/* Portada 3D de Alonso: mismo objeto visual que la cabecera y el cierre. */
#primera-pagina .feature-cover img{width:auto;max-width:100%;max-height:min(440px,42vw);object-fit:contain;box-shadow:none;filter:none;transition:transform .35s ease}
#primera-pagina .feature-cover:hover img{transform:translateY(-4px)}
@media(max-width:640px){
  .theme-card h3{font-size:clamp(16px,4vw,22px)}
  .theme-card p{font-size:11px;line-height:1.55;min-height:3.1em}
  #primera-pagina .feature-cover img{max-height:340px}
}
@media(max-width:355px){
  .theme-card h3{font-size:14px}
  .theme-card p{font-size:10px}
}
@media(prefers-reduced-motion:reduce){.media-card-button:hover,#primera-pagina .feature-cover:hover img{transform:none}}
'''
css.write_text(s)
print('Listo: 3 HTML, 2 CSS, 1 JS')
