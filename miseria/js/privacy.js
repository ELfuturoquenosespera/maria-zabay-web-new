/* Preferencias de cookies para toda la web. Analytics solo con consentimiento. */
(()=>{
  'use strict';
  const key='mz_cookie_consent';
  const analyticsId='G-8SFV2TFR2V';
  const banner=document.getElementById('cookie-banner');
  if(!banner)return;
  const accept=document.getElementById('cookie-accept');
  const reject=document.getElementById('cookie-reject');
  let preference=null;
  try{preference=localStorage.getItem(key);}catch(e){}
  function setPreference(value){
    try{localStorage.setItem(key,value);}catch(e){}
    preference=value;
  }
  function showBanner(){banner.hidden=false;banner.style.display='';}
  function hideBanner(){banner.hidden=true;banner.style.display='none';}
  function loadAnalytics(){
    if(!['http:','https:'].includes(location.protocol)||window.__mzAnalyticsLoaded)return;
    window.__mzAnalyticsLoaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());
    window.gtag('config',analyticsId,{anonymize_ip:true});
    const script=document.createElement('script');
    script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(analyticsId);
    document.head.appendChild(script);
  }
  function clearAnalyticsCookies(){
    let all='';try{all=document.cookie;}catch(e){return;}
    const names=all.split(';').map(x=>x.split('=')[0].trim()).filter(x=>x==='_ga'||x.startsWith('_ga_')||x==='_gid');
    const domains=[location.hostname,'.'+location.hostname];
    const bits=location.hostname.split('.');
    if(bits.length>=2)domains.push('.'+bits.slice(-2).join('.'));
    for(const name of names){
      document.cookie=name+'=;Max-Age=0;path=/;SameSite=Lax';
      for(const domain of domains){document.cookie=name+'=;Max-Age=0;path=/;domain='+domain+';SameSite=Lax';}
    }
  }
  window.openCookieSettings=function(){showBanner();return false;};
  accept?.addEventListener('click',()=>{setPreference('accepted');hideBanner();loadAnalytics();});
  reject?.addEventListener('click',()=>{
    const wasAccepted=preference==='accepted';
    setPreference('rejected');clearAnalyticsCookies();hideBanner();
    if(wasAccepted&&window.__mzAnalyticsLoaded)location.reload();
  });
  if(preference==='accepted'){hideBanner();loadAnalytics();}
  else if(preference==='rejected')hideBanner();
  else showBanner();
})();
