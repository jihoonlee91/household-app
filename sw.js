const CACHE='sangjihome-shell-v23';
const SHELL=['./','./manifest.webmanifest','./manifest.webmanifest?v=20261005-1','./icon.svg','./apple-touch-icon.png','./install.js?v=20261005-1','./mobile-ui.js?v=20261005-1','./mobile-shell.css?v=20261005-1','./mobile-app.css?v=20261005-1','./delight-shell.css?v=20261005-1','./delight.js?v=20261005-1','./share.js?v=20261005-1','./sim.html?v=20261005-1','./sim-scenarios.css?v=20261005-1','./sim-scenarios.js?v=20261005-1','./wishlist.html?v=20261005-1','./car.html?v=20261005-1'];
const PUSH_ACTION='https://jdidzokxoaxqcnraowyu.supabase.co/functions/v1/push-dispatch';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match('./')));return;}const fresh=/\/(install\.js|share\.js|mobile-ui\.js|mobile-shell\.css|mobile-app\.css|delight-shell\.css|delight\.js|sim\.html|wishlist\.html|car\.html|sim-scenarios\.(?:js|css))$/.test(url.pathname);event.respondWith(fetch(event.request,fresh?{cache:'no-store'}:undefined).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r;}).catch(()=>caches.match(event.request)));});

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
