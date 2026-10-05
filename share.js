(()=>{
  const VER=window.HH_VER||'dev';
  let loader=null;
  const loadCanvas=()=>{
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    if(loader) return loader;
    loader=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.crossOrigin='anonymous'; s.onload=()=>resolve(window.html2canvas); s.onerror=reject; document.head.appendChild(s);
    });
    return loader;
  };
  const safeName=s=>String(s||'상지홈').replace(/[\\/:*?"<>|]+/g,' ').trim().replace(/\s+/g,'-').slice(0,70);
  const bgOf=(doc,el)=>{const s=(doc.defaultView||window).getComputedStyle(el); return s.backgroundColor&&s.backgroundColor!=='rgba(0, 0, 0, 0)'?s.backgroundColor:(doc.documentElement.getAttribute('data-theme')==='dark'?'#0E1419':'#F3F5F6');};
  async function raster(target,opts={}){
    const html2canvas=await loadCanvas();
    const doc=target.ownerDocument, win=doc.defaultView||window;
    const rect=target.getBoundingClientRect();
    const isBody=target===doc.body||target===doc.documentElement;
    const full=opts.full===true;
    const width=Math.max(320,Math.ceil(full?(doc.documentElement.scrollWidth||rect.width):rect.width));
    const viewportH=Math.max(480,doc.documentElement.clientHeight||win.innerHeight||rect.height);
    const height=Math.max(320,Math.ceil(full?Math.min(doc.documentElement.scrollHeight,viewportH*2.4):Math.min(rect.height||viewportH,viewportH)));
    const oldScroll=win.scrollY||0;
    if(isBody&&!full) win.scrollTo(0,oldScroll);
    const c=await html2canvas(target,{backgroundColor:bgOf(doc,target),scale:Math.min(2,Math.max(1,1080/width)),useCORS:true,logging:false,width,height,windowWidth:width,windowHeight:height,scrollX:0,scrollY:isBody&&!full?-oldScroll:0,onclone:cloned=>{
      cloned.querySelectorAll('[data-no-share],#hhShareModal,.hh-share-inline').forEach(x=>x.remove());
    }});
    return c;
  }
  function fit(source,orientation='portrait'){
    const W=orientation==='landscape'?1920:1080, H=orientation==='landscape'?1080:1920, pad=orientation==='landscape'?52:46;
    const out=document.createElement('canvas'); out.width=W; out.height=H; const g=out.getContext('2d');
    const dark=document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);
    g.fillStyle=dark?'#0E1419':'#F3F5F6';g.fillRect(0,0,W,H);
    const scale=Math.min((W-pad*2)/source.width,(H-pad*2)/source.height); const w=source.width*scale,h=source.height*scale,x=(W-w)/2,y=(H-h)/2;
    g.drawImage(source,x,y,w,h);
    return out;
  }
  async function deliver(canvas,name){
    const blob=await new Promise(r=>canvas.toBlob(r,'image/png',0.96)); if(!blob) throw new Error('이미지 생성 실패');
    const filename=safeName(name)+'-'+new Date().toISOString().slice(0,10)+'.png';
    const file=new File([blob],filename,{type:'image/png'});
    if(navigator.canShare&&navigator.share&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:name||'상지홈 공유 이미지'});return}catch(e){if(e&&e.name==='AbortError')return;}
    }
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  }
  async function captureElement(target,opts={}){
    const src=await raster(target,{full:opts.full}); const out=fit(src,opts.orientation||'portrait'); await deliver(out,opts.name||document.title||'상지홈');
  }
  window.hhCaptureElement=captureElement;
  function targetForShell(){
    const frame=document.getElementById('app');
    if(frame&&getComputedStyle(frame).display!=='none'&&frame.contentDocument&&frame.contentDocument.body) return frame.contentDocument.body;
    return document.getElementById('home')||document.body;
  }
  function currentTitle(){
    const frame=document.getElementById('app');
    if(frame&&getComputedStyle(frame).display!=='none'&&frame.contentDocument) return (frame.contentDocument.title||document.title).replace(/\s*·\s*상지홈\s*$/,'');
    return '상지홈';
  }
  function ensureModal(){
    if(document.getElementById('hhShareModal'))return;
    const d=document.createElement('div');d.id='hhShareModal';d.hidden=true;d.setAttribute('data-no-share','');
    d.innerHTML='<div class="hhs-back"><div class="hhs-box"><b>공유 이미지</b><p>현재 화면을 한 장으로 저장하거나 바로 공유합니다.</p><div><button data-o="portrait">세로 1080×1920</button><button data-o="landscape">가로 1920×1080</button></div><label><input type="checkbox" id="hhsFull"> 긴 화면도 2.4화면까지 압축</label><button id="hhsClose">닫기</button></div></div>';
    const st=document.createElement('style');st.textContent='#hhShareModal[hidden]{display:none}#hhShareModal{position:fixed;inset:0;z-index:99}#hhShareModal .hhs-back{position:absolute;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:16px}#hhShareModal .hhs-box{width:min(380px,100%);background:var(--card,#fff);color:var(--ink,#15202a);border:1px solid var(--line,#d5dce0);border-radius:16px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25)}#hhShareModal b{font-size:17px}#hhShareModal p{margin:5px 0 14px;color:var(--muted,#667);font-size:13px}#hhShareModal .hhs-box>div{display:grid;grid-template-columns:1fr 1fr;gap:8px}#hhShareModal button{padding:10px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--card,#fff);color:inherit;font:inherit}#hhShareModal button[data-o]{border-color:var(--accent,#0c7480);color:var(--accent,#0c7480);font-weight:700}#hhShareModal label{display:block;margin:13px 0;color:var(--muted,#667);font-size:12px}#hhsClose{width:100%}';
    document.head.appendChild(st);document.body.appendChild(d);
    d.addEventListener('click',async e=>{
      if(e.target.classList.contains('hhs-back')||e.target.id==='hhsClose'){d.hidden=true;return}
      const b=e.target.closest('button[data-o]'); if(!b)return;
      b.disabled=true;const old=b.textContent;b.textContent='이미지 만드는 중…';
      try{await captureElement(targetForShell(),{orientation:b.dataset.o,full:document.getElementById('hhsFull').checked,name:currentTitle()})}catch(err){alert('공유 이미지 생성에 실패했습니다. '+(err.message||err))}finally{b.disabled=false;b.textContent=old;d.hidden=true}
    });
  }
  window.hhOpenShare=()=>{ensureModal();document.getElementById('hhShareModal').hidden=false;};
  window.hhShareVersion=VER;
})();