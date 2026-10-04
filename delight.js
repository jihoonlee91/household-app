(()=>{
  if(window.__hhDelightInstalled)return;window.__hhDelightInstalled=true;
  const $=s=>document.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const COLORS={ledger:'#0C7480',assets:'#6E5AA6',company:'#2F5D8A',payroll:'#2F5D8A',dashboard:'#2F5D8A',investments:'#6E5AA6',sim:'#6E5AA6',realestate:'#0C7480',apply:'#0C7480',planner:'#6E5AA6',houseplan:'#0C7480',items:'#A8620B',gifts:'#C06A30',holidays:'#C06A30',trips:'#C06A30',wishlist:'#6E5AA6',races:'#C06A30',life:'#2F5D8A',family:'#2F5D8A',wedding:'#C06A30',connect:'#64727D',settlements:'#64727D'};
  const ICON={home:'🏠',ledger:'🧾',assets:'🏦',company:'🏢',payroll:'💼',dashboard:'📌',investments:'📊',sim:'📈',realestate:'🏠',apply:'📝',planner:'🗓️',houseplan:'🏘️',items:'🛋️',gifts:'🎁',holidays:'🧧',trips:'✈️',wishlist:'✨',races:'🏃',life:'🧭',family:'🌳',wedding:'💍',connect:'🔌',settlements:'✅'};
  const recentKey='hh-recent-apps';
  let toastTimer=0,busyTimer=0,commandIndex=0,commandItems=[];

  function ensureBase(){
    if(!$('#hh-progress'))document.body.insertAdjacentHTML('beforeend','<div id="hh-progress" aria-hidden="true"></div>');
    if(!$('#hh-net'))document.body.insertAdjacentHTML('beforeend','<div id="hh-net" role="status" aria-live="polite">오프라인 · 저장/동기화 기능이 제한될 수 있어요</div>');
    if(!$('#hh-shell-toast'))document.body.insertAdjacentHTML('beforeend','<div id="hh-shell-toast" role="status" aria-live="polite"><span class="hh-toast-msg"></span><button type="button" hidden></button></div>');
  }
  function toast(message,actionLabel,action){
    ensureBase();const t=$('#hh-shell-toast'),m=t.querySelector('.hh-toast-msg'),b=t.querySelector('button');m.textContent=message;b.hidden=!actionLabel;b.textContent=actionLabel||'';b.onclick=()=>{try{action&&action()}finally{t.classList.remove('on')}};clearTimeout(toastTimer);requestAnimationFrame(()=>t.classList.add('on'));toastTimer=setTimeout(()=>t.classList.remove('on'),actionLabel?6500:2600);
  }
  window.hhToast=toast;
  function setBusy(on){ensureBase();clearTimeout(busyTimer);if(on){document.documentElement.classList.add('hh-busy');busyTimer=setTimeout(()=>document.documentElement.classList.remove('hh-busy'),12000)}else document.documentElement.classList.remove('hh-busy')}

  function appTitle(app){
    const b=$(`#tabsbar [data-app="${CSS.escape(app)}"]`)||$(`#allList [data-app="${CSS.escape(app)}"]`)||$(`#tiles [data-app="${CSS.escape(app)}"]`);
    if(!b)return app;return (b.querySelector('.ln,b')?.textContent||b.textContent||app).replace(/\s+/g,' ').trim();
  }
  function appDesc(app){const t=$(`#tiles .tile[data-app="${CSS.escape(app)}"] .d`);return t?.textContent?.replace(/\s+/g,' ').trim()||''}
  function getRecent(){try{return JSON.parse(localStorage.getItem(recentKey)||'[]').filter(x=>typeof x==='string')}catch(_){return[]}}
  function remember(app){if(!app||app==='home')return;const next=[app,...getRecent().filter(x=>x!==app)].slice(0,5);try{localStorage.setItem(recentKey,JSON.stringify(next))}catch(_){}renderRecent()}
  function navigate(app){
    const pick=$('#pick');if(pick)pick.value=app;if(app==='home')window.openHome?.();else window.openApp?.(app);window.syncTabs?.();remember(app);closeCommand();
  }
  function recentRow(id){
    const apps=getRecent().filter(a=>$(`[data-app="${CSS.escape(a)}"]`));if(!apps.length)return null;const row=document.createElement('div');row.id=id;row.className='hh-recent';row.innerHTML='<span class="hh-rlabel">최근</span>'+apps.map(a=>`<button type="button" data-hh-recent="${esc(a)}"><i>${ICON[a]||'•'}</i>${esc(appTitle(a))}</button>`).join('');row.addEventListener('click',e=>{const b=e.target.closest('[data-hh-recent]');if(b)navigate(b.dataset.hhRecent)});return row
  }
  function renderRecent(){
    $('#hh-recent-home')?.remove();const h=recentRow('hh-recent-home'),sub=$('#hsub');if(h&&sub)sub.after(h);
    $('#hh-recent-all')?.remove();const a=recentRow('hh-recent-all'),search=$('#hh-all-search-wrap');if(a&&search)search.after(a);
  }

  function collectApps(){
    const map=new Map();all('#tabsbar [data-app],#allList [data-app],#tiles [data-app],#btm [data-app]').forEach(el=>{const app=el.dataset.app;if(!app||map.has(app))return;const title=appTitle(app),desc=appDesc(app);map.set(app,{app,title,desc,icon:ICON[app]||el.querySelector('i,.ic')?.textContent?.trim()||'•'})});
    if(!map.has('home'))map.set('home',{app:'home',title:'홈',desc:'상지홈 요약 화면',icon:'🏠'});return [...map.values()]
  }
  function ensureAllSearch(){
    const sh=$('#allSheet .sh');if(!sh||$('#hh-all-search-wrap'))return;const w=document.createElement('div');w.id='hh-all-search-wrap';w.innerHTML='<input id="hh-all-search" type="search" inputmode="search" autocomplete="off" placeholder="앱 검색" aria-label="전체 앱 검색">';sh.after(w);const input=w.firstElementChild;input.addEventListener('input',()=>filterAll(input.value));renderRecent()
  }
  function filterAll(q){
    q=String(q||'').trim().toLowerCase();all('#allList .al').forEach(box=>{let visible=0;all('button[data-app]',box).forEach(b=>{const hay=(b.textContent+' '+(b.dataset.app||'')+' '+appDesc(b.dataset.app||'')).toLowerCase(),show=!q||hay.includes(q);b.classList.toggle('hh-filter-hide',!show);if(show)visible++});const head=box.previousElementSibling;if(head?.classList.contains('ag'))head.classList.toggle('hh-filter-hide',visible===0);box.classList.toggle('hh-filter-hide',visible===0)})
  }

  function ensureCommand(){
    if($('#hh-command'))return;const d=document.createElement('div');d.id='hh-command';d.setAttribute('aria-hidden','true');d.innerHTML='<div class="hh-cmd-box" role="dialog" aria-modal="true" aria-label="앱 빠른 실행"><div class="hh-cmd-head"><span>⌕</span><input type="search" autocomplete="off" placeholder="앱 이름이나 기능 검색"><kbd>ESC</kbd></div><div class="hh-cmd-list"></div></div>';document.body.appendChild(d);d.addEventListener('mousedown',e=>{if(e.target===d)closeCommand()});const input=d.querySelector('input');input.addEventListener('input',()=>renderCommand(input.value));d.querySelector('.hh-cmd-list').addEventListener('click',e=>{const b=e.target.closest('[data-app]');if(b)navigate(b.dataset.app)})
  }
  function renderCommand(q=''){
    ensureCommand();q=q.trim().toLowerCase();const recent=getRecent();commandItems=collectApps().map(x=>({...x,rank:recent.indexOf(x.app)})).filter(x=>!q||(x.title+' '+x.app+' '+x.desc).toLowerCase().includes(q)).sort((a,b)=>{const ar=a.rank<0?99:a.rank,br=b.rank<0?99:b.rank;return ar-br||a.title.localeCompare(b.title,'ko')});commandIndex=Math.min(commandIndex,Math.max(0,commandItems.length-1));const list=$('#hh-command .hh-cmd-list');list.innerHTML=commandItems.length?commandItems.map((x,i)=>`<button type="button" class="hh-cmd-item${i===commandIndex?' sel':''}" data-app="${esc(x.app)}"><span class="ic">${esc(x.icon)}</span><span><b>${esc(x.title)}</b><small>${esc(x.desc||'상지홈 앱')}</small></span><em>${recent.includes(x.app)?'최근':''}</em></button>`).join(''):'<div class="hh-cmd-empty">찾는 앱이 없습니다.</div>';list.querySelector('.sel')?.scrollIntoView({block:'nearest'})
  }
  function openCommand(){ensureCommand();const d=$('#hh-command');commandIndex=0;d.classList.add('open');d.setAttribute('aria-hidden','false');const input=d.querySelector('input');input.value='';renderCommand('');requestAnimationFrame(()=>input.focus())}
  function closeCommand(){const d=$('#hh-command');if(!d?.classList.contains('open'))return;d.classList.remove('open');d.setAttribute('aria-hidden','true')}
  window.hhOpenCommand=openCommand;

  function ensureInstallGuide(){
    if($('#hh-install-guide'))return;const d=document.createElement('div');d.id='hh-install-guide';d.setAttribute('aria-hidden','true');d.innerHTML='<section class="hh-guide" role="dialog" aria-modal="true" aria-labelledby="hh-guide-title"><h2 id="hh-guide-title">상지홈 설치</h2><p></p><div class="acts"><button type="button">확인</button></div></section>';document.body.appendChild(d);const close=()=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')};d.addEventListener('click',e=>{if(e.target===d||e.target.closest('.acts button'))close()});d._close=close
  }
  window.hhShowInstallGuide=message=>{ensureInstallGuide();const d=$('#hh-install-guide');d.querySelector('p').textContent=message;d.classList.add('open');d.setAttribute('aria-hidden','false');requestAnimationFrame(()=>d.querySelector('button').focus())};

  function decorateShell(){
    ensureBase();ensureAllSearch();renderRecent();all('#tiles .tile[data-app]').forEach(t=>t.style.setProperty('--tile-accent',COLORS[t.dataset.app]||'var(--accent)'));all('#btm button[data-app],#allList button[data-app]').forEach(b=>{const title=appTitle(b.dataset.app);if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',title);b.title=title})
  }
  function network(){ensureBase();const offline=!navigator.onLine;document.documentElement.classList.toggle('hh-offline',offline);if(!offline&&window.__hhWasOffline)toast('연결이 복구됐어요. 다시 동기화할 수 있습니다.');window.__hhWasOffline=offline}

  document.addEventListener('click',e=>{const b=e.target.closest('[data-app]');if(!b)return;const app=b.dataset.app;if(app&&app!=='home'){setBusy(true);remember(app)}} ,true);
  document.addEventListener('keydown',e=>{
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)||e.target?.isContentEditable;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand();return}
    const cmd=$('#hh-command');if(cmd?.classList.contains('open')){if(e.key==='Escape'){e.preventDefault();closeCommand()}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();commandIndex=(commandIndex+(e.key==='ArrowDown'?1:-1)+Math.max(1,commandItems.length))%Math.max(1,commandItems.length);renderCommand(cmd.querySelector('input').value)}else if(e.key==='Enter'&&document.activeElement===cmd.querySelector('input')&&commandItems[commandIndex]){e.preventDefault();navigate(commandItems[commandIndex].app)}return}
    if(e.key==='/'&&!typing&&innerWidth>=700){e.preventDefault();openCommand()}
    if(e.key==='Escape')$('#hh-install-guide')?._close?.()
  });
  window.addEventListener('online',network);window.addEventListener('offline',network);
  window.addEventListener('DOMContentLoaded',()=>{decorateShell();network();const st=$('#status');if(st)new MutationObserver(()=>{const txt=st.textContent||'';if(/불러오는 중|확인 중|로그인.*중|마무리 중/.test(txt))setBusy(true);else if(!txt)setBusy(false)}).observe(st,{childList:true,subtree:true,characterData:true});const f=$('#app');if(f)f.addEventListener('load',()=>{setBusy(false);const app=$('#pick')?.value;if(app&&app!=='home')remember(app)});const sheet=$('#allSheet');if(sheet)new MutationObserver(()=>{if(sheet.classList.contains('open')){ensureAllSearch();const s=$('#hh-all-search');if(s){s.value='';filterAll('')}}}).observe(sheet,{attributes:true,attributeFilter:['class']});const root=$('#tiles')||document.body;new MutationObserver(()=>requestAnimationFrame(decorateShell)).observe(root,{childList:true,subtree:true})});
  window.addEventListener('load',()=>{decorateShell();network();let hadController=!!navigator.serviceWorker?.controller;navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!hadController){hadController=true;return}toast('상지홈이 새 버전으로 업데이트됐어요.','적용',()=>location.reload())})});
})();