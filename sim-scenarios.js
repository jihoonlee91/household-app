(()=>{
const W=1e4,E=1e8,KEY='hh-housing-scenarios-v5';
const $=id=>document.getElementById(id);
const money=v=>Math.abs(v)>=E?(v/E).toFixed(2).replace(/\.00$/,'')+'억':Math.round(v/W).toLocaleString('ko-KR')+'만';

const defaults={
  dongPrice:160000,oksuPrice:260000,dongGrow:3.5,oksuGrow:4.0,stockUsd:7.0,fx:0,
  buyCost:3.8,dongMove:4500,oksuMove:7000,
  mortgageLoan:50000,mortgageRate:4.5,mortgageYears:30,
  companyLoan:50000,companyRate:1.5,grace:3,amort:10,
  bridgeRate:5.5,reserve:5000,compareYear:2036,
  annualLiving:7500,annualNetIncome:11000,carBudget:8500,santaFeSale:1500
};
let S={...defaults};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}

let HH=null,LIVE=null;
try{HH=parent&&parent.__hh||null;LIVE=HH&&HH.snapshot||null}catch(e){}

const baseVals={cash:4700000,cheongMe:32965000,cheongSp:35350000,dojak:23800000,inv:126946308,opi:45603826,isa:9410719,pen:26352244,jeonse:4e8};
const baseDebts=[
  {n:'우리 WON 직장인 마통',b:143508300,r:5.06},
  {n:'Sh 신용대출',b:14100000,r:5.71},
  {n:'우리 예적금담보',b:21447059,r:4},
  {n:'IBK 예금담보',b:31216414,r:3.95},
  {n:'HF 전세대출',b:30000000,r:3.43,hf:true},
  {n:'학자금',b:14891916,r:2.62}
];
const vals={...baseVals,...(LIVE&&LIVE.vals||{})};
const debts=(LIVE&&LIVE.debts&&LIVE.debts.length?LIVE.debts:baseDebts).map(x=>({...x}));

const ids=['dongPrice','oksuPrice','dongGrow','oksuGrow','stockUsd','fx','buyCost','dongMove','oksuMove','mortgageLoan','mortgageRate','mortgageYears','companyLoan','companyRate','grace','amort','bridgeRate','reserve','compareYear','annualLiving','annualNetIncome','carBudget','santaFeSale'];
function write(){ids.forEach(k=>{const e=$(k);if(e)e.value=S[k]})}
function read(){ids.forEach(k=>{const e=$(k);if(e)S[k]=+e.value||0});localStorage.setItem(KEY,JSON.stringify(S))}
function debt(re){return debts.find(x=>re.test(x.n||''))||{b:0,r:0}}
function totalDebt(re){return debts.filter(x=>re.test(x.n||'')).reduce((a,x)=>a+(+x.b||0),0)}
function krStockRet(){return(1+S.stockUsd/100)*(1+S.fx/100)-1}
function grow(v,r,y){return v*Math.pow(1+r/100,Math.max(0,y))}

function amortizingLoan(P,ratePct,termYears,elapsedYears){
  P=Math.max(0,+P||0); const rm=(+ratePct||0)/100/12,n=Math.max(1,Math.round((+termYears||1)*12)),m=Math.min(n,Math.max(0,Math.round((+elapsedYears||0)*12)));
  const pay=rm?P*rm/(1-Math.pow(1+rm,-n)):P/n;
  let bal=P,interest=0,paid=0;
  for(let i=0;i<m&&bal>1;i++){const it=bal*rm,pr=Math.min(bal,Math.max(0,pay-it));interest+=it;bal-=pr;paid+=it+pr}
  return{bal,interest,paid,pay,annual:pay*12}
}
function companyLoanInfo(P,years){
  const rm=S.companyRate/100/12,g=Math.round(S.grace*12),n=Math.max(1,Math.round(S.amort*12)),m=Math.max(0,Math.round(years*12));
  let bal=P,interest=0,paid=0; const pay=rm?P*rm/(1-Math.pow(1+rm,-n)):P/n;
  for(let i=0;i<m&&bal>1;i++){if(i<g){const it=bal*rm;interest+=it;paid+=it}else{const it=bal*rm,pr=Math.min(bal,Math.max(0,pay-it));interest+=it;bal-=pr;paid+=it+pr}}
  return{bal,interest,paid,pay}
}

const specialNet={2027:3.50*E,2028:3.30*E,2029:3.00*E,2030:2.70*E,2031:2.50*E,2032:2.30*E,2033:2.10*E,2034:1.90*E,2035:1.70*E};
const regBonusNet={2027:.315*E,2028:.32*E,2029:.33*E,2030:.34*E,2031:.35*E,2032:.36*E,2033:.37*E,2034:.38*E,2035:.39*E};
function unlockAt(y){let v=0;for(const [gy,net] of Object.entries(specialNet)){const g=+gy;if(y>=g&&y<=g+2)v+=net/3}return v}

function projectedLiquidFeb(year){
  const hf=debt(/HF|전세|전월세/).b||0;
  const woori=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0;
  const sh=debt(/Sh|더드림|수협/).b||0;
  let liquid=(vals.cash||0)+(vals.inv||0)+(vals.cheongMe||0)+(vals.cheongSp||0)+(vals.dojak||0)+Math.max(0,(vals.jeonse||0)-hf);
  let bankDebt=woori+sh+totalDebt(/예적금담보|예금담보|학자금/);
  const r=krStockRet(),surplus=Math.max(0,S.annualNetIncome-S.annualLiving)*W;
  for(let y=2027;y<year;y++){
    liquid+=unlockAt(y)+(regBonusNet[y]||0)+surplus;
    if(y===2027&&bankDebt>0){const p=Math.min(liquid,bankDebt);liquid-=p;bankDebt-=p}
    liquid*=1+r;
  }
  liquid+=unlockAt(year)+(regBonusNet[year]||0);
  if(year>=2029){const youthMaturity=grow(vals.dojak||0,4.5,1.75)+70*W*21;liquid+=Math.max(0,youthMaturity-(vals.dojak||0))}
  return Math.max(0,liquid-S.reserve*W)
}

function mainPurchase(){
  const year=2029,t=(year+1/12)-2026.75;
  const price=grow(S.dongPrice*W,S.dongGrow,t),extra=price*S.buyCost/100+S.dongMove*W,total=price+extra;
  const liquid=projectedLiquidFeb(year),mortgage=S.mortgageLoan*W;
  const gap=Math.max(0,total-liquid-mortgage),remain=Math.max(0,liquid+mortgage-total);
  const debtSvc=amortizingLoan(mortgage,S.mortgageRate,S.mortgageYears,0).annual;
  return{key:'29',year,label:'2029.2 동센자 입주',name:'동천센트럴자이 206동 · 40평 · 중층 이상',t,price,extra,total,liquid,loan:mortgage,gap,remain,debtSvc}
}

function seoulMove(main){
  const normalSurplus=Math.max(0,S.annualNetIncome-S.annualLiving)*W;
  const carNet=Math.max(0,(S.carBudget-S.santaFeSale)*W);
  let invest=main.remain,earliest=null,car=null; const rows=[];
  for(let y=2030;y<=2042;y++){
    const yearsFromBuy=Math.max(0,y-2029);
    const mtg=amortizingLoan(main.loan,S.mortgageRate,S.mortgageYears,yearsFromBuy);
    const afterDebt=Math.max(0,normalSurplus-mtg.annual);
    invest=(invest+afterDebt+unlockAt(y)+(regBonusNet[y]||0))*(1+krStockRet());
    if(!car&&carNet>0&&invest-carNet>=S.reserve*W){invest-=carNet;car={y,budget:S.carBudget*W,resale:S.santaFeSale*W,net:carNet,remaining:invest}}
    const dongValue=grow(main.price,S.dongGrow,yearsFromBuy),saleCost=dongValue*.008,dongEquity=Math.max(0,dongValue-mtg.bal-saleCost);
    const seoulPrice=grow(S.oksuPrice*W,S.oksuGrow,(y+1/12)-2026.75),seoulExtra=seoulPrice*S.buyCost/100+S.oksuMove*W,required=seoulPrice+seoulExtra;
    const company=S.companyLoan*W,available=dongEquity+invest+company,gap=Math.max(0,required-available);
    rows.push({y,dongValue,dongEquity,mortgageBalance:mtg.bal,seoulPrice,seoulExtra,required,available,gap,invest,company,carBought:car&&car.y===y});
    if(!earliest&&gap<=0)earliest=rows[rows.length-1]
  }
  return{earliest,rows,car}
}

function shareCard(x){
  const host=$('shareStage');
  host.innerHTML=`<section class="sharecard" id="shareOne"><div class="sc-brand">상지홈 · 중심 주거 시나리오</div><div class="sc-head"><div><small>BASE CASE</small><h2>${x.label}</h2><p>${x.name}</p></div><div class="sc-gap ${x.gap?'bad':'good'}"><small>${x.gap?'추가 마련':'잔여 여유'}</small><b>${money(x.gap||x.remain)}</b></div></div><div class="sc-grid"><div><small>예상 매수가</small><b>${money(x.price)}</b></div><div><small>취득·수리·이사</small><b>${money(x.extra)}</b></div><div><small>매수 직전 가용자금</small><b>${money(x.liquid)}</b></div><div><small>은행 주담대</small><b>${money(x.loan)}</b></div></div><div class="sc-flow"><b>중심 전략</b><span>• 2027.2 전세 묵시적 갱신</span><span>• 2029.2 206동 40평 중층 이상 매수</span><span>• 40평은 회사 주거대출 제외 → 은행 주담대</span><span>• 이후 여유 생기면 GV80급 교체</span><span>• 그 뒤 서울 구매력 충족 시 갈아타기</span></div><div class="sc-assume"><span>동센자 <b>${S.dongGrow.toFixed(1)}%</b>/년</span><span>주담대 <b>${S.mortgageRate.toFixed(1)}%</b></span><span>S&P500 <b>${S.stockUsd.toFixed(1)}%</b>/년</span><span>GV80급 <b>${money(S.carBudget*W)}</b></span></div><footer>2026-10-04 기준 계획값 · 실제 DSR/LTV·금리·성과급·실거래가에 따라 재계산</footer></section>`;
  return $('shareOne')
}
async function shareScenario(){const x=mainPurchase(),el=shareCard(x);try{if(window.hhCaptureElement)await window.hhCaptureElement(el,{orientation:'portrait',name:'상지홈-중심주거시나리오',full:false});else alert('공유 모듈을 불러오지 못했습니다.')}finally{$('shareStage').innerHTML=''}}

function render(){
  read(); const main=mainPurchase(),seoul=seoulMove(main),target=seoul.earliest,car=seoul.car;
  const w=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0,sh=debt(/Sh|더드림|수협/).b||0;
  const currentDebt=debts.reduce((a,x)=>a+(x.b||0),0),protectedAmt=(vals.isa||0)+(vals.pen||0);
  $('live').textContent=LIVE?`상지홈 DB ${LIVE.asof||''} 기준 · 중심 시나리오`:'기본 스냅샷 기준 · 중심 시나리오';
  $('cards').innerHTML=`
    <article class="scenario best"><div class="scenarioTop"><h3>중심 시나리오 <span class="tag">BASE</span></h3><button class="shareBtn hh-share-inline" data-share="main" type="button">공유</button></div><div class="kv">
      <span>2027.02</span><b>현 전세 묵시적 갱신</b><span>2029.02 목표</span><b>206동 40평 · 중층 이상</b><span>2029.02 예상 매수가</span><b>${money(main.price)}</b><span>취득·약간 수리·이사</span><b>${money(main.extra)}</b><span>매수 직전 가용자금</span><b>${money(main.liquid)}</b><span>은행 주담대</span><b>${money(main.loan)}</b><span>주담대 금리/만기</span><b>${S.mortgageRate.toFixed(1)}% · ${S.mortgageYears}년</b><span>연 원리금</span><b>${money(main.debtSvc)}</b><span>추가 마련 필요</span><b class="gap ${main.gap?'bad':'good'}">${main.gap?money(main.gap):'0'}</b><span>매수 후 현금여유</span><b>${main.remain?money(main.remain):'–'}</b></div>
      <div class="warn">동센자 40평은 전용 84㎡ 초과이므로 회사 주거대출은 0원으로 처리합니다. 2029 매수는 은행 주담대로 계산합니다. 우리 마통 30% 감액 + Sh 상환 스트레스는 약 ${money(w*.3+sh)}, 전액 미연장 최악은 ${money(w+sh)}.</div></article>
    <article class="scenario"><div class="scenarioTop"><h3>GV80급 교체</h3></div><div class="kv"><span>총 차량예산</span><b>${money(S.carBudget*W)}</b><span>싼타페 매각 가정</span><b>${money(S.santaFeSale*W)}</b><span>순현금 필요액</span><b>${money(Math.max(0,(S.carBudget-S.santaFeSale)*W))}</b><span>예상 교체 시점</span><b>${car?car.y+'년':'2042년 이후'}</b><span>교체 후 투자성 자금</span><b>${car?money(car.remaining):'–'}</b></div><div class="warn">동센자 주담대 연 원리금과 생활비를 낸 뒤에도 비상금 ${money(S.reserve*W)}를 남길 수 있을 때 교체합니다.</div></article>
    <article class="scenario"><div class="scenarioTop"><h3>서울 갈아타기</h3></div><div class="kv"><span>목표주택 기준값</span><b>${money(S.oksuPrice*W)} 현재가</b><span>서울 집값 가정</span><b>${S.oksuGrow.toFixed(1)}%/년</b><span>회사 주거대출</span><b>${money(S.companyLoan*W)}</b><span>적용 조건</span><b>서울 목표 전용 84㎡ 이하</b><span>예상 진입 시점</span><b>${target?target.y+'년':'2042년 이후'}</b><span>그때 서울 목표가</span><b>${target?money(target.seoulPrice):'–'}</b><span>동센자 순자산</span><b>${target?money(target.dongEquity):'–'}</b><span>별도 축적자산</span><b>${target?money(target.invest):'–'}</b></div><div class="warn">서울 목표가 84㎡를 초과하면 회사 주거대출 입력값을 0으로 두고 다시 계산합니다.</div></article>`;

  $('opp').innerHTML=`<table><thead><tr><th>연도</th><th>동센자 예상가</th><th>주담대 잔액</th><th>동센자 순자산</th><th>서울 목표가</th><th>별도 축적자산</th><th>차량 이벤트</th><th>서울 진입 부족액</th></tr></thead><tbody>${seoul.rows.filter(r=>r.y%2===1||r.y===2030||r===target||r.carBought).map(r=>`<tr><td>${r.y}</td><td>${money(r.dongValue)}</td><td>${money(r.mortgageBalance)}</td><td>${money(r.dongEquity)}</td><td>${money(r.seoulPrice)}</td><td>${money(r.invest)}</td><td>${r.carBought?'GV80급 교체':'–'}</td><td class="${r.gap?'bad':'good'}"><b>${r.gap?money(r.gap):'진입 가능'}</b></td></tr>`).join('')}</tbody></table>`;

  const rr=krStockRet()*100;
  $('ret').textContent=`현실 기본값: 동센자 40평 현재 16.0억 · 동센자 ${S.dongGrow.toFixed(1)}%/년 · 서울 ${S.oksuGrow.toFixed(1)}%/년 · 동센자 주담대 ${money(S.mortgageLoan*W)} / ${S.mortgageRate.toFixed(1)}% / ${S.mortgageYears}년 · S&P500 원화 기대수익률 ${rr.toFixed(2)}%/년`;
  $('metrics').innerHTML=`<div class="metric"><small>현재 전세보증금</small><b>${money(vals.jeonse||0)}</b></div><div class="metric"><small>현재 총대출</small><b>${money(currentDebt)}</b></div><div class="metric"><small>보호자산(ISA·연금)</small><b>${money(protectedAmt)}</b></div><div class="metric"><small>동센자 주담대 계획</small><b>${money(S.mortgageLoan*W)}</b></div>`;

  $('timeline').innerHTML=[
    ['2026.12.03','묵시적 갱신 안전선. 별도 종료 통보가 없다면 2027.2 이후 갱신 상태로 가는 중심 계획.'],
    ['2027.02','현 집 전세 계속 거주. 동센자 조기매수는 기본 시나리오에서 제외.'],
    ['2027.05~06',`우리 마통·Sh 만기 대응. 고금리 부채 우선 축소, 주거자금 현금버퍼 ${money(S.reserve*W)} 유지.`],
    ['2028.01','성과급/성과주 해제분을 부채 정리와 2029 매수자금으로 우선 적립.'],
    ['2028.07','청년도약 만기금은 2029 매수재원으로 이동.'],
    ['2028.10~2029.01','206동 40평 중층 이상 매물만 추적하고 은행 주담대 한도·DSR을 사전확인.'],
    ['2029.02',`동천센트럴자이 206동 40평 매수. 회사 주거대출은 제외하고 은행 주담대 ${money(S.mortgageLoan*W)} 기준으로 입주.`],
    [car?`${car.y}`:'2030s',car?`주담대 원리금과 비상금을 반영한 뒤 싼타페를 매각해 GV80급으로 교체. 순현금 약 ${money(car.net)} 사용.`:'동센자 입주 후 주담대 상환을 감안해 여유자금이 충분해지는 시점에 GV80급 교체.'],
    [target?`${target.y}`:'2030s','서울 목표주택 구매력이 충족되는 시점에 이동. 전용 84㎡ 이하일 때만 회사 주거대출 반영.']
  ].map(x=>`<div class="event"><b>${x[0]}</b><div>${x[1]}</div></div>`).join('');

  $('note').innerHTML=`<b>기본 시나리오:</b> 27.2 전세 묵시적 갱신 → 29.2 동천센트럴자이 206동 40평 중층 이상 매수 → 약간의 수리 후 입주 → 자금여유가 생기면 GV80급 교체 → 이후 서울 집을 살 수 있는 첫 시점에 갈아타기입니다. <b>동센자 40평은 회사 주거대출 대상이 아니므로 회사대출을 전혀 사용하지 않고 은행 주담대 ${money(S.mortgageLoan*W)}·${S.mortgageRate.toFixed(1)}%·${S.mortgageYears}년으로 계산</b>합니다. 주담대 원리금은 매년 축적가능자금에서 차감합니다. 회사 주거대출 ${money(S.companyLoan*W)}·${S.companyRate.toFixed(1)}%는 이후 서울 목표주택이 전용 84㎡ 이하일 때만 사용할 수 있는 별도 재원입니다. 연금·IRP·ISA는 매수자금에서 제외하고 현금버퍼를 남깁니다.`;
}

async function loadPrices(){try{if(!HH||!HH.sb)return;const w=await HH.sb.from('realestate_watchlist').select('id,name').eq('active',true);for(const a of w.data||[]){let k=/동천.*센트럴.*자이|동센자/.test(a.name||'')?'dongPrice':/옥수.*파크힐스|옥수/.test(a.name||'')?'oksuPrice':null;if(!k)continue;const p=await HH.sb.from('realestate_prices').select('recent_trade_price,asking_price,deal_date,checked_on').eq('watch_id',a.id).order('deal_date',{ascending:false,nullsFirst:false}).order('checked_on',{ascending:false}).limit(1);const x=p.data&&p.data[0],v=x&&(x.asking_price||x.recent_trade_price);if(v)S[k]=Math.round(v/W)}write();render()}catch(e){console.warn(e)}}
async function loadCarPlan(){try{if(!HH||!HH.sb)return;const r=await HH.sb.from('app_state').select('data').eq('app','car').eq('key','inputs').maybeSingle();const u=r.data&&r.data.data&&r.data.data.upgrade;if(u){if(+u.budget)S.carBudget=+u.budget;if(+u.resale>=0)S.santaFeSale=+u.resale;write();render()}}catch(e){console.warn(e)}}
function reset(){S={...defaults};write();render();setTimeout(loadCarPlan,30)}
write();ids.forEach(k=>$(k)&&$(k).addEventListener('input',render));$('loadPrices')&&$('loadPrices').addEventListener('click',loadPrices);$('reset')&&$('reset').addEventListener('click',reset);$('cards')&&$('cards').addEventListener('click',e=>{const b=e.target.closest('[data-share]');if(b)shareScenario()});render();setTimeout(loadPrices,80);setTimeout(loadCarPlan,120);
})();