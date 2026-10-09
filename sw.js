const CACHE='sangjihome-shell-v43-gas';
/* 오프라인 대비 공개 셸 파일 (버전 쿼리는 무시하고 찾음) */
const SHELL=['./','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png','./apple-touch-icon.png','./install.js','./mobile-ui.js','./mobile-shell.css','./mobile-app.css','./delight-shell.css','./delight.js','./share.js','./sim.html','./sim-scenarios.css','./sim-scenarios.js','./wishlist.html','./car.html'];
const shellPaths=new Set(SHELL.map(path=>new URL(path,self.location.href).pathname));
/* 셸이 쓰는 외부 라이브러리(버전 고정)도 기기에 보관 → 인터넷 없이 다시 열어도 셸이 뜸 */
const CDN=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js'];
self.addEventListener('install',event=>{
  /* 파일 하나가 실패해도 설치는 계속 (addAll은 하나만 실패해도 전체 실패) */
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled([...SHELL,...CDN].map(u=>cache.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sangjihome-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET')return;
  if(CDN.includes(url.href)){ event.respondWith(caches.open(CACHE).then(async c=>(await c.match(request))||fetch(request).then(r=>{ if(r.ok) c.put(request,r.clone()).catch(()=>{}); return r; }))); return; }
  if(url.origin!==self.location.origin)return;
  // Only public shell files belong in the offline cache.
  if(request.mode!=='navigate'&&!shellPaths.has(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok&&response.type!=='opaque')await cache.put(request,response.clone()).catch(()=>{});
      return response;
    }catch(error){
      const fallback=await cache.match(request,{ignoreSearch:true})||(request.mode==='navigate'?await cache.match('./'):null);
      return fallback||new Response('오프라인 상태입니다. 연결 후 다시 시도해 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});

const PUSH_ACTION='https://jdidzokxoaxqcnraowyu.supabase.co/functions/v1/push-dispatch';
// 서버 payload의 title 자체가 '앱 · 알림종류'라서 잠금화면에서도 카테고리를 바로 알 수 있다.
self.addEventListener('push',event=>{
  let p={};try{p=event.data?event.data.json():{}}catch(_){p={title:'상지홈',body:event.data?event.data.text():''}}
  const d=p.data||{},actions=[];
  if(d.actionToken){actions.push({action:'mute_type',title:'이 유형 끄기'});actions.push({action:'settings',title:'알림 설정'});}
  event.waitUntil(self.registration.showNotification(p.title||'상지홈',{body:p.body||'',icon:'./apple-touch-icon.png',badge:'./apple-touch-icon.png',tag:p.tag||undefined,renotify:!!p.renotify,data:d,actions}));
});

async function openApp(path){
  const target=new URL(path||'./',self.registration.scope).toString();
  const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of list){if(new URL(c.url).origin===location.origin){try{await c.navigate(target)}catch(_){}return c.focus();}}
  return self.clients.openWindow(target);
}
self.addEventListener('notificationclick',event=>{
  event.notification.close();const d=event.notification.data||{};
  event.waitUntil((async()=>{
    if(event.action==='mute_type'&&d.actionToken){
      try{const r=await fetch(PUSH_ACTION,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'mute_type',token:d.actionToken})});if(r.ok)return;}catch(_){}
      return openApp('./?app=notifications');
    }
    if(event.action==='settings')return openApp('./?app=notifications');
    return openApp(d.url||'./?app=notifications');
  })());
});
