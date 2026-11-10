const menu=document.querySelector('.menu'),nav=document.querySelector('.nav-links');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));

const reader=document.getElementById('reader-dialog'),
  readingAudio=document.getElementById('reading-audio'),
  readingPlay=document.getElementById('reading-play'),
  readingProgress=document.getElementById('reading-progress'),
  readingFill=document.getElementById('reading-progress-fill'),
  readingTime=document.getElementById('reading-time'),
  readingAudioBar=document.getElementById('reading-audio-bar'),
  readerPageImage=document.getElementById('reader-page-image'),
  readerPageSheet=document.getElementById('reader-page-sheet'),
  readerPageCount=document.getElementById('reader-page-count'),
  readerPrev=document.getElementById('reader-page-prev'),
  readerNext=document.getElementById('reader-page-next'),
  readerPrevBottom=document.getElementById('reader-prev-bottom'),
  readerNextBottom=document.getElementById('reader-next-bottom'),
  readerViewport=document.getElementById('reader-page-viewport'),
  readerOpeningCover=document.getElementById('reader-opening-cover'),
  readerEndCard=document.getElementById('reader-end-card');

const readerPages=Array.from({length:9},(_,i)=>`assets/primeras-paginas/pagina-${String(i+1).padStart(2,'0')}.png`);
const readerTotalSteps=readerPages.length+1;
readerPages.forEach(src=>{const img=new Image();img.src=src});
let currentReaderPage=0,readerAnimating=false,touchStartX=null;

const formatTime=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
const updateReaderUI=()=>{
  const onFinalCard=currentReaderPage===readerPages.length;
  if(onFinalCard){
    readerPageImage.hidden=true;
    readerEndCard.hidden=false;
    readerPageCount.textContent=`Final / ${readerTotalSteps}`;
  }else{
    readerPageImage.hidden=false;
    readerEndCard.hidden=true;
    readerPageImage.src=readerPages[currentReaderPage];
    readerPageImage.alt=`Página ${currentReaderPage+1} de las primeras páginas de Miseria`;
    readerPageCount.textContent=`${currentReaderPage+1} / ${readerTotalSteps}`;
  }
  const atStart=currentReaderPage===0,atEnd=currentReaderPage===readerTotalSteps-1;
  [readerPrev,readerPrevBottom].forEach(button=>button.disabled=atStart);
  [readerNext,readerNextBottom].forEach(button=>button.disabled=atEnd);
  const isNarrativeFirstPage=!onFinalCard&&currentReaderPage===7;
  readingAudioBar.hidden=!isNarrativeFirstPage;
  if(!isNarrativeFirstPage&&!readingAudio.paused){readingAudio.pause();readingPlay.textContent='Oír lectura'}
};
const restartCoverOpening=()=>{
  readerOpeningCover.classList.remove('opening');
  void readerOpeningCover.offsetWidth;
  readerOpeningCover.classList.add('opening');
};
const openReader=(playAudio=false,startPage=0)=>{
  currentReaderPage=Math.max(0,Math.min(readerPages.length-1,startPage));
  updateReaderUI();
  if(!reader.open)reader.showModal();
  requestAnimationFrame(restartCoverOpening);
  if(playAudio){readingAudio.currentTime=0;readingAudio.play().then(()=>{readingPlay.textContent='Pausar lectura'}).catch(()=>{})}
};
const changeReaderPage=direction=>{
  if(readerAnimating)return;
  const target=currentReaderPage+direction;
  if(target<0||target>=readerTotalSteps)return;
  readerAnimating=true;
  readerPageSheet.classList.remove('turn-forward','turn-back','arrive-forward','arrive-back');
  readerPageSheet.classList.add(direction>0?'turn-forward':'turn-back');
  setTimeout(()=>{
    currentReaderPage=target;
    updateReaderUI();
    readerPageSheet.classList.remove('turn-forward','turn-back');
    void readerPageSheet.offsetWidth;
    readerPageSheet.classList.add(direction>0?'arrive-forward':'arrive-back');
  },150);
  setTimeout(()=>{readerPageSheet.classList.remove('arrive-forward','arrive-back');readerAnimating=false},390);
};

document.getElementById('open-reader').addEventListener('click',()=>openReader(false));
document.getElementById('close-reader').addEventListener('click',()=>reader.close());
reader.addEventListener('click',event=>{if(event.target===reader)reader.close()});
reader.addEventListener('close',()=>{readingAudio.pause();readingPlay.textContent='Oír lectura';currentReaderPage=0;updateReaderUI()});
[readerPrev,readerPrevBottom].forEach(button=>button.addEventListener('click',()=>changeReaderPage(-1)));
[readerNext,readerNextBottom].forEach(button=>button.addEventListener('click',()=>changeReaderPage(1)));
reader.addEventListener('keydown',event=>{if(!reader.open)return;if(event.key==='ArrowLeft'){event.preventDefault();changeReaderPage(-1)}else if(event.key==='ArrowRight'){event.preventDefault();changeReaderPage(1)}});
readerViewport.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0]?.clientX??null},{passive:true});
readerViewport.addEventListener('touchend',event=>{if(touchStartX===null)return;const end=event.changedTouches[0]?.clientX??touchStartX,delta=end-touchStartX;touchStartX=null;if(Math.abs(delta)>45)changeReaderPage(delta<0?1:-1)},{passive:true});

readingPlay.addEventListener('click',()=>{if(readingAudio.paused){readingAudio.play();readingPlay.textContent='Pausar lectura'}else{readingAudio.pause();readingPlay.textContent='Oír lectura'}});
readingAudio.addEventListener('timeupdate',()=>{const percent=readingAudio.duration?readingAudio.currentTime/readingAudio.duration*100:0;readingFill.style.width=`${percent}%`;readingProgress.setAttribute('aria-valuenow',String(Math.round(percent)));readingTime.textContent=formatTime(readingAudio.currentTime)});
readingAudio.addEventListener('ended',()=>{readingPlay.textContent='Oír de nuevo'});
readingProgress.addEventListener('click',event=>{if(!readingAudio.duration)return;const box=readingProgress.getBoundingClientRect();readingAudio.currentTime=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width))*readingAudio.duration});
document.getElementById('listen-first-page').addEventListener('click',()=>openReader(true,7));
updateReaderUI();
const purchaseDialog=document.getElementById('purchase-dialog');document.querySelectorAll('.purchase-trigger').forEach(button=>button.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');purchaseDialog.showModal()}));document.getElementById('purchase-close').addEventListener('click',()=>purchaseDialog.close());purchaseDialog.addEventListener('click',event=>{if(event.target===purchaseDialog)purchaseDialog.close()});const audioCopy={'de-que-va':{title:'¿De qué va?',description:'Una introducción breve a <em>Miseria</em> para descubrir de qué va la novela sin revelar la historia.',mode:'video'},debate:{title:'Debate',description:'Dos miradas frente a frente sobre la ambición, la herencia y los límites de la conciencia.',mode:'audio',src:'assets/audio/debate.mp3'}};
const featureAudio=document.getElementById('feature-audio'),featurePlay=document.getElementById('audio-play'),featureBack=document.getElementById('audio-back'),featureForward=document.getElementById('audio-forward'),featureLine=document.getElementById('audio-line'),featureCurrent=document.getElementById('audio-current'),featureDuration=document.getElementById('audio-duration'),featureKicker=document.getElementById('audio-kicker'),featureStatus=document.getElementById('audio-status'),featureSpeed=document.getElementById('audio-speed'),featureVolume=document.getElementById('audio-volume'),featureVolumeValue=document.getElementById('audio-volume-value'),featureMute=document.getElementById('audio-mute'),audioPanel=document.querySelector('.audio-panel'),summaryVideoDialog=document.getElementById('summary-video-dialog'),summaryVideo=document.getElementById('summary-video'),summaryVideoClose=document.getElementById('summary-video-close');
let selectedFeature=audioCopy['de-que-va'],debateResumeTime=0;
const setFeatureProgress=time=>{const duration=featureAudio.duration||0;const percent=duration?Math.max(0,Math.min(100,time/duration*100)):0;featureCurrent.textContent=formatTime(time||0);featureDuration.textContent=duration?formatTime(duration):'0:00';featureLine.style.setProperty('--audio-progress',`${percent}%`);featureLine.setAttribute('aria-valuenow',String(Math.round(percent)))};
const resetFeatureProgress=()=>setFeatureProgress(0);
const updateFeatureVolume=()=>{const pct=Math.round(featureAudio.volume*100);featureVolume.value=String(featureAudio.volume);featureVolumeValue.textContent=`${pct}%`;const silent=featureAudio.muted||featureAudio.volume===0;featureMute.textContent=silent?'🔇':'🔊';featureMute.setAttribute('aria-label',silent?'Activar sonido':'Silenciar');featureMute.title=silent?'Activar sonido':'Silenciar'};
const pauseFeatureAudio=()=>{if(selectedFeature.mode==='audio'&&Number.isFinite(featureAudio.currentTime))debateResumeTime=featureAudio.currentTime;featureAudio.pause();featurePlay.textContent='▶'};
const selectAudio=item=>{pauseFeatureAudio();selectedFeature=item;featureAudio.removeAttribute('src');featureAudio.load();resetFeatureProgress();if(item.mode==='video'){audioPanel.classList.add('video-mode');featurePlay.disabled=false;featurePlay.style.cursor='pointer';featurePlay.setAttribute('aria-label','Ver vídeo: ¿De qué va?');featureKicker.textContent='Vídeo';featureStatus.textContent='Pulsa para ver el vídeo'}else{audioPanel.classList.remove('video-mode');featureAudio.src=item.src;featureAudio.load();featureAudio.playbackRate=Number(featureSpeed.value);featurePlay.disabled=false;featurePlay.style.cursor='pointer';featurePlay.setAttribute('aria-label',`Reproducir ${item.title.toLowerCase()}`);featureKicker.textContent='Audio';featureStatus.textContent='Pulsa para escuchar'}};
document.querySelectorAll('.audio-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.audio-tab').forEach(item=>{item.classList.remove('active');item.setAttribute('aria-selected','false')});tab.classList.add('active');tab.setAttribute('aria-selected','true');const item=audioCopy[tab.dataset.audio];document.getElementById('audio-title').textContent=item.title;document.getElementById('audio-description').innerHTML=item.description;selectAudio(item)}));
featurePlay.addEventListener('click',()=>{if(featurePlay.disabled)return;if(selectedFeature.mode==='video'){summaryVideoDialog.showModal();summaryVideo.currentTime=0;summaryVideo.play().catch(()=>{});return}if(featureAudio.paused){featureAudio.play().then(()=>{featurePlay.textContent='❙❙';featurePlay.setAttribute('aria-label','Pausar debate');featureStatus.textContent='Reproduciendo'}).catch(()=>{featureStatus.textContent='Pulsa de nuevo para reproducir'})}else{debateResumeTime=featureAudio.currentTime;featureAudio.pause();featurePlay.textContent='▶';featurePlay.setAttribute('aria-label','Reproducir debate');featureStatus.textContent='En pausa'}});
featureBack.addEventListener('click',()=>{if(selectedFeature.mode!=='audio'||!featureAudio.duration)return;featureAudio.currentTime=Math.max(0,featureAudio.currentTime-15);debateResumeTime=featureAudio.currentTime;setFeatureProgress(featureAudio.currentTime)});
featureForward.addEventListener('click',()=>{if(selectedFeature.mode!=='audio'||!featureAudio.duration)return;featureAudio.currentTime=Math.min(featureAudio.duration,featureAudio.currentTime+15);debateResumeTime=featureAudio.currentTime;setFeatureProgress(featureAudio.currentTime)});
featureSpeed.addEventListener('change',()=>{featureAudio.playbackRate=Number(featureSpeed.value);if(selectedFeature.mode==='audio')featureStatus.textContent=`Velocidad ${featureSpeed.options[featureSpeed.selectedIndex].text}`});
featureVolume.addEventListener('input',()=>{featureAudio.volume=Number(featureVolume.value);featureAudio.muted=featureAudio.volume===0;updateFeatureVolume()});
featureMute.addEventListener('click',()=>{featureAudio.muted=!featureAudio.muted;if(!featureAudio.muted&&featureAudio.volume===0)featureAudio.volume=.7;updateFeatureVolume()});
featureAudio.volume=1;featureAudio.playbackRate=1;updateFeatureVolume();
featureAudio.addEventListener('loadedmetadata',()=>{if(selectedFeature.mode!=='audio')return;if(debateResumeTime>0&&debateResumeTime<featureAudio.duration)featureAudio.currentTime=debateResumeTime;setFeatureProgress(featureAudio.currentTime)});
featureAudio.addEventListener('timeupdate',()=>{if(selectedFeature.mode!=='audio')return;debateResumeTime=featureAudio.currentTime;setFeatureProgress(featureAudio.currentTime)});
featureAudio.addEventListener('ratechange',()=>{if(Number(featureSpeed.value)!==featureAudio.playbackRate){const match=[...featureSpeed.options].find(option=>Number(option.value)===featureAudio.playbackRate);if(match)featureSpeed.value=match.value}});
featureAudio.addEventListener('ended',()=>{debateResumeTime=0;featurePlay.textContent='▶';featurePlay.setAttribute('aria-label','Reproducir debate');featureStatus.textContent='Finalizado';setFeatureProgress(0)});
featureAudio.addEventListener('error',()=>{if(selectedFeature.mode==='audio')featureStatus.textContent='No se encontró el archivo de audio'});
featureLine.addEventListener('click',event=>{if(selectedFeature.mode!=='audio'||!featureAudio.duration)return;const box=featureLine.getBoundingClientRect();featureAudio.currentTime=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width))*featureAudio.duration;debateResumeTime=featureAudio.currentTime;setFeatureProgress(featureAudio.currentTime)});
featureLine.addEventListener('keydown',event=>{if(selectedFeature.mode!=='audio'||!featureAudio.duration||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')featureAudio.currentTime=0;else if(event.key==='End')featureAudio.currentTime=featureAudio.duration;else featureAudio.currentTime=Math.max(0,Math.min(featureAudio.duration,featureAudio.currentTime+(event.key==='ArrowRight'?5:-5)));debateResumeTime=featureAudio.currentTime;setFeatureProgress(featureAudio.currentTime)});
summaryVideoClose.addEventListener('click',()=>summaryVideoDialog.close());summaryVideoDialog.addEventListener('click',event=>{if(event.target===summaryVideoDialog)summaryVideoDialog.close()});summaryVideoDialog.addEventListener('close',()=>{summaryVideo.pause();summaryVideo.currentTime=0});

// Google Analytics y consentimiento de cookies
(()=>{
  const MEASUREMENT_ID='G-8SFV2TFR2V';
  const CONSENT_KEY='mariazabay_cookie_consent';
  const banner=document.getElementById('cookie-banner');
  const accept=document.getElementById('cookie-accept');
  const reject=document.getElementById('cookie-reject');
  const info=document.getElementById('cookie-info');
  const manage=document.getElementById('manage-cookies');
  const policyOpen=document.getElementById('open-cookie-policy');
  const policy=document.getElementById('cookie-policy-dialog');
  const policyClose=document.getElementById('close-cookie-policy');
  let analyticsLoaded=false;

  const loadAnalytics=()=>{
    if(analyticsLoaded)return;
    analyticsLoaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',MEASUREMENT_ID,{anonymize_ip:true});
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  };

  const setConsent=value=>{
    localStorage.setItem(CONSENT_KEY,value);
    banner.hidden=true;
    if(value==='accepted')loadAnalytics();
  };

  const showChoices=()=>{banner.hidden=false};
  const stored=localStorage.getItem(CONSENT_KEY);
  if(stored==='accepted')loadAnalytics();
  else if(stored!=='rejected')showChoices();

  accept?.addEventListener('click',()=>setConsent('accepted'));
  reject?.addEventListener('click',()=>setConsent('rejected'));
  manage?.addEventListener('click',showChoices);
  info?.addEventListener('click',()=>policy?.showModal());
  policyOpen?.addEventListener('click',()=>policy?.showModal());
  policyClose?.addEventListener('click',()=>policy?.close());
  policy?.addEventListener('click',event=>{if(event.target===policy)policy.close()});
})();


// Selector de personajes de Miseria
(() => {
  const root=document.getElementById('miseria-characters');
  if(!root)return;
  const tabs=[...root.querySelectorAll('[role="tab"]')];
  const panels=[...root.querySelectorAll('[role="tabpanel"]')];
  const activate=tab=>{
    tabs.forEach(item=>item.setAttribute('aria-selected',String(item===tab)));
    panels.forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute('aria-controls')});
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();
      let next;
      if(event.key==='Home')next=tabs[0];
      else if(event.key==='End')next=tabs[tabs.length-1];
      else{
        const step=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
        next=tabs[(index+step+tabs.length)%tabs.length];
      }
      activate(next);next.focus();
    });
  });
})();


// Acceso mediante código a la sala de prensa
(()=>{
  const dialog=document.getElementById('press-access-dialog');
  const triggers=[...document.querySelectorAll('.press-access-trigger')];
  const close=document.getElementById('press-access-close');
  const form=document.getElementById('press-access-form');
  const input=document.getElementById('press-access-code');
  const error=document.getElementById('press-access-error');
  const lock=document.getElementById('press-access-lock');
  const note=document.getElementById('press-note-full');
  const roomTabs=[...document.querySelectorAll('.press-room-tab')];
  const roomPanels=[...document.querySelectorAll('.press-room-panel')];
  if(!dialog||!triggers.length||!form||!input||!lock||!note)return;

  const activateRoomPanel=(tab)=>{
    const panelId=tab?.dataset.pressPanel;
    if(!panelId)return;
    roomTabs.forEach(item=>{
      const active=item===tab;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-selected',String(active));
    });
    roomPanels.forEach(panel=>{panel.hidden=panel.id!==panelId});
  };
  roomTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activateRoomPanel(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();
      let next;
      if(event.key==='Home')next=roomTabs[0];
      else if(event.key==='End')next=roomTabs[roomTabs.length-1];
      else{
        const step=event.key==='ArrowRight'?1:-1;
        next=roomTabs[(index+step+roomTabs.length)%roomTabs.length];
      }
      activateRoomPanel(next);
      next.focus();
    });
  });

  // Código provisional. Puede sustituirse por cualquier texto o número.
  const ACCESS_CODE='2026';
  const SESSION_KEY='miseria_press_access';

  const showNote=()=>{
    lock.hidden=true;
    note.hidden=false;
    error.textContent='';
    if(roomTabs[0])activateRoomPanel(roomTabs[0]);
    sessionStorage.setItem(SESSION_KEY,'granted');
  };
  const showLock=()=>{
    lock.hidden=false;
    note.hidden=true;
    input.value='';
    error.textContent='';
  };
  const openDialog=()=>{
    const nav=document.getElementById('navigation');
    const menu=document.querySelector('.menu');
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded','false');
    if(sessionStorage.getItem(SESSION_KEY)==='granted')showNote(); else showLock();
    dialog.showModal();
    if(!lock.hidden)setTimeout(()=>input.focus(),40);
  };

  triggers.forEach(trigger=>trigger.addEventListener('click',openDialog));
  close?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(input.value.trim()===ACCESS_CODE){showNote();note.focus?.()}
    else{error.textContent='Código incorrecto. Comprueba el código e inténtalo de nuevo.';input.select()}
  });
})();


// Hero: vídeo en hover + modal al hacer clic. Bloque aislado.
(function initHeroVideoExperience(){
  const media=document.getElementById('hero-media');
  const hoverVideo=document.getElementById('hero-hover-video');
  const dialog=document.getElementById('hero-video-dialog');
  const player=document.getElementById('hero-video-player');
  const close=document.getElementById('hero-video-close');
  if(!media||!hoverVideo||!dialog||!player)return;

  const canHover=window.matchMedia('(hover: hover) and (pointer: fine)');
  function startHover(){
    if(!canHover.matches||dialog.open)return;
    media.classList.add('is-playing');
    hoverVideo.play().catch(function(){});
  }
  function stopHover(){
    media.classList.remove('is-playing');
    hoverVideo.pause();
    try{hoverVideo.currentTime=0}catch(e){}
  }
  function openDialog(){
    stopHover();
    if(typeof dialog.showModal==='function')dialog.showModal();
    player.play().catch(function(){});
  }
  function closeDialog(){
    player.pause();
    try{player.currentTime=0}catch(e){}
    if(dialog.open)dialog.close();
  }
  media.addEventListener('mouseenter',startHover);
  media.addEventListener('mouseleave',stopHover);
  media.addEventListener('click',openDialog);
  media.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' '){event.preventDefault();openDialog()}
  });
  if(close)close.addEventListener('click',closeDialog);
  dialog.addEventListener('click',function(event){if(event.target===dialog)closeDialog()});
  dialog.addEventListener('close',function(){
    player.pause();
    try{player.currentTime=0}catch(e){}
  });
})();


// Sala de prensa: las cuatro imágenes se muestran en un visor modal y se descargan individualmente.
// - Abierta desde disco (file://): usar descarga nativa del navegador.
// - En una web http(s): descargar bytes y generar un enlace temporal de descarga.
(()=>{
  const buttons=[...document.querySelectorAll('.press-image-view')];
  const viewer=document.getElementById('press-image-viewer');
  const preview=document.getElementById('press-image-preview');
  const title=document.getElementById('press-image-viewer-title');
  const download=document.getElementById('press-image-download-current');
  const status=document.getElementById('press-image-download-status');
  const close=document.getElementById('press-image-viewer-close');
  if(!buttons.length||!viewer||!preview||!title||!download||!close)return;

  const openImage=(button)=>{
    const src=button.dataset.imageSrc||'';
    preview.src=src;
    preview.alt=button.dataset.imageAlt||button.dataset.imageTitle||'Imagen';
    title.textContent=button.dataset.imageTitle||'Imagen';
    download.href=src;
    download.download=button.dataset.imageName||'imagen.jpg';
    if(status)status.textContent='';
    if(!viewer.open)viewer.showModal();
  };
  const closeImage=()=>{
    if(viewer.open)viewer.close();
  };
  viewer.addEventListener('close',()=>{
    preview.removeAttribute('src');
    preview.alt='';
    if(status)status.textContent='';
  });

  download.addEventListener('click',async(event)=>{
    // fetch() no puede leer normalmente ficheros file:// en Chrome.
    // En ese caso dejamos actuar al <a download>, sin abrir pestañas nuevas.
    if(location.protocol==='file:')return;
    if(!['http:','https:'].includes(location.protocol))return;

    event.preventDefault();
    event.stopPropagation();
    const src=download.getAttribute('href');
    if(!src)return;
    if(status)status.textContent='Preparando descarga…';
    try{
      const response=await fetch(src,{credentials:'same-origin'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const blob=await response.blob();
      if(blob.size<3)throw new Error('Archivo vacío');
      // Comprobamos el contenido y no el Content-Type, que puede estar mal
      // configurado incluso cuando el JPG se muestra correctamente.
      const header=new Uint8Array(await blob.slice(0,3).arrayBuffer());
      if(header[0]!==255||header[1]!==216||header[2]!==255)throw new Error('El archivo no es un JPEG');
      const fileUrl=URL.createObjectURL(blob);
      const link=document.createElement('a');
      link.href=fileUrl;
      link.download=download.getAttribute('download')||'imagen.jpg';
      link.style.display='none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(fileUrl),30000);
      if(status)status.textContent='';
    }catch(error){
      console.error('No se ha podido descargar la imagen:',error);
      if(status)status.textContent='No se pudo iniciar la descarga desde esta página. Comprueba que la imagen está disponible en el servidor.';
    }
  });
  buttons.forEach(button=>button.addEventListener('click',()=>openImage(button)));
  close.addEventListener('click',closeImage);
  viewer.addEventListener('click',event=>{if(event.target===viewer)closeImage()});
})();
