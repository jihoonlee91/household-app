(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20260929-2';
  const SB_URL='https://jdidzokxoaxqcnraowyu.supabase.co';
  const SB_KEY='sb_publishable_sgaob3nqRHgAaKBs_4yclw_-Wq7stKH';
  const AUTH_TYPE='sangjihome-auth';
  const AUTH_CHANNEL_PREFIX='sangjihome-auth-';
  const AUTH_PENDING_KEY='hh-oauth-handoff';
  const AUTH_TTL_MS=10*60*1000;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const buttons=()=>[document.getElementById('installTop')].filter(Boolean);
  const validNonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,128}$/.test(s);
  const makeNonce=()=>{
    const b=new Uint8Array(24);crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  const getPending=()=>{
    try{
      const x=JSON.parse(sessionStorage.getItem(AUTH_PENDING_KEY)||'null');
      if(!x||!validNonce(x.nonce)||!Number.isFinite(x.at)||Date.now()-x.at>AUTH_TTL_MS){sessionStorage.removeItem(AUTH_PENDING_KEY);return null;}
      return x;
    }catch(_){try{sessionStorage.removeItem(AUTH_PENDING_KEY)}catch(__){}return null;}
  };
  const setPending=nonce=>{try{sessionStorage.setItem(AUTH_PENDING_KEY,JSON.stringify({nonce,at:Date.now()}))}catch(_){}};
  const clearPending=nonce=>{try{const x=getPending();if(!nonce||!x||x.nonce===nonce)sessionStorage.removeItem(AUTH_PENDING_KEY)}catch(_){}};
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
    let channel=null, authPopup=null, listeningNonce=null;
    const closeChannel=()=>{try{if(channel)channel.close()}catch(_){}channel=null;listeningNonce=null;};
    const acceptSession=async(payload,expectedNonce)=>{
      if(!validNonce(expectedNonce)||!payload||payload.type!==AUTH_TYPE||payload.nonce!==expectedNonce||!payload.access_token||!payload.refresh_token) return false;
      try{
        const {error}=await authClient.auth.setSession({access_token:payload.access_token,refresh_token:payload.refresh_token});
        if(error) throw error;
        clearPending(expectedNonce);closeChannel();
        try{if(authPopup&&!authPopup.closed)authPopup.close()}catch(_){}
        if(msg) msg.textContent='로그인 완료';
        return true;
      }catch(e){
        console.warn('OAuth handoff failed',e);
        if(msg) msg.textContent='로그인 세션 연결 실패: '+(e?.message||e);
        return false;
      }
    };
    const listenFor=nonce=>{
      if(!validNonce(nonce)||listeningNonce===nonce)return;
      closeChannel();listeningNonce=nonce;
      try{channel=new BroadcastChannel(AUTH_CHANNEL_PREFIX+nonce);channel.onmessage=e=>acceptSession(e.data,nonce);}catch(_){}
    };
    const pending=getPending();if(pending)listenFor(pending.nonce);
    window.addEventListener('message',e=>{
      if(e.origin!==location.origin)return;
      const p=getPending();if(!p)return;
      if(authPopup&&e.source!==authPopup)return;
      acceptSession(e.data,p.nonce);
    });
    try{
      const {data:{session}}=await authClient.auth.getSession();
      if(session&&authReturn()){
        const q=new URLSearchParams(location.search),nonce=q.get('handoff')||'';
        history.replaceState({},'',location.pathname);
        if(!validNonce(nonce)){
          if(!standalone()&&msg)msg.textContent='로그인 복귀 정보가 유효하지 않습니다. 앱에서 다시 로그인해 주세요.';
          return;
        }
        const payload={type:AUTH_TYPE,nonce,access_token:session.access_token,refresh_token:session.refresh_token};
        let handedOff=false;
        try{if(window.opener&&!window.opener.closed){window.opener.postMessage(payload,location.origin);handedOff=true;}}catch(_){}
        try{const c=new BroadcastChannel(AUTH_CHANNEL_PREFIX+nonce);c.postMessage(payload);c.close();handedOff=true;}catch(_){}
        if(handedOff&&!standalone()){
          if(msg)msg.textContent='로그인 완료. 상지홈으로 돌아갑니다…';
          setTimeout(()=>{try{window.close()}catch(_){}},120);
          return;
        }
      }
    }catch(e){console.warn('OAuth recovery',e);if(msg&&!err)msg.textContent='로그인 세션 확인 실패: '+(e?.message||e);}
    login.onclick=async()=>{
      if(msg)msg.textContent='GitHub 로그인 창을 여는 중…';
      const nonce=makeNonce();setPending(nonce);listenFor(nonce);
      try{authPopup=window.open('about:blank','sangjihome-oauth');}catch(_){authPopup=null;}
      const redirectTo=location.origin+location.pathname+'?oauth=1&handoff='+encodeURIComponent(nonce);
      const {data,error}=await authClient.auth.signInWithOAuth({provider:'github',options:{redirectTo,skipBrowserRedirect:true}});
      if(error||!data||!data.url){
        clearPending(nonce);closeChannel();
        try{if(authPopup)authPopup.close()}catch(_){}
        if(msg)msg.textContent='로그인 오류: '+(error?.message||'OAuth URL을 만들지 못했습니다.');
        return;
      }
      if(authPopup){
        try{authPopup.location.replace(data.url);authPopup.focus();if(msg)msg.textContent='GitHub 인증 후 자동으로 앱에 로그인됩니다.';return;}catch(_){}
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
