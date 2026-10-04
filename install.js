(()=>{
  let promptEvent=null;
  const APP_NAME='상지홈', META_VER='20261004-5', LOCAL_APP='houseplan', WISH_APP='wishlist', PLANNER_APP='planner', CAR_APP='car';
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
    if(tiles&&!tiles.querySelector('[data-app="'+LOCAL_APP+'"]')){const sim=tiles.querySelector('.tile[data-app="sim"]'),b=document.createElement('button');b.type='button';b.className='tile';b.dataset.app=LOCAL_APP;b.innerHTML='<div class="ic" aria-hidden="true">🏘️</div><b>주거 전략</b><span class="d">27.2 전세 갱신 → 29.2 동센자 206동 40평 → 서울 갈아타기</span><span>중심 주거 시나리오</span>';sim?sim.after(b):tiles.appendChild(b);}
  }
  function injectWishlistNav(){
    const pick=document.getElementById('pick');
    if(pick&&!pick.querySelector('option[value="'+WISH_APP+'"]')){const o=document.createElement('option');o.value=WISH_APP;o.textContent='✨ 해보고 싶은 것들';const trips=pick.querySelector('option[value="trips"]');trips?trips.after(o):pick.appendChild(o);}
    const tabs=document.getElementById('tabsbar');
    if(tabs&&!tabs.querySelector('[data-app="'+WISH_APP+'"]')){const trips=tabs.querySelector('[data-app="trips"]'),b=document.createElement('button');b.type='button';b.dataset.app=WISH_APP;b.style.setProperty('--gc','#6E5AA6');b.title='해보고 싶은 것들';b.innerHTML='<i class="ti">✨</i><span class="ln">해보고 싶은 것들</span>';trips?trips.after(b):tabs.appendChild(b);}
    const all=document.getElementById('allList');
    if(all&&!all.querySelector('[data-app="'+WISH_APP+'"]')){const trips=all.querySelector('[data-app="trips"]'),b=document.createElement('button');b.type='button';b.dataset.app=WISH_APP;b.innerHTML='<i>✨</i>해보고 싶은 것들';if(trips){trips.after(b)}else{const boxes=all.querySelectorAll('.al'),box=boxes[Math.min(2,boxes.length-1)];box&&box.appendChild(b)}}
    const tiles=document.getElementById('tiles');
    if(tiles&&!tiles.querySelector('[data-app="'+WISH_APP+'"]')){const trips=tiles.querySelector('.tile[data-app="trips"]'),b=document.createElement('button');b.type='button';b.className='tile';b.dataset.app=WISH_APP;b.innerHTML='<div class="ic" aria-hidden="true">✨</div><b>해보고 싶은 것들</b><span class="d">여행·도전·운동·언어·취미 버킷리스트</span><span>추가하고 완료 체크</span>';trips?trips.after(b):tiles.appendChild(b);}
  }
  function injectPlannerNav(){
    const all=document.getElementById('allList');
    if(all&&!all.querySelector('[data-app="'+PLANNER_APP+'"]')){const anchor=all.querySelector('[data-app="'+WISH_APP+'"]')||all.querySelector('[data-app="trips"]'),b=document.createElement('button');b.type='button';b.dataset.app=PLANNER_APP;b.innerHTML='<i>🗓️</i>생활 계획';if(anchor)anchor.after(b);else{const boxes=all.querySelectorAll('.al'),box=boxes[Math.min(2,boxes.length-1)];box&&box.appendChild(b)}}
    const tabs=document.getElementById('tabsbar'),tb=tabs&&tabs.querySelector('[data-app="'+PLANNER_APP+'"]'),ta=tabs&&(tabs.querySelector('[data-app="'+WISH_APP+'"]')||tabs.querySelector('[data-app="trips"]'));
    if(tb&&ta&&tb.dataset.hhPlaced!=='1'){
      ta.after(tb);tb.dataset.hhPlaced='1';tb.style.setProperty('--gc','#6E5AA6');tb.title='생활 계획';const i=tb.querySelector('.ti'),n=tb.querySelector('.ln');if(i)i.textContent='🗓️';if(n)n.textContent='생활 계획';
      const other=[...tabs.querySelectorAll('.tg')].find(g=>g.textContent.trim()==='기타');if(other){let x=other.nextElementSibling,has=false;while(x&&!x.matches('.tg')){if(x.matches('button[data-app]')){has=true;break}x=x.nextElementSibling}if(!has)other.remove()}
    }
    const tiles=document.getElementById('tiles'),pb=tiles&&tiles.querySelector('.tile[data-app="'+PLANNER_APP+'"]'),pa=tiles&&(tiles.querySelector('.tile[data-app="'+WISH_APP+'"]')||tiles.querySelector('.tile[data-app="trips"]'));
    if(pb&&pa&&pb.dataset.hhPlaced!=='1'){
      const old=pb.parentElement;pa.after(pb);pb.dataset.hhPlaced='1';const ic=pb.querySelector('.ic'),d=pb.querySelector('.d');if(ic)ic.textContent='🗓️';if(d)d.textContent='중요 일정·주거 로드맵·자산 마일스톤·생활 예산·앞으로 갈 여행';
      if(old&&old!==pb.parentElement&&!old.querySelector('.tile')){const h=old.previousElementSibling;if(h&&h.classList.contains('grp')&&h.textContent.trim()==='기타')h.remove();old.remove()}
    }
  }
  function injectCarNav(){
    const pick=document.getElementById('pick');
    if(pick&&!pick.querySelector('option[value="'+CAR_APP+'"]')){const o=document.createElement('option');o.value=CAR_APP;o.textContent='🚙 차량 관리';const items=pick.querySelector('option[value="items"]');items?items.after(o):pick.appendChild(o);}
    const tabs=document.getElementById('tabsbar');
    if(tabs&&!tabs.querySelector('[data-app="'+CAR_APP+'"]')){const items=tabs.querySelector('[data-app="items"]'),b=document.createElement('button');b.type='button';b.dataset.app=CAR_APP;b.style.setProperty('--gc','#6E5AA6');b.title='차량 관리';b.innerHTML='<i class="ti">🚙</i><span class="ln">차량 관리</span>';items?items.after(b):tabs.appendChild(b);}
    const all=document.getElementById('allList');
    if(all&&!all.querySelector('[data-app="'+CAR_APP+'"]')){const items=all.querySelector('[data-app="items"]'),b=document.createElement('button');b.type='button';b.dataset.app=CAR_APP;b.innerHTML='<i>🚙</i>차량 관리';if(items)items.after(b);else{const boxes=all.querySelectorAll('.al'),box=boxes[Math.min(2,boxes.length-1)];box&&box.appendChild(b)}}
    const tiles=document.getElementById('tiles');
    if(tiles&&!tiles.querySelector('[data-app="'+CAR_APP+'"]')){const items=tiles.querySelector('.tile[data-app="items"]'),b=document.createElement('button');b.type='button';b.className='tile';b.dataset.app=CAR_APP;b.innerHTML='<div class="ic" aria-hidden="true">🚙</div><b>차량 관리</b><span class="d">싼타페 TM 정비·보험·검사·비용·Drive 문서와 GV80급 교체계획</span><span>현재차 싼타페 TM</span>';items?items.after(b):tiles.appendChild(b);}
  }
  function prepareLocal(app,title){
    const pick=document.getElementById('pick'),home=document.getElementById('home'),frame=document.getElementById('app'),bar=document.getElementById('bar'),gate=document.getElementById('gate');
    injectHousingNav();injectWishlistNav();injectPlannerNav();injectCarNav();if(pick)pick.value=app;
    if(home)home.style.display='none';if(gate)gate.style.display='none';if(bar)bar.style.display='flex';
    document.documentElement.classList.add('authed','authed-app');document.title=title+' · 상지홈';
    return frame;
  }
  function pushLocalHistory(app,fromPop){
    if(fromPop)return;
    if(history.state&&history.state.app)history.replaceState({app},'','?app='+app);else{history.replaceState({home:1},'',location.pathname);history.pushState({app},'','?app='+app)}
  }
  async function openLocalFile(app,title,file,fromPop){
    const frame=prepareLocal(app,title);
    if(frame){frame.style.display='block';try{const r=await fetch('./'+file+'?v='+META_VER,{cache:'no-store'});if(!r.ok)throw new Error(file+' '+r.status);frame.srcdoc=await r.text();}catch(e){frame.srcdoc='<p style="padding:20px">'+title+' 화면을 불러오지 못했습니다.</p>';console.warn(e)}}
    pushLocalHistory(app,fromPop);setTimeout(()=>{try{window.syncTabs&&window.syncTabs()}catch(e){}},0);
  }
  async function openHousing(fromPop){
    try{if(window.__hh&&typeof window.simSnapshot==='function')window.__hh.snapshot=await window.simSnapshot();}catch(e){console.warn(e)}
    return openLocalFile(LOCAL_APP,'주거 전략','sim.html',fromPop);
  }
  async function openWishlist(fromPop){return openLocalFile(WISH_APP,'해보고 싶은 것들','wishlist.html',fromPop);}
  async function openCar(fromPop){return openLocalFile(CAR_APP,'차량 관리','car.html',fromPop);}
  function installLocalHook(){
    if(typeof window.openApp!=='function'||window.openApp.__hhLocal)return false;
    const old=window.openApp;
    const wrapped=async function(app,fromPop){if(app===LOCAL_APP)return openHousing(fromPop);if(app===WISH_APP)return openWishlist(fromPop);if(app===CAR_APP)return openCar(fromPop);return old(app,fromPop)};wrapped.__hhLocal=true;window.openApp=wrapped;
    injectHousingNav();injectWishlistNav();injectPlannerNav();injectCarNav();
    const want=new URLSearchParams(location.search).get('app');if(want===LOCAL_APP)setTimeout(()=>openHousing(true),0);else if(want===WISH_APP)setTimeout(()=>openWishlist(true),0);else if(want===CAR_APP)setTimeout(()=>openCar(true),0);
    return true;
  }
  function keepInjected(){injectHousingNav();injectWishlistNav();injectPlannerNav();injectCarNav();installLocalHook()}
  let navRaf=0;
  function scheduleKeep(){if(navRaf)return;navRaf=requestAnimationFrame(()=>{navRaf=0;keepInjected()})}
  window.hhInstallApp=install;
  window.addEventListener('DOMContentLoaded',()=>{refreshMetadata();addShareButtons();buttons().forEach(b=>b.addEventListener('click',install));refresh();setTimeout(keepInjected,0);});
  window.addEventListener('load',async()=>{addShareButtons();keepInjected();const mo=new MutationObserver(scheduleKeep);['tabsbar','allList','tiles','pick'].forEach(id=>{const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})});if('serviceWorker' in navigator){try{const r=await navigator.serviceWorker.register('./sw.js?v='+META_VER,{updateViaCache:'none'});await r.update();}catch(e){console.warn(e);}}});
})();