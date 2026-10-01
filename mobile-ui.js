(()=>{
  const VER='20261002-1';
  const addCss=(doc,id,url)=>{if(!doc||doc.getElementById(id))return;const l=doc.createElement('link');l.id=id;l.rel='stylesheet';l.href=url;(doc.head||doc.documentElement).appendChild(l)};
  const shellUrl=new URL('./mobile-shell.css?v='+VER,location.href).href;
  const appUrl=new URL('./mobile-app.css?v='+VER,location.href).href;
  const patchFrame=()=>{const f=document.getElementById('app');if(!f)return;try{const d=f.contentDocument;if(!d||!d.documentElement)return;if(!d.querySelector('meta[name="viewport"]')){const m=d.createElement('meta');m.name='viewport';m.content='width=device-width,initial-scale=1,viewport-fit=cover';(d.head||d.documentElement).appendChild(m)}addCss(d,'hh-mobile-app',appUrl)}catch(_){}};
  const bind=()=>{addCss(document,'hh-mobile-shell',shellUrl);const f=document.getElementById('app');if(f)f.addEventListener('load',()=>{patchFrame();setTimeout(patchFrame,80)});const sh=document.getElementById('allSheet');if(sh){const sync=()=>{document.body.style.overflow=sh.classList.contains('open')?'hidden':''};new MutationObserver(sync).observe(sh,{attributes:true,attributeFilter:['class']});sync()}patchFrame()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
