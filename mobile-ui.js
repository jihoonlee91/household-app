(()=>{
  const VER='20261005-5';
  const addCss=(doc,id,url)=>{if(!doc||doc.getElementById(id))return;const l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=url;(doc.head||doc.documentElement).appendChild(l)};
  const addScript=(doc,id,url)=>{if(!doc||doc.getElementById(id))return;const s=doc.createElement('script');s.id=id;s.src=url;s.defer=true;(doc.head||doc.documentElement).appendChild(s)};
  const shellUrl=new URL('./mobile-shell.css?v='+VER,location.href).href;
  const appUrl=new URL('./mobile-app.css?v='+VER,location.href).href;
  const delightCssUrl=new URL('./delight-shell.css?v='+VER,location.href).href;
  const delightJsUrl=new URL('./delight.js?v='+VER,location.href).href;
  const nativeAlert=window.alert.bind(window);
  window.alert=message=>{const s=String(message??'');if(/앱 설치|홈 화면|삼성 인터넷|Edge 메뉴|Safari|브라우저 메뉴/.test(s)&&typeof window.hhShowInstallGuide==='function')return window.hhShowInstallGuide(s);return nativeAlert(message)};
  const patchFrame=()=>{const f=document.getElementById('app');if(!f)return;try{const d=f.contentDocument;if(!d||!d.documentElement)return;if(!d.querySelector('meta[name="viewport"]')){const m=d.createElement('meta');m.name='viewport';m.content='width=device-width,initial-scale=1,viewport-fit=cover';(d.head||d.documentElement).appendChild(m)}addCss(d,'hh-mobile-app',appUrl)}catch(_){}};

  /* DB에 새 앱이 추가돼도 셸의 하드코딩된 GROUPS 때문에 모바일 '전체'에서 사라지지 않게 보정한다. */
  const NAV={
    payroll:{icon:'💵',label:'급여·공제',group:'돈',after:'company',color:'#0C7480'},
    income:{icon:'💰',label:'소득 비교',group:'돈',after:'payroll',color:'#0C7480'},
    tax:{icon:'🧮',label:'세금·연말정산',group:'돈',after:'income',color:'#0C7480'},
    career:{icon:'🧭',label:'커리어·이직',group:'돈',after:'tax',color:'#0C7480'},
    subscriptions:{icon:'🔁',label:'고정비·구독',group:'돈',after:'career',color:'#0C7480'},
    health:{icon:'❤️',label:'건강·운동',group:'생활',after:'items',color:'#6E5AA6'},
    insurance:{icon:'🛡️',label:'보험·보장',group:'생활',after:'health',color:'#6E5AA6'},
    documents:{icon:'📁',label:'문서·계약',group:'생활',after:'insurance',color:'#6E5AA6'},
    decisions:{icon:'⚖️',label:'의사결정',group:'생활',after:'documents',color:'#6E5AA6'},
    macrodroid:{icon:'📡',label:'알림 수신 상태',group:'설정',after:'connect',color:'#5D6A75'}
  };
  const groupBox=(root,name)=>{const h=[...root.querySelectorAll('.ag')].find(x=>x.textContent.trim()===name);return h&&h.nextElementSibling&&h.nextElementSibling.classList.contains('al')?h.nextElementSibling:null};
  const tileBox=(root,name)=>{const h=[...root.querySelectorAll('.grp')].find(x=>x.textContent.trim()===name);return h&&h.nextElementSibling&&h.nextElementSibling.classList.contains('tiles')?h.nextElementSibling:null};
  function patchAppNav(){
    const pick=document.getElementById('pick');if(!pick||pick.options.length<2)return;
    const has=k=>!!pick.querySelector(`option[value="${k}"]`),all=document.getElementById('allList'),tabs=document.getElementById('tabsbar'),tiles=document.getElementById('tiles');
    for(const [k,m] of Object.entries(NAV)){
      if(!has(k))continue;
      if(tabs){const b=tabs.querySelector(`[data-app="${k}"]`);if(b){b.style.setProperty('--gc',m.color);b.title=m.label;const i=b.querySelector('.ti'),n=b.querySelector('.ln');if(i)i.textContent=m.icon;if(n)n.textContent=m.label;const a=tabs.querySelector(`[data-app="${m.after}"]`);if(a&&b.previousElementSibling!==a)a.after(b)}}
      if(all){let b=all.querySelector(`[data-app="${k}"]`),box=groupBox(all,m.group);if(!b&&box){b=document.createElement('button');b.type='button';b.dataset.app=k;b.innerHTML=`<i>${m.icon}</i>${m.label}`;const a=box.querySelector(`[data-app="${m.after}"]`);a?a.after(b):box.appendChild(b)}else if(b){const i=b.querySelector('i');if(i)i.textContent=m.icon;b.childNodes[b.childNodes.length-1].textContent=m.label}}
      if(tiles){const b=tiles.querySelector(`.tile[data-app="${k}"]`);if(b){const i=b.querySelector('.ic'),d=b.querySelector('.d');if(i)i.textContent=m.icon;if(d&&k==='income')d.textContent='내 총보상·전문직 분포·SK하이닉스와 10년 비교';if(d&&k==='macrodroid')d.textContent='MacroDroid 수신 상태와 결제 누락 의심 점검';const box=tileBox(tiles,m.group),a=box&&box.querySelector(`.tile[data-app="${m.after}"]`);if(box&&a&&b.previousElementSibling!==a)a.after(b)}}
    }
    /* 그 밖의 새 DB 앱도 최소한 모바일 전체 > 기타에 자동 노출한다. */
    if(all){const missing=[...pick.options].filter(o=>o.value&&o.value!=='home'&&!all.querySelector(`[data-app="${CSS.escape(o.value)}"]`));if(missing.length){let h=[...all.querySelectorAll('.ag')].find(x=>x.textContent.trim()==='기타'),box=h&&h.nextElementSibling;if(!h){h=document.createElement('div');h.className='ag';h.textContent='기타';box=document.createElement('div');box.className='al';all.append(h,box)}missing.forEach(o=>{const b=document.createElement('button');b.type='button';b.dataset.app=o.value;b.innerHTML=`<i>📄</i>${o.textContent.replace(/^\S+\s/,'')}`;box.appendChild(b)})}}
  }

  const bind=()=>{
    addCss(document,'hh-mobile-shell',shellUrl);addCss(document,'hh-delight-shell',delightCssUrl);addScript(document,'hh-delight-js',delightJsUrl);
    const f=document.getElementById('app');if(f)f.addEventListener('load',()=>{patchFrame();setTimeout(patchFrame,80)});
    const sh=document.getElementById('allSheet');
    if(sh){
      const panel=sh.querySelector('.sheet'),close=document.getElementById('allClose'),title=sh.querySelector('.sh b');let returnFocus=null,wasOpen=false;
      if(panel){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');if(title){title.id=title.id||'allSheetTitle';panel.setAttribute('aria-labelledby',title.id)}}
      const sync=()=>{const open=sh.classList.contains('open');document.body.style.overflow=open?'hidden':'';sh.setAttribute('aria-hidden',open?'false':'true');if(open&&!wasOpen){returnFocus=document.activeElement;requestAnimationFrame(()=>close?.focus({preventScroll:true}))}else if(!open&&wasOpen){const back=returnFocus;returnFocus=null;if(back&&back.isConnected)requestAnimationFrame(()=>{try{back.focus({preventScroll:true})}catch(_){back.focus()}})}wasOpen=open};
      new MutationObserver(sync).observe(sh,{attributes:true,attributeFilter:['class']});
      document.addEventListener('keydown',e=>{if(!sh.classList.contains('open'))return;if(e.key==='Escape'){sh.classList.remove('open');sync();return}if(e.key==='Tab'&&panel){const fs=[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);if(!fs.length)return;const first=fs[0],last=fs[fs.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
      sync();
    }
    let queued=false;const scheduleNav=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;patchAppNav()},0)};
    ['pick','tabsbar','allList','tiles'].forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(scheduleNav).observe(el,{childList:true,subtree:true})});
    patchFrame();patchAppNav();setTimeout(patchAppNav,250);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();