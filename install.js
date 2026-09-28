(()=>{
  let promptEvent=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const buttons=()=>[document.getElementById('installTop')].filter(Boolean);
  function refresh(){buttons().forEach(b=>{b.hidden=standalone();b.textContent=standalone()?'설치됨':'⬇ 앱 설치';});}
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
    const top=document.createElement('button');
    top.id='installTop'; top.type='button'; top.textContent='⬇ 앱 설치'; top.setAttribute('aria-label','우리집 앱 설치');
    top.style.cssText='position:fixed;top:0;left:0;right:0;width:100%;height:44px;border:0;border-radius:0;background:#0C7480;color:#fff;font-weight:800;font-size:14px;z-index:1000;box-shadow:0 1px 6px rgba(0,0,0,.18);padding-top:env(safe-area-inset-top,0px)';
    document.body.prepend(top);
    const s=document.createElement('style');
    s.textContent='#bar{top:44px!important}#home{padding-top:calc(98px + env(safe-area-inset-top,0px))!important}#app{top:calc(83px + env(safe-area-inset-top,0px))!important;height:calc(100% - 83px - env(safe-area-inset-top,0px))!important}#gate{padding-top:60px!important}';
    document.head.appendChild(s);
    top.addEventListener('click',install);
    refresh();
  });
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
})();
