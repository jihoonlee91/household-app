(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20260929-1';
  const SB_URL='https://jdidzokxoaxqcnraowyu.supabase.co';
  const SB_KEY='sb_publishable_sgaob3nqRHgAaKBs_4yclw_-Wq7stKH';
  const AUTH_CHANNEL='sangjihome-auth';
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
  function authReturn(){
    const q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.replace(/^#/,''));
    return q.get('oauth')==='1'||q.has('code')||q.has('error')||q.has('error_description')||h.has('access_token')||h.has('error')||h.has('error_description');
  }
  async function setupAuth(){
    const login=document.getElementById('login'),msg=document.getElementById('msg');
    if(!login||!window.supabase) return;
    const err=authErrorText();if(err&&msg)msg.textContent='로그인 오류: '+decodeURIComponent(err.replace(/\+/g,' '));
    const main=window.__hh&&window.__hh.sb;
    const authClient=main||window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'implicit',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

    const acceptSession=async payload=>{
      if(!payload||payload.type!==AUTH_CHANNEL||!payload.access_token||!payload.refresh_token) return false;
      try{
        const {error}=await authClient.auth.setSession({access_token:payload.access_token,refresh_token:payload.refresh_token});
        if(error) throw error;
        if(msg) msg.textContent='로그인 완료';
        return true;
      }catch(e){
        console.warn('OAuth handoff',e);
        if(msg) msg.textContent='로그인 세션 연결 실패: '+(e?.message||e);
        return false;
      }
    };

    window.addEventListener('message',e=>{
      if(e.origin!==location.origin) return;
      acceptSession(e.data);
    });
    let channel=null;
    try{
      channel=new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage=e=>acceptSession(e.data);
    }catch(_){ }

    try{
      const {data:{session}}=await authClient.auth.getSession();
      if(session&&authReturn()){
        const payload={type:AUTH_CHANNEL,access_token:session.access_token,refresh_token:session.refresh_token};
        let handedOff=false;
        try{
          if(window.opener&&!window.opener.closed){window.opener.postMessage(payload,location.origin);handedOff=true;}
        }catch(_){ }
        try{if(channel){channel.postMessage(payload);handedOff=true;}}catch(_){ }
        if(handedOff&&!standalone()){
          if(msg)msg.textContent='로그인 완료. 상지홈으로 돌아갑니다…';
          history.replaceState({},'',location.pathname);
          setTimeout(()=>{try{window.close();}catch(_){}},120);
          return;
        }
        if(location.hash||/[?&](oauth|code|error|error_description)=/.test(location.search)){
          history.replaceState({},'',location.pathname);
        }
      }
    }catch(e){console.warn('OAuth recovery',e);if(msg&&!err)msg.textContent='로그인 세션 확인 실패: '+(e?.message||e);}

    login.onclick=async()=>{
      if(msg)msg.textContent='GitHub 로그인 창을 여는 중…';
      let popup=null;
      try{popup=window.open('about:blank','sangjihome-oauth');}catch(_){ }
      const redirectTo=location.origin+location.pathname+'?oauth=1';
      const {data,error}=await authClient.auth.signInWithOAuth({provider:'github',options:{redirectTo,skipBrowserRedirect:true}});
      if(error||!data||!data.url){
        try{if(popup)popup.close();}catch(_){ }
        if(msg)msg.textContent='로그인 오류: '+(error?.message||'OAuth URL을 만들지 못했습니다.');
        return;
      }
      if(popup){
        try{popup.location.replace(data.url);popup.focus();if(msg)msg.textContent='GitHub 인증 후 자동으로 앱에 로그인됩니다.';return;}catch(_){ }
      }
      location.href=data.url;
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
