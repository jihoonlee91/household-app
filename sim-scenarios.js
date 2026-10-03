(()=>{
const W=1e4, E=1e8, KEY='hh-housing-scenarios-v1';
const $=id=>document.getElementById(id), money=v=>Math.abs(v)>=E?(v/E).toFixed(2).replace(/\.00$/,'')+'억':Math.round(v/W).toLocaleString('ko-KR')+'만';
const defaults={dongPrice:144000,oksuPrice:260000,dongGrow:4.5,oksuGrow:4.5,stockUsd:10,fx:0,buyCost:4,dongMove:2500,oksuMove:5000,companyLoan:50000,companyRate:1.5,grace:3,amort:10,bridgeRate:5.5,reserve:3000,compareYear:2036,annualLiving:7500,annualNetIncome:10500};
let S={...defaults}; try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
let HH=null,LIVE=null; try{HH=parent&&parent.__hh||null;LIVE=HH&&HH.snapshot||null}catch(e){}
const baseVals={cash:4700000,cheongMe:32965000,cheongSp:35350000,dojak:23800000,inv:126946308,opi:45603826,isa:9410719,pen:26352244,jeonse:4e8};
const baseDebts=[{n:'우리 WON 직장인 마통',b:143508300,r:5.06},{n:'Sh 신용대출',b:14100000,r:5.71},{n:'우리 예적금담보',b:21447059,r:4},{n:'IBK 예금담보',b:31216414,r:3.95},{n:'HF 전세대출',b:30000000,r:3.43,hf:true},{n:'학자금',b:14891916,r:2.62}];
const vals={...baseVals,...(LIVE&&LIVE.vals||{})}, debts=(LIVE&&LIVE.debts&&LIVE.debts.length?LIVE.debts:baseDebts).map(x=>({...x}));
if(LIVE&&LIVE.params&&LIVE.params.housePrice&&S.dongPrice===defaults.dongPrice)S.dongPrice=+LIVE.params.housePrice;
const ids=['dongPrice','oksuPrice','dongGrow','oksuGrow','stockUsd','fx','buyCost','dongMove','oksuMove','companyLoan','companyRate','grace','amort','bridgeRate','reserve','compareYear','annualLiving','annualNetIncome'];
function write(){ids.forEach(k=>{const e=$(k);if(e)e.value=S[k]})} function read(){ids.forEach(k=>{const e=$(k);if(e)S[k]=+e.value||0});localStorage.setItem(KEY,JSON.stringify(S));try{HH&&HH.saveInputs&&HH.saveInputs({housingScenarios:S})}catch(e){}}
function debt(re){return debts.find(x=>re.test(x.n||''))||{b:0,r:0}}
function totalDebt(re){return debts.filter(x=>re.test(x.n||'')).reduce((a,x)=>a+(+x.b||0),0)}
function krStockRet(){return(1+S.stockUsd/100)*(1+S.fx/100)-1}
function grow(v,r,years){return v*Math.pow(1+r/100,Math.max(0,years))}
function compLoan(P,years){const rm=S.companyRate/100/12,g=Math.round(S.grace*12),n=Math.max(1,Math.round(S.amort*12)),m=Math.max(0,Math.round(years*12));let bal=P,interest=0,paid=0;const pay=rm?P*rm/(1-Math.pow(1+rm,-n)):P/n;for(let i=0;i<m&&bal>1;i++){if(i<g){const it=bal*rm;interest+=it;paid+=it}else{const it=bal*rm,pr=Math.min(bal,Math.max(0,pay-it));interest+=it;bal-=pr;paid+=it+pr}}return{bal,interest,paid,pay}}
const specialNet={2027:2.92*E,2028:5.93*E,2029:5.81*E,2030:5.29*E,2031:5.30*E};
const regBonusNet={2027:.315*E,2028:.32*E,2029:.33*E,2030:.34*E,2031:.35*E};
function unlockAt(y){let v=0;for(const [gy,net] of Object.entries(specialNet)){const g=+gy;if(y>=g&&y<=g+2)v+=net/3}return v}
function projectedLiquidFeb(year){
  const hf=debt(/HF|전세|전월세/).b||0, woori=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0, sh=debt(/Sh|더드림|수협/).b||0;
  let liquid=(vals.cash||0)+(vals.inv||0)+(vals.cheongMe||0)+(vals.cheongSp||0)+(vals.dojak||0)+Math.max(0,(vals.jeonse||0)-hf);
  if(year===2027) liquid+=(vals.opi||0)+specialNet[2027]/3+regBonusNet[2027];
  let bankDebt=woori+sh+totalDebt(/예적금담보|예금담보|학자금/);
  if(year>=2029){
    const rentLoan=3*E, payoff=Math.min(rentLoan,bankDebt+hf); bankDebt=Math.max(0,bankDebt+hf-payoff);
    liquid+=(rentLoan-payoff);
    const r=krStockRet(), surplus=Math.max(0,S.annualNetIncome-S.annualLiving)*W;
    for(let y=2027;y<year;y++){
      if(y===2027){ liquid-=Math.min(liquid,Math.max(0,bankDebt));bankDebt=Math.max(0,bankDebt-liquid); }
      liquid+=unlockAt(y)+(regBonusNet[y]||0)+surplus;
      liquid*=1+r;
    }
    liquid+=unlockAt(year)+(regBonusNet[year]||0);
    liquid-=rentLoan;
    if(year>=2029){const maturity=grow(vals.dojak||0,4.5,1.75)+70*W*21;liquid+=Math.max(0,maturity-(vals.dojak||0));}
  }
  return Math.max(0,liquid-S.reserve*W);
}
function scenario(c){
  const t=(c.year+1/12)-2026.75, price=grow(c.base,c.grow,t), extra=price*S.buyCost/100+c.move*W, total=price+extra, liquid=projectedLiquidFeb(c.year), loan=S.companyLoan*W, gap=Math.max(0,total-liquid-loan), remain=Math.max(0,liquid+loan-total), bridge=gap*S.bridgeRate/100*c.bridgeMonths/12;
  const yrs=Math.max(0,S.compareYear-c.year), houseFV=grow(price,c.grow,yrs), own=Math.max(0,total-loan-gap), stockFV=own*Math.pow(1+krStockRet(),yrs), stockGain=stockFV-own, houseGain=houseFV-price, lm=compLoan(loan,yrs), opp=houseGain-stockGain-lm.interest-extra-bridge;
  return{...c,t,price,extra,total,liquid,loan,gap,remain,bridge,yrs,houseFV,own,stockGain,houseGain,lm,opp}
}
function scenarios(){return[
  {key:'27',year:2027,label:'27.2 동센자',name:'동천센트럴자이',base:S.dongPrice*W,grow:S.dongGrow,move:S.dongMove,bridgeMonths:11},
  {key:'29',year:2029,label:'29.2 동센자',name:'동천센트럴자이',base:S.dongPrice*W,grow:S.dongGrow,move:S.dongMove,bridgeMonths:0},
  {key:'31',year:2031,label:'31.2 옥수',name:'옥수파크힐스 84㎡',base:S.oksuPrice*W,grow:S.oksuGrow,move:S.oksuMove,bridgeMonths:0}
].map(scenario)}
function render(){read();const list=scenarios(),best=[...list].sort((a,b)=>a.gap-b.gap||b.opp-a.opp)[0],w=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0,sh=debt(/Sh|더드림|수협/).b||0,stress=w*.3+sh,worst=w+sh;
$('live').textContent=LIVE?`상지홈 DB ${LIVE.asof||''} 기준`:'기본 스냅샷 기준';
$('cards').innerHTML=list.map(x=>`<article class="scenario ${x===best?'best':''}"><h3>${x.label}${x===best?'<span class="tag">자금여유</span>':''}</h3><div class="kv"><span>예상 매수가</span><b>${money(x.price)}</b><span>취득·수리·이사</span><b>${money(x.extra)}</b><span>매수 직전 가용자금</span><b>${money(x.liquid)}</b><span>회사대출</span><b>${money(x.loan)}</b><span>추가 마련 필요</span><b class="gap ${x.gap?'bad':'good'}">${x.gap?money(x.gap):'0'}</b><span>매수 후 현금여유</span><b>${x.remain?money(x.remain):'–'}</b></div>${x.key==='27'?`<div class="warn">27년 만기 스트레스: 우리 마통 30% 감액 + Sh 상환 시 ${money(stress)}, 전액 미연장 최악 ${money(worst)}. 부족분을 28.1까지 11개월 브리지하면 이자 약 ${money(x.bridge)}.</div>`:''}</article>`).join('');
$('opp').innerHTML=`<table><thead><tr><th>${S.compareYear}년 기준</th><th>집 예상가</th><th>집값 상승이익</th><th>같은 자기자금 주식 기대이익</th><th>회사대출 누적이자</th><th>취득·수리비</th><th>브리지비용</th><th>주택−주식 기회비용</th></tr></thead><tbody>${list.map(x=>`<tr><td>${x.label}</td><td>${money(x.houseFV)}</td><td>${money(x.houseGain)}</td><td>${money(x.stockGain)}</td><td>${money(x.lm.interest)}</td><td>${money(x.extra)}</td><td>${x.bridge?money(x.bridge):'–'}</td><td class="${x.opp>=0?'good':'bad'}"><b>${x.opp>=0?'+':'−'}${money(Math.abs(x.opp))}</b></td></tr>`).join('')}</tbody></table>`;
const rr=krStockRet()*100;$('ret').textContent=`S&P500 달러 ${S.stockUsd.toFixed(1)}% × 환율 ${S.fx.toFixed(1)}% → 원화 기대수익률 ${rr.toFixed(2)}%/년`;
const currentDebt=debts.reduce((a,x)=>a+(x.b||0),0),protectedAmt=(vals.isa||0)+(vals.pen||0);$('metrics').innerHTML=`<div class="metric"><small>현재 전세보증금</small><b>${money(vals.jeonse||0)}</b></div><div class="metric"><small>현재 총대출</small><b>${money(currentDebt)}</b></div><div class="metric"><small>보호자산(ISA·연금)</small><b>${money(protectedAmt)}</b></div><div class="metric"><small>회사 매매대출</small><b>${money(S.companyLoan*W)}</b></div>`;
$('timeline').innerHTML=[['2027.02','현 집 만기. 27 시나리오는 동센자 매수, 29/31 시나리오는 2년 갱신 + 회사 전세대출 3억으로 고금리 은행부채 정리.'],['2027.05',`우리 큰 마통 만기. 기본은 연장, 스트레스는 30% 감액(${money(w*.3)}).`],['2027.06',`Sh 신용대출 만기 ${money(sh)}. 연장되면 유지, 아니면 현금버퍼 또는 28.1 성과급 전 브리지.`],['2028.01','특별성과급 신규분 1/3 + 기존분 해제분이 겹치기 시작. 27 시나리오의 브리지/신용부채를 우선 축소.'],['2028.07','청년도약 만기. 29/31 시나리오는 중도해지하지 않고 만기금 전액을 매수재원으로 이동.'],['2029.02','29 시나리오: 동센자 매수. 회사 전세대출 상환 후 회사 매매대출 5억으로 전환.'],['2031.02','31 시나리오: 옥수 매수. 청약은 이때까지 유지 후 매수 시 해지.'],['매수+3년','회사대출 거치 종료. 이후 10년 원리금 상환 시작. 5억·1.5% 기준 초기 월 납입 약 '+money(compLoan(5*E,3.01).pay)+'/월.']].map(x=>`<div class="event"><b>${x[0]}</b><div>${x[1]}</div></div>`).join('');
$('note').innerHTML=`청약은 세 시나리오 모두 <b>매수 직전까지 유지 후 해지</b>합니다. 청년도약은 27 시나리오에서 부족자금이 크면 중도해지 가능, 29/31은 28.7 만기 유지가 기본입니다. 연금·IRP·ISA는 매수자금에서 제외했습니다. 특별성과급은 2026-10-07 공식안 전까지 현재 상지홈 가정(세후 자사주, 3년 분할 해제)을 사용합니다. 29/31의 가용자금은 현재 자산, 성과주 해제, 세후 생활잉여 및 일반계좌 수익을 단순화한 계획값이므로 실제 지급산식 확정 후 다시 갱신해야 합니다.`;
}
async function loadPrices(){try{if(!HH||!HH.sb)return;const w=await HH.sb.from('realestate_watchlist').select('id,name').eq('active',true);for(const a of w.data||[]){let k=/동천.*센트럴.*자이|동센자/.test(a.name||'')?'dongPrice':/옥수.*파크힐스|옥수/.test(a.name||'')?'oksuPrice':null;if(!k)continue;const p=await HH.sb.from('realestate_prices').select('recent_trade_price,asking_price,deal_date,checked_on').eq('watch_id',a.id).order('deal_date',{ascending:false,nullsFirst:false}).order('checked_on',{ascending:false}).limit(1);const x=p.data&&p.data[0],v=x&&(x.recent_trade_price||x.asking_price);if(v)S[k]=Math.round(v/W)}write();render()}catch(e){console.warn(e)}}
function reset(){S={...defaults};write();render()}
write();ids.forEach(k=>$(k)&&$(k).addEventListener('input',render));$('loadPrices').addEventListener('click',loadPrices);$('reset').addEventListener('click',reset);render();setTimeout(loadPrices,80);
new MutationObserver(()=>{try{const t=parent.document.documentElement.getAttribute('data-theme');if(t)document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme')}catch(e){}}).observe(document.documentElement,{attributes:true});
})();