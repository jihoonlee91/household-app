(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20260928-4';
  const SB_URL='https://jdidzokxoaxqcnraowyu.supabase.co';
  const SB_KEY='sb_publishable_sgaob3nqRHgAaKBs_4yclw_-Wq7stKH';
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const buttons=()=>[document.getElementById('installTop')].filter(Boolean);
  function refresh(){const installed=standalone();buttons().forEach(b=>{b.hidden=installed;b.style.display=installed?'none':'inline-flex';});}
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
    else if(/chrome|crios/.test(ua)) alert('브라우저 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가를 선택하세요.');
    else alert('브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.');
  }
  function authErrorText(){const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.replace(/^#/,''));return q.get('error_description')||q.get('error')||h.get('error_description')||h.get('error')||'';}
  async function setupAuth(){
    const login=document.getElementById('login'),msg=document.getElementById('msg');
    if(!login||!window.supabase) return;
    const err=authErrorText();if(err&&msg)msg.textContent='로그인 오류: '+decodeURIComponent(err.replace(/\+/g,' '));
    const authClient=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'implicit',persistSession:true,detectSessionInUrl:true}});
    try{
      const {data:{session}}=await authClient.auth.getSession();
      if(session){
        const main=window.__hh&&window.__hh.sb;
        if(main){await main.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token});}
        if(location.hash||/[?&](code|error|error_description)=/.test(location.search)){history.replaceState({},'',location.pathname);location.reload();return;}
      }
    }catch(e){console.warn('OAuth recovery',e);}
    login.onclick=async()=>{
      if(msg)msg.textContent='GitHub로 이동합니다…';
      const {error}=await authClient.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}});
      if(error&&msg)msg.textContent='로그인 오류: '+error.message;
    };
  }
  window.hhInstallApp=install;
  window.addEventListener('DOMContentLoaded',()=>{
    refreshMetadata();
    const oldGate=document.getElementById('installGate'),oldBar=document.getElementById('installBar');
    if(oldGate) oldGate.style.display='none';if(oldBar) oldBar.style.display='none';
    if(!standalone()){
      const top=document.createElement('button');top.id='installTop';top.type='button';top.textContent='⬇ 앱 설치';top.setAttribute('aria-label',APP_NAME+' 앱 설치');
      top.style.cssText='position:fixed;top:calc(6px + env(safe-area-inset-top,0px));right:8px;height:30px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(12,116,128,.35);border-radius:9px;background:rgba(255,255,255,.94);color:#0C7480;font-weight:700;font-size:12px;z-index:1000;padding:0 10px;box-shadow:0 1px 4px rgba(0,0,0,.08)';
      document.body.prepend(top);top.addEventListener('click',install);refresh();
    }
  });
  window.addEventListener('load',async()=>{
    await setupAuth();
    if('serviceWorker' in navigator){try{const r=await navigator.serviceWorker.register('./sw.js?v='+META_VER,{updateViaCache:'none'});await r.update();}catch(e){console.warn(e);}}
  });
})();
