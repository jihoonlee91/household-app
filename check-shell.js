const fs=require('fs'),vm=require('vm');
const issues=[];
const check=(name,src)=>{try{new vm.Script(src,{filename:name})}catch(e){issues.push(`${name}: ${e.message}`)}};
for(const f of ['install.js','mobile-ui.js','delight.js','share.js','sim-scenarios.js','sw.js'])check(f,fs.readFileSync(f,'utf8'));
for(const f of ['index.html','sim.html','wishlist.html']){
  const html=fs.readFileSync(f,'utf8'); let n=0;
  for(const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)){n++;check(`${f}#script${n}`,m[1])}
  if(!n&&!/<script[^>]+src=/i.test(html))issues.push(`${f}: script 없음`);
}
for(const f of ['mobile-shell.css','mobile-app.css','delight-shell.css']){
  const css=fs.readFileSync(f,'utf8');
  if(css.toLowerCase().includes('</style'))issues.push(`${f}: </style> 포함`);
  if((css.match(/\/\*/g)||[]).length!==(css.match(/\*\//g)||[]).length)issues.push(`${f}: CSS 주석 불균형`);
}
const delight=fs.readFileSync('delight.js','utf8');
if(!/hhOpenCommand/.test(delight)||!/hhShowInstallGuide/.test(delight)||!/hh-recent-apps/.test(delight))issues.push('delight.js: 핵심 빠른 실행/설치 안내/최근 앱 기능 누락');
const sw=fs.readFileSync('sw.js','utf8');if(!/delight\.js/.test(sw)||!/delight-shell\.css/.test(sw))issues.push('sw.js: delight 자산 캐시 누락');
console.log(issues.length?issues.join('\n'):'shell syntax OK');
if(issues.length)process.exit(1);
