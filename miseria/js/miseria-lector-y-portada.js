/* MISERIA — experiencia original de vídeo en la portada y lectura 3D.
   Código aislado: la navegación, el SEO y los demás reproductores quedan intactos. */
(() => {
 'use strict';
 const hero=document.getElementById('hero-book-interactive');
 const canHover=window.matchMedia('(hover:hover) and (pointer:fine)');
 let heroTimer=null,heroHoverBlocked=false;
 // El giro abre el mismo lector que las secciones de Alonso y de la llamada final.
 // El retraso corto evita aperturas accidentales al cruzar el ratón.
 hero?.addEventListener('pointerenter',()=>{
   if(!canHover.matches||heroHoverBlocked)return;
   clearTimeout(heroTimer);
   heroTimer=setTimeout(()=>{
      if(!hero.matches(':hover')||heroHoverBlocked)return;
      heroHoverBlocked=true;
      openReader(7,true,hero.querySelector('.hero-book'));
   },380);
 });
 hero?.addEventListener('pointerleave',()=>{clearTimeout(heroTimer);if(!document.getElementById('reader-dialog').open)heroHoverBlocked=false;});
 hero?.addEventListener('click',()=>{clearTimeout(heroTimer);heroHoverBlocked=true;openReader(7,true,hero.querySelector('.hero-book'));});
 const dialog=document.getElementById('reader-dialog');
 const pageImage=document.getElementById('reader-page-image');
 const pageSheet=document.getElementById('reader-page-sheet');
 const pageCount=document.getElementById('reader-page-count');
 const prev=document.getElementById('reader-page-prev');
 const next=document.getElementById('reader-page-next');
 const prevBottom=document.getElementById('reader-prev-bottom');
 const nextBottom=document.getElementById('reader-next-bottom');
 const viewport=document.getElementById('reader-page-viewport');
 const openingCover=document.getElementById('reader-opening-cover');
 const endCard=document.getElementById('reader-end-card');
 const audioBar=document.getElementById('reading-audio-bar');
 const audio=document.getElementById('reading-audio');
 const play=document.getElementById('reading-play');
 const progress=document.getElementById('reading-progress');
 const progressFill=document.getElementById('reading-progress-fill');
 const time=document.getElementById('reading-time');
 const R=window.MISERIA_I18N?.reader||{};
 const pages=Array.from({length:9},(_,i)=>`assets/primeras-paginas/pagina-${String(i+1).padStart(2,'0')}.png`);
 const total=pages.length+1;
 let current=0,turning=false,touchStart=null;
 pages.forEach(src=>{const img=new Image();img.src=src});
 const format=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
 function setPlayLabel(){play.textContent=audio.paused?(R.play||'Oír lectura'):(R.pause||'Pausar lectura');}
 function update(){
   const final=current===pages.length;
   pageImage.hidden=final;
   endCard.hidden=!final;
   if(!final){pageImage.src=pages[current];pageImage.alt=`${R.page||'Página'} ${current+1} — Miseria`;}
   pageCount.textContent=final?`${R.end||'Final'} / ${total}`:(current>=7?`${R.chapter||'MUERTE'} · ${current-6} / 2`:`${R.prelim||'Preliminares'} · ${current+1} / 7`);
   [prev,prevBottom].forEach(b=>b.disabled=current===0);
   [next,nextBottom].forEach(b=>b.disabled=current===total-1);
   const audioPage=!final&&current===7;
   audioBar.hidden=!audioPage;
   if(!audioPage){audio.pause();setPlayLabel();}
 }
 function animateCover(){openingCover.classList.remove('opening');void openingCover.offsetWidth;openingCover.classList.add('opening');}
 const zoomOriginCover=document.querySelector('#open-reader-cover img');
 const bookViewport=document.getElementById('open-book');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let readerOpeningId=0,zoomProxy=null,zoomAnimation=null;
 function clearZoom(){
   if(zoomAnimation){zoomAnimation.cancel();zoomAnimation=null;}
   if(zoomProxy){zoomProxy.remove();zoomProxy=null;}
   dialog.classList.remove('reader-zooming');
 }
 /* La imagen de la portada crece desde el mismo punto que ocupaba en la página.
    En pantallas donde la portada está fuera de la vista, parte del botón pulsado. */
 function zoomReaderFrom(source,token){
   const origin=source?.getBoundingClientRect();
   const goal=openingCover.getBoundingClientRect();
   const sourceOnScreen=origin&&origin.width>12&&origin.height>12&&origin.bottom>0&&origin.top<innerHeight&&origin.right>0&&origin.left<innerWidth;
   if(!sourceOnScreen||!goal.width||!goal.height||!zoomOriginCover){
     clearZoom();if(dialog.open&&token===readerOpeningId)animateCover();return;
   }
   dialog.classList.add('reader-zooming');
   const cover=zoomOriginCover.cloneNode(false);
   cover.removeAttribute('id');cover.removeAttribute('loading');
   cover.className='reader-zoom-proxy';
   cover.alt='';cover.setAttribute('aria-hidden','true');
   Object.assign(cover.style,{
      left:`${origin.left}px`,top:`${origin.top}px`,width:`${origin.width}px`,height:`${origin.height}px`,
      borderRadius:'3px'
   });
   dialog.appendChild(cover);zoomProxy=cover;
   const duration=680;
   if(!cover.animate){clearZoom();if(dialog.open&&token===readerOpeningId)animateCover();return;}
   zoomAnimation=cover.animate([
     {left:`${origin.left}px`,top:`${origin.top}px`,width:`${origin.width}px`,height:`${origin.height}px`,borderRadius:'3px'},
     {left:`${goal.left}px`,top:`${goal.top}px`,width:`${goal.width}px`,height:`${goal.height}px`,borderRadius:'6px'}
   ],{duration,easing:'cubic-bezier(.18,.7,.19,1)',fill:'forwards'});
   const completed=zoomAnimation.finished;
   completed.then(()=>{
     if(token!==readerOpeningId||!dialog.open)return;
     clearZoom();animateCover();
   }).catch(()=>{});
 }
 function openReader(start=0,playFirst=false,source=zoomOriginCover){
   readerOpeningId++;const token=readerOpeningId;
   clearZoom();openingCover.classList.remove('opening');
   current=Math.max(0,Math.min(pages.length-1,start));
   update();
   if(!dialog.open)dialog.showModal();
   if(reducedMotion.matches){requestAnimationFrame(animateCover)}
   else{requestAnimationFrame(()=>{if(dialog.open&&token===readerOpeningId)zoomReaderFrom(source,token)})}
   if(playFirst){audio.currentTime=0;audio.play().then(setPlayLabel).catch(setPlayLabel)}
 }
 function closeReader(){readerOpeningId++;clearZoom();if(dialog.open)dialog.close()}
 function turn(direction){
   if(turning)return;
   const target=current+direction;
   if(target<0||target>=total)return;
   turning=true;
   pageSheet.classList.remove('turn-forward','turn-back','arrive-forward','arrive-back');
   pageSheet.classList.add(direction>0?'turn-forward':'turn-back');
   setTimeout(()=>{
     current=target;update();
     pageSheet.classList.remove('turn-forward','turn-back');
     void pageSheet.offsetWidth;
     pageSheet.classList.add(direction>0?'arrive-forward':'arrive-back');
   },160);
   setTimeout(()=>{pageSheet.classList.remove('arrive-forward','arrive-back');turning=false},405);
 }
 document.getElementById('open-reader').addEventListener('click',e=>openReader(7,true,zoomOriginCover));
 document.getElementById('open-reader-cover').addEventListener('click',e=>openReader(7,true,zoomOriginCover));
 document.getElementById('open-reader-final')?.addEventListener('click',e=>openReader(7,true,e.currentTarget.querySelector('img')));
 document.getElementById('listen-first-page').addEventListener('click',e=>openReader(7,true,e.currentTarget));
 document.getElementById('close-reader').addEventListener('click',closeReader);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeReader()});
 dialog.addEventListener('close',()=>{heroHoverBlocked=true;setTimeout(()=>{if(!hero?.matches(':hover'))heroHoverBlocked=false},90);readerOpeningId++;clearZoom();audio.pause();audio.currentTime=0;setPlayLabel();current=0;turning=false;pageSheet.className='reader-page-sheet';update()});
 [prev,prevBottom].forEach(b=>b.addEventListener('click',()=>turn(-1)));
 [next,nextBottom].forEach(b=>b.addEventListener('click',()=>turn(1)));
 dialog.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1)}});
 viewport.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0]?.clientX??null},{passive:true});
 viewport.addEventListener('touchend',e=>{if(touchStart===null)return;const delta=(e.changedTouches[0]?.clientX??touchStart)-touchStart;touchStart=null;if(Math.abs(delta)>55)turn(delta<0?1:-1)},{passive:true});
 play.addEventListener('click',()=>{if(audio.paused){audio.play().then(setPlayLabel).catch(setPlayLabel)}else{audio.pause();setPlayLabel()}});
 audio.addEventListener('timeupdate',()=>{const pct=audio.duration?Math.min(100,Math.max(0,audio.currentTime/audio.duration*100)):0;progressFill.style.width=`${pct}%`;progress.setAttribute('aria-valuenow',String(Math.round(pct)));time.textContent=format(audio.currentTime)});
 audio.addEventListener('ended',()=>{play.textContent=R.again||'Oír de nuevo'});
 function seek(fraction){if(audio.duration)audio.currentTime=Math.max(0,Math.min(1,fraction))*audio.duration}
 progress.addEventListener('click',e=>{const r=progress.getBoundingClientRect();seek((e.clientX-r.left)/r.width)});
 progress.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();seek((audio.currentTime+(e.key==='ArrowRight'?5:-5))/(audio.duration||1))}});
 document.getElementById('reader-end-buy').addEventListener('click',()=>{closeReader();document.getElementById('shopDialog')?.showModal()});
 update();
})();
