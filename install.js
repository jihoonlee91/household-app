(()=>{
  let promptEvent=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const buttons=()=>[document.getElementById('installTop')].filter(Boolean);
  function refresh(){
    const installed=standalone();
    buttons().forEach(b=>{b.hidden=installed;b.style.display=installed?'none':'inline-flex';});
  }
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;refresh();});
  window.addEventListener('appinstalled',()=>{promptEvent=null;refresh();});
  async function install(){
    if(standalone()) return;
    if(promptEvent){promptEvent.prompt();try{await promptEvent.userChoice}catch(_){}promptEvent=null;refresh();return;}
    const ua=navigator.userAgent.toLowerCase();
    if(/samsungbrowser/.test(ua)) alert('삼성 인터넷 메뉴(≡) → 현재 페이지 추가 → 홈 화면 또는 앱 설치를 선택하세요.');
    else if(/edg/.test(ua)&&/windows/.test(ua)) alert('Edge 메뉴(…) → 앱 → 이 사이트를 앱으로 설치를 선택하세요.');
    else if(/chrome|crios/.test(ua)) alert('브라우저 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가를 선택하세요.');
    else alert('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.');
  }
  window.hhInstallApp=install;
  window.addEventListener('DOMContentLoaded',()=>{
    const oldGate=document.getElementById('installGate'),oldBar=document.getElementById('installBar');
    if(oldGate) oldGate.style.display='none';
    if(oldBar) oldBar.style.display='none';
    if(standalone()) return;
    const top=document.createElement('button');
    top.id='installTop'; top.type='button'; top.textContent='⬇ 앱 설치'; top.setAttribute('aria-label','우리집 앱 설치');
    top.style.cssText='position:fixed;top:calc(6px + env(safe-area-inset-top,0px));right:8px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(12,116,128,.35);border-radius:9px;background:rgba(255,255,255,.94);color:#0C7480;font-weight:700;font-size:12px;z-index:1000;padding:0 10px;box-shadow:0 1px 4px rgba(0,0,0,.08)';
    document.body.prepend(top);
    top.addEventListener('click',install);
    refresh();
  });
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
})();
