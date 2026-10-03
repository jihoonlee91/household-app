(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20261003-2';
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const loadMobileUi=()=>{if(document.getElementById('hh-mobile-ui'))return;const s=document.createElement('script');s.id='hh-mobile-ui';s.src='./mobile-ui.js?v='+META_VER;s.defer=true;document.head.appendChild(s);};
  const loadShare=()=>{if(document.getElementById('hh-share-js'))return;const s=document.createElement('script');s.id='hh-share-js';s.src='./share.js?v='+META_VER;s.defer=true;document.head.appendChild(s);};
  loadMobileUi();loadShare();
  const buttons=()=>['installGate','installBar'].map(id=>document.getElementById(id)).filter(Boolean);
  function refresh(){const installed=standalone();buttons().forEach(b=>{b.hidden=installed;b.style.display=installed?'none':'';});}
  function addShareButtons(){
    const bar=document.getElementById('bar'),out=document.getElementById('out');
    if(bar&&out&&!document.getElementById('shareBar')){const b=document.createElement('button');b.id='shareBar';b.type='button';b.textContent='공유 이미지';b.setAttribute('data-no-share','');bar.insertBefore(b,out);b.onclick=()=>window.hhOpenShare&&window.hhOpenShare();}
    const sopt=document.querySelector('#allSheet .sopt'),out2=document.getElementById('out2');
    if(sopt&&out2&&!document.getElementById('share2')){const b=document.createElement('button');b.id='share2';b.type='button';b.textContent='공유 이미지';b.setAttribute('data-no-share','');sopt.insertBefore(b,out2);b.onclick=()=>{document.getElementById('allSheet')?.classList.remove('open');window.hhOpenShare&&window.hhOpenShare();};}
  }
  function refreshMetadata(){
    document.title=APP_NAME;
    let appleTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!appleTitle){appleTitle=document.createElement('meta');appleTitle.name='apple-mobile-web-app-title';document.head.appendChild(appleTitle);} appleTitle.content=APP_NAME;
    document.querySelectorAll('link[rel="manifest"]').forEach(x=>x.remove());
    const m=document.createElement('link');m.rel='manifest';m.href='./manifest.webmanifest?v='+META_VER;document.head.appendChild(m);
    const h1=document.querySelector('#gate h1'); if(h1) h1.textContent=APP_NAME;
    const hello=document.getElementById('hello'); if(hello&&hello.textContent.trim()==='우리집') hello.textContent=APP_NAME;
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;refresh();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;refresh();});
  async function install(){
    if(standalone()) return;
    if(promptEvent){promptEvent.prompt();try{await promptEvent.userChoice}catch(_){}promptEvent=null;refresh();return;}
    const ua=navigator.userAgent.toLowerCase();
    if(/samsungbrowser/.test(ua)) alert('삼성 인터넷 메뉴(≡) → 현재 페이지 추가 → 홈 화면 또는 앱 설치를 선택하세요.');
    else if(/edg/.test(ua)&&/windows/.test(ua)) alert('Edge 메뉴(…) → 앱 → 이 사이트를 앱으로 설치를 선택하세요.');
    else if(/iphone|ipad/.test(ua)&&!/crios/.test(ua)) alert('Safari 아래 공유 버튼(□↑) → 홈 화면에 추가를 선택하세요.');
    else if(/chrome|crios/.test(ua)) alert('브라우저 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가를 선택하세요.');
    else alert('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.');
  }
  async function useLocalSimulator(){
    const frame=document.getElementById('app'); if(!frame) return;
    try{const r=await fetch('./sim.html?v='+META_VER,{cache:'no-store'});if(r.ok)frame.srcdoc=await r.text();else console.warn('sim.html',r.status);}catch(e){console.warn('local simulator',e);}
  }
  function wrapSimulator(){
    const old=window.openApp;if(typeof old!=='function'||old.__hhLocalSim)return;
    const wrapped=async function(app,fromPop){const out=await old(app,fromPop);if(app==='sim')await useLocalSimulator();return out;};wrapped.__hhLocalSim=true;window.openApp=wrapped;
    if(new URLSearchParams(location.search).get('app')==='sim')setTimeout(useLocalSimulator,0);
  }
  window.hhInstallApp=install;
  window.addEventListener('DOMContentLoaded',()=>{refreshMetadata();addShareButtons();buttons().forEach(b=>b.addEventListener('click',install));refresh();});
  window.addEventListener('load',async()=>{addShareButtons();if('serviceWorker' in navigator){try{const r=await navigator.serviceWorker.register('./sw.js?v='+META_VER,{updateViaCache:'none'});await r.update();}catch(e){console.warn(e);}}wrapSimulator();});
})();