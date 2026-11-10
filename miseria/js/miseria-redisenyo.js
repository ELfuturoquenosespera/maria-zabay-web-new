const chars=[
 {role:'El heredero',title:'Un hombre que lo tiene todo. Excepto el control.',body:'Alonso observa el mundo con sarcasmo y desprecio, pero pertenece exactamente al universo que juzga. Inteligente, privilegiado y acostumbrado a mandar, empieza a descubrir que heredar un imperio también significa heredar aquello que lo hizo posible.',secret:'Lo que teme: Parecerse demasiado a su padre.'},
 {role:'La esposa',title:'La mujer que permanece no siempre es la que se resigna.',body:'Isabel conoce las reglas del mundo de Alonso y el precio de sostener una familia dentro de él. Durante años, él ha confundido su discreción con fragilidad y su permanencia con una certeza. Pero hay silencios que no significan obediencia.',secret:'Lo que teme: Que todavía le importe.'},
 {role:'La ambición',title:'Quiere que la elijan. No perdona que no lo hagan.',body:'Mónica vive indignada por ocupar siempre un lugar secundario. Necesita ser reconocida, mostrada, elegida. Mientras ese momento no llega, convierte la atención, el deseo y todo cuanto sabe en armas para impedir que nadie pueda apartarla.',secret:'Lo que teme: Seguir siendo la mujer a la que esconden.'},
 {role:'El intermediario',title:'El hombre que sabe demasiado nunca cae solo.',body:'Durante años, Hugo ha convertido los secretos ajenos en una forma de supervivencia. Todos lo desprecian y casi todos han necesitado alguna vez que resolviera lo que no podía resolverse a la luz del día. Su poder no consiste en ser respetado, sino en resultar peligroso.',secret:'Lo que oculta: La medida exacta de todo lo que sabe.'},
 {role:'El padre',title:'Hay hombres que siguen gobernando después de muertos.',body:'Rodrigo fundó un imperio haciendo de la ambición una virtud y de la falta de escrúpulos un método. Su muerte convierte a Alonso en heredero de una fortuna, pero también de decisiones enterradas durante décadas. Ya no puede defenderse. Tampoco necesita hacerlo.',secret:'Lo que deja: Un poder construido para sobrevivirle.'},
 {role:'La mano derecha',title:'Nunca pregunta si algo debe hacerse. Solo cómo.',body:'Abogado, estratega y superviviente, Paco Monreal conoce los mecanismos que mantienen el poder en pie cuando la legalidad deja de ser suficiente. Sirvió a Rodrigo y ahora acompaña a Alonso, aunque en ese mundo la lealtad siempre tiene letra pequeña.',secret:'Lo que oculta: Dónde termina la obediencia y empieza su propio juego.'}
];
const tabs=[...document.querySelectorAll('.tab')];const panel=document.getElementById('characterPanel');
function showChar(i){let c=chars[i];if(!c)return;document.getElementById('cRole').textContent=c.role;document.getElementById('cTitle').textContent=c.title;document.getElementById('cText').textContent=c.body;document.getElementById('cSecret').textContent=c.secret;tabs.forEach((t,j)=>t.setAttribute('aria-selected',String(i===j)));panel.setAttribute('aria-labelledby','char-tab-'+i)}
tabs.forEach(t=>t.addEventListener('click',()=>showChar(Number(t.dataset.char))));
const menuToggle=document.getElementById('menuToggle'),nav=document.getElementById('navigation');
function closeMenu(){nav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='☰';document.body.classList.remove('menu-open')}
menuToggle.addEventListener('click',()=>{let next=!nav.classList.contains('open');nav.classList.toggle('open',next);menuToggle.setAttribute('aria-expanded',String(next));menuToggle.textContent=next?'×':'☰';document.body.classList.toggle('menu-open',next)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
const shop=document.getElementById('shopDialog'),press=document.getElementById('pressDialog');document.querySelectorAll('[data-shop]').forEach(b=>b.addEventListener('click',()=>shop.showModal()));['pressAccessTop','pressAccessBottom'].forEach(id=>document.getElementById(id).addEventListener('click',()=>press.showModal()));document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));[shop,press].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));


// Reproducción de los archivos incluidos en el sitio.
const mediaDialog=document.getElementById('mediaDialog');
const mediaTitle=document.getElementById('mediaDialogTitle');
const mediaAudio=document.getElementById('mediaAudio');
const mediaVideo=document.getElementById('mediaVideo');
const mediaMap={
 narration:{title:'Primera página de Miseria',kind:'audio',src:'assets/audio/lecturaprimerapagina.mp3'},
 video:{title:'¿De qué va Miseria?',kind:'video',src:'assets/video-resumen.mp4'},
 debate:{title:'Debate sobre Miseria',kind:'audio',src:'assets/audio/debate.mp3'}
};
function stopMedia(){
 [mediaAudio,mediaVideo].forEach(el=>{el.pause();el.removeAttribute('src');el.load();el.hidden=true;});
}
document.querySelectorAll('[data-media]').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();const item=mediaMap[link.dataset.media];if(!item)return;
 stopMedia();mediaTitle.textContent=item.title;
 const el=item.kind==='video'?mediaVideo:mediaAudio;
 el.hidden=false;el.src=item.src;mediaDialog.showModal();
 el.play().catch(()=>{});
}));
mediaDialog.addEventListener('close',stopMedia);
mediaDialog.addEventListener('click',event=>{if(event.target===mediaDialog)mediaDialog.close()});
mediaDialog.querySelector('[data-close]').addEventListener('click',()=>mediaDialog.close());
