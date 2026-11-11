/* MISERIA — vídeo original sin audio de vídeo + voz de la autora.
   Reproductor desacoplado del lector 3D y de los módulos de medios. */
(() => {
 'use strict';
 const trigger=document.getElementById('open-reader-cover');
 const dialog=document.getElementById('dance-dialog');
 const preview=trigger?.querySelector('.feature-dance-preview');
 const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)');
 if(trigger&&preview){
   preview.muted=true; preview.defaultMuted=true; preview.volume=0;
   trigger.addEventListener('pointerenter',()=>{
     if(!finePointer.matches)return;
     // Navegadores permiten reproducir vídeos silenciados sin acción explícita.
     preview.play().catch(()=>{});
   });
   trigger.addEventListener('pointerleave',()=>{
     preview.pause();try{preview.currentTime=0}catch{}
   });
 }

 if(!trigger||!dialog)return;
 const video=document.getElementById('dance-video');
 const audio=document.getElementById('dance-narration');
 const close=document.getElementById('dance-close');
 const toggle=document.getElementById('dance-toggle');
 const seek=document.getElementById('dance-progress');
 const clock=document.getElementById('dance-clock');
 const labels={play:toggle.dataset.play,pause:toggle.dataset.pause,again:toggle.dataset.again};
 let changingSeek=false;
 video.muted=true;
 video.defaultMuted=true;
 video.volume=0;
 const fmt=t=>`${Math.floor((Number.isFinite(t)?t:0)/60)}:${String(Math.floor((Number.isFinite(t)?t:0)%60)).padStart(2,'0')}`;
 function updateUI(){
   const duration=audio.duration||0;
   const ratio=duration?audio.currentTime/duration:0;
   if(!changingSeek)seek.value=String(ratio*100);
   clock.textContent=`${fmt(audio.currentTime)} / ${fmt(duration)}`;
   toggle.textContent=audio.ended?labels.again:audio.paused?labels.play:labels.pause;
 }
 function pauseBoth(){audio.pause();video.pause();updateUI();}
 function playBoth(){
   video.muted=true;
   if(audio.ended){audio.currentTime=0;video.currentTime=0;}
   // Ambas llamadas parten de una acción del usuario: se mantiene mudo el vídeo.
   video.play().catch(()=>{});
   audio.play().then(updateUI).catch(updateUI);
   updateUI();
 }
 function open(){
   if(preview)preview.pause();
   if(!dialog.open)dialog.showModal();
   audio.currentTime=0;
   try{video.currentTime=0;}catch{}
   playBoth();
 }
 function stop(){
   pauseBoth();
   audio.currentTime=0;
   try{video.currentTime=0;}catch{}
   updateUI();
 }
 trigger.addEventListener('click',open);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',stop);
 toggle.addEventListener('click',()=>{if(audio.paused)playBoth();else pauseBoth()});
 function syncVideoToNarration(){
   const duration=video.duration;
   if(!Number.isFinite(duration)||duration<=0)return;
   const target=audio.currentTime%duration;
   const drift=Math.abs(video.currentTime-target);
   if(drift>1.25&&Math.abs(drift-duration)>1.25){
      try{video.currentTime=target}catch{}
   }
 }
 audio.addEventListener('timeupdate',()=>{updateUI();if(!video.paused)syncVideoToNarration()});
 audio.addEventListener('loadedmetadata',updateUI);
 audio.addEventListener('playing',updateUI);
 audio.addEventListener('pause',updateUI);
 audio.addEventListener('ended',()=>{video.pause();updateUI()});
 video.addEventListener('ended',()=>{if(!audio.paused)video.play().catch(()=>{})});
 seek.addEventListener('input',()=>{
   changingSeek=true;
   if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(seek.value)/100*audio.duration;syncVideoToNarration()}
   changingSeek=false;
   updateUI();
 });
 updateUI();
})();
