(()=>{
  let promptEvent=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const buttons=()=>[document.getElementById('installGate'),document.getElementById('installBar')].filter(Boolean);
  function refresh(){buttons().forEach(b=>{b.hidden=standalone();b.textContent=standalone()?'설치됨':'앱 설치';});}
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
  window.addEventListener('DOMContentLoaded',()=>{buttons().forEach(b=>b.addEventListener('click',install));refresh();});
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
})();
