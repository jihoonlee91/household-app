(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20261003-3', LOCAL_APP='houseplan';
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const loadMobileUi=()=>{if(document.getElementById('hh-mobile-ui'))return;const s=document.createElement('script');s.id='hh-mobile-ui';s.src='./mobile-ui.js?v='+META_VER;s.defer=true;document.head.appendChild(s);};
  const loadShare=()=>{if(document.getElementById('hh-share-js'))return;const s=document.createElement('script');s.id='hh-share-js';s.src='./share.js?v='+META_VER;s.defer=true;document.head.appendChild(s);};
  loadMobileUi();loadShare();
  const buttons=()=>['installGate','installBar'].map(id=>document.getElementById(id)).filter(Boolean);
  function refresh(){const installed=standalone();buttons().forEach(b=>{b.hidden=installed;b.style.display=installed?'none':'';});}
  function addShareButtons(){
    if(!document.getElementById('hh-share-shell-style')){const s=document.createElement('style');s.id='hh-share-shell-style';s.textContent='@media(min-width:1100px){#bar #shareBar{width:100%;border-color:var(--accent);color:var(--accent);font-weight:700}html.side-mini #shareBar{display:none!important}}';document.head.appendChild(s);}
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
  function injectHousingNav(){
    const pick=document.getElementById('pick');
    if(pick&&!pick.querySelector('option[value="'+LOCAL_APP+'"]')){const o=document.createElement('option');o.value=LOCAL_APP;o.textContent='🏠 주거 전략';const sim=pick.querySelector('option[value="sim"]');sim?sim.after(o):pick.appendChild(o);}
    const tabs=document.getElementById('tabsbar');
    if(tabs&&!tabs.querySelector('[data-app="'+LOCAL_APP+'"]')){const sim=tabs.querySelector('[data-app="sim"]'),b=document.createElement('button');b.type='button';b.dataset.app=LOCAL_APP;b.style.setProperty('--gc','#0C7480');b.title='주거 전략';b.innerHTML='<i class="ti">🏘️</i><span class="ln">주거 전략</span>';sim?sim.after(b):tabs.appendChild(b);}
    const all=document.getElementById('allList');
    if(all&&!all.querySelector('[data-app="'+LOCAL_APP+'"]')){const sim=all.querySelector('[data-app="sim"]'),b=document.createElement('button');b.type='button';b.dataset.app=LOCAL_APP;b.innerHTML='<i>🏘️</i>주거 전략';if(sim){sim.after(b)}else{const box=all.querySelector('.al');box&&box.appendChild(b)}}
    const tiles=document.getElementById('tiles');
    if(tiles&&!tiles.querySelector('[data-app="'+LOCAL_APP+'"]')){const sim=tiles.querySelector('.tile[data-app="sim"]'),b=document.createElement('button');b.type='button';b.className='tile';b.dataset.app=LOCAL_APP;b.innerHTML='<div class="ic" aria-hidden="true">🏘️</div><b>주거 전략</b><span class="d">2027 동센자 · 2029 동센자 · 2031 옥수 매수 시나리오와 기회비용</span><span>3개 매수 시나리오 비교</span>';sim?sim.after(b):tiles.appendChild(b);}
  }
  async function openHousing(fromPop){
    const pick=document.getElementById('pick'),home=document.getElementById('home'),frame=document.getElementById('app'),bar=document.getElementById('bar'),gate=document.getElementById('gate');
    injectHousingNav(); if(pick)pick.value=LOCAL_APP;
    try{if(window.__hh&&typeof window.simSnapshot==='function')window.__hh.snapshot=await window.simSnapshot();}catch(e){console.warn(e)}
    if(home)home.style.display='none'; if(gate)gate.style.display='none'; if(bar)bar.style.display='flex';
    document.documentElement.classList.add('authed','authed-app'); document.title='주거 전략 · 상지홈';
    if(frame){frame.style.display='block';try{const r=await fetch('./sim.html?v='+META_VER,{cache:'no-store'});if(!r.ok)throw new Error('sim.html '+r.status);frame.srcdoc=await r.text();}catch(e){frame.srcdoc='<p style="padding:20px">주거 전략 화면을 불러오지 못했습니다.</p>';console.warn(e)}}
    if(!fromPop){if(history.state&&history.state.app)history.replaceState({app:LOCAL_APP},'','?app='+LOCAL_APP);else{history.replaceState({home:1},'',location.pathname);history.pushState({app:LOCAL_APP},'','?app='+LOCAL_APP)}}
    setTimeout(()=>{try{window.syncTabs&&window.syncTabs()}catch(e){}},0);
  }
  function installHousingHook(){
    if(typeof window.openApp!=='function'||window.openApp.__hhHousing)return false;
    const old=window.openApp;
    const wrapped=async function(app,fromPop){if(app===LOCAL_APP)return openHousing(fromPop);return old(app,fromPop)};wrapped.__hhHousing=true;window.openApp=wrapped;
    injectHousingNav();
    const want=new URLSearchParams(location.search).get('app');if(want===LOCAL_APP)setTimeout(()=>openHousing(true),0);
    return true;
  }
  function keepInjected(){injectHousingNav();installHousingHook()}
  window.hhInstallApp=install;
  window.addEventListener('DOMContentLoaded',()=>{refreshMetadata();addShareButtons();buttons().forEach(b=>b.addEventListener('click',install));refresh();setTimeout(keepInjected,0);});
  window.addEventListener('load',async()=>{addShareButtons();keepInjected();const mo=new MutationObserver(()=>injectHousingNav());['tabsbar','allList','tiles','pick'].forEach(id=>{const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})});if('serviceWorker' in navigator){try{const r=await navigator.serviceWorker.register('./sw.js?v='+META_VER,{updateViaCache:'none'});await r.update();}catch(e){console.warn(e);}}});
})();