(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20260928-5';
  const SB_URL='https://jdidzokxoaxqcnraowyu.supabase.co';
  const SB_KEY='sb_publishable_sgaob3nqRHgAaKBs_4yclw_-Wq7stKH';
  const AUTH_BACKUP='sangjihome-auth-v1';
  const AUTH_STORAGE='sangjihome-oauth-v1';
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
  function saveBackup(s){
    try{
      if(!s?.access_token||!s?.refresh_token) return;
      localStorage.setItem(AUTH_BACKUP,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||null}));
    }catch(_){}
  }
  function loadBackup(){
    try{const x=JSON.parse(localStorage.getItem(AUTH_BACKUP)||'null');return x?.access_token&&x?.refresh_token?x:null}catch(_){return null}
  }
  function clearBackup(){try{localStorage.removeItem(AUTH_BACKUP)}catch(_){} }
  async function setupAuth(){
    const login=document.getElementById('login'),msg=document.getElementById('msg');
    if(!login||!window.supabase) return;
    const main=window.__hh&&window.__hh.sb;
    const err=authErrorText();if(err&&msg)msg.textContent='로그인 오류: '+decodeURIComponent(err.replace(/\+/g,' '));
    const authClient=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:AUTH_STORAGE}});
    authClient.auth.onAuthStateChange((event,session)=>{if(session)saveBackup(session);else if(event==='SIGNED_OUT')clearBackup();});
    if(main){
      main.auth.onAuthStateChange((event,session)=>{
        if(session)saveBackup(session);
        else if(event==='SIGNED_OUT')clearBackup();
      });
    }
    try{
      const [{data:{session:oauthSession}},{data:{session:mainSession}}]=await Promise.all([
        authClient.auth.getSession(),
        main?main.auth.getSession():Promise.resolve({data:{session:null}})
      ]);
      if(oauthSession)saveBackup(oauthSession);
      if(mainSession)saveBackup(mainSession);
      const backup=loadBackup();
      const candidate=mainSession||oauthSession||backup;
      let restored=false;
      if(candidate&&main&&!mainSession){
        const {error}=await main.auth.setSession({access_token:candidate.access_token,refresh_token:candidate.refresh_token});
        if(error) throw error;
        saveBackup(candidate);
        restored=true;
      }
      const callback=!!location.hash||/[?&](code|error|error_description)=/.test(location.search);
      if(candidate&&(callback||restored)){
        history.replaceState({},'',location.pathname);
        if(sessionStorage.getItem('hh-auth-reloaded')!=='1'){
          sessionStorage.setItem('hh-auth-reloaded','1');
          location.reload();
          return;
        }
      }
      if(mainSession)sessionStorage.removeItem('hh-auth-reloaded');
    }catch(e){
      console.warn('OAuth/session recovery',e);
      if(msg&&!err)msg.textContent='로그인 세션 복구 실패: '+(e?.message||e);
    }
    login.onclick=async()=>{
      if(msg)msg.textContent='GitHub로 이동합니다…';
      sessionStorage.removeItem('hh-auth-reloaded');
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
