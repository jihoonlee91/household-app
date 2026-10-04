(()=>{
  const VER='20261004-2';
  const addCss=(doc,id,url)=>{if(!doc||doc.getElementById(id))return;const l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=url;(doc.head||doc.documentElement).appendChild(l)};
  const addScript=(doc,id,url)=>{if(!doc||doc.getElementById(id))return;const s=doc.createElement('script');s.id=id;s.src=url;s.defer=true;(doc.head||doc.documentElement).appendChild(s)};
  const shellUrl=new URL('./mobile-shell.css?v='+VER,location.href).href;
  const appUrl=new URL('./mobile-app.css?v='+VER,location.href).href;
  const delightCssUrl=new URL('./delight-shell.css?v='+VER,location.href).href;
  const delightJsUrl=new URL('./delight.js?v='+VER,location.href).href;
  const patchFrame=()=>{const f=document.getElementById('app');if(!f)return;try{const d=f.contentDocument;if(!d||!d.documentElement)return;if(!d.querySelector('meta[name="viewport"]')){const m=d.createElement('meta');m.name='viewport';m.content='width=device-width,initial-scale=1,viewport-fit=cover';(d.head||d.documentElement).appendChild(m)}addCss(d,'hh-mobile-app',appUrl)}catch(_){}};
  const bind=()=>{
    addCss(document,'hh-mobile-shell',shellUrl);addCss(document,'hh-delight-shell',delightCssUrl);addScript(document,'hh-delight-js',delightJsUrl);
    const f=document.getElementById('app');if(f)f.addEventListener('load',()=>{patchFrame();setTimeout(patchFrame,80)});
    const sh=document.getElementById('allSheet');
    if(sh){
      const panel=sh.querySelector('.sheet'),close=document.getElementById('allClose'),title=sh.querySelector('.sh b');let returnFocus=null,wasOpen=false;
      if(panel){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');if(title){title.id=title.id||'allSheetTitle';panel.setAttribute('aria-labelledby',title.id)}}
      const sync=()=>{const open=sh.classList.contains('open');document.body.style.overflow=open?'hidden':'';sh.setAttribute('aria-hidden',open?'false':'true');if(open&&!wasOpen){returnFocus=document.activeElement;requestAnimationFrame(()=>close?.focus({preventScroll:true}))}else if(!open&&wasOpen){const back=returnFocus;returnFocus=null;if(back&&back.isConnected)requestAnimationFrame(()=>{try{back.focus({preventScroll:true})}catch(_){back.focus()}})}wasOpen=open};
      new MutationObserver(sync).observe(sh,{attributes:true,attributeFilter:['class']});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sh.classList.contains('open')){sh.classList.remove('open');sync()}});
      sync();
    }
    patchFrame();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();