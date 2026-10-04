(()=>{
const W=1e4,E=1e8,KEY='hh-housing-scenarios-v3';
const $=id=>document.getElementById(id);
const money=v=>Math.abs(v)>=E?(v/E).toFixed(2).replace(/\.00$/,'')+'억':Math.round(v/W).toLocaleString('ko-KR')+'만';

const defaults={
  dongPrice:160000,oksuPrice:260000,dongGrow:3.5,oksuGrow:4.0,stockUsd:7.0,fx:0,
  buyCost:3.8,dongMove:4500,oksuMove:7000,companyLoan:50000,companyRate:1.5,
  mortgageRate:4.5,grace:3,amort:10,bridgeRate:5.5,reserve:5000,compareYear:2036,
  annualLiving:7500,annualNetIncome:11000
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

const ids=['dongPrice','oksuPrice','dongGrow','oksuGrow','stockUsd','fx','buyCost','dongMove','oksuMove','companyLoan','companyRate','mortgageRate','grace','amort','bridgeRate','reserve','compareYear','annualLiving','annualNetIncome'];
function write(){ids.forEach(k=>{const e=$(k);if(e)e.value=S[k]})}
function read(){ids.forEach(k=>{const e=$(k);if(e)S[k]=+e.value||0});localStorage.setItem(KEY,JSON.stringify(S))}
function debt(re){return debts.find(x=>re.test(x.n||''))||{b:0,r:0}}
function totalDebt(re){return debts.filter(x=>re.test(x.n||'')).reduce((a,x)=>a+(+x.b||0),0)}
function krStockRet(){return(1+S.stockUsd/100)*(1+S.fx/100)-1}
function grow(v,r,y){return v*Math.pow(1+r/100,Math.max(0,y))}
function compLoan(P,years){
  const rm=S.companyRate/100/12,g=Math.round(S.grace*12),n=Math.max(1,Math.round(S.amort*12)),m=Math.max(0,Math.round(years*12));
  let bal=P,interest=0,paid=0;
  const pay=rm?P*rm/(1-Math.pow(1+rm,-n)):P/n;
  for(let i=0;i<m&&bal>1;i++){
    if(i<g){const it=bal*rm;interest+=it;paid+=it}
    else{const it=bal*rm,pr=Math.min(bal,Math.max(0,pay-it));interest+=it;bal-=pr;paid+=it+pr}
  }
  return{bal,interest,paid,pay}
}

/* Planning values only. 2026 agreement: DS special bonus pool is 10.5%, common org is ~70% of Memory,
   stock vests 1/3 immediately + 1/3 after 1y + 1/3 after 2y. Official annual payout can differ materially. */
const specialNet={2027:3.50*E,2028:3.30*E,2029:3.00*E,2030:2.70*E,2031:2.50*E,2032:2.30*E,2033:2.10*E,2034:1.90*E,2035:1.70*E};
const regBonusNet={2027:.315*E,2028:.32*E,2029:.33*E,2030:.34*E,2031:.35*E,2032:.36*E,2033:.37*E,2034:.38*E,2035:.39*E};
function unlockAt(y){
  let v=0;
  for(const [gy,net] of Object.entries(specialNet)){
    const g=+gy;
    if(y>=g&&y<=g+2)v+=net/3;
  }
  return v
}

function projectedLiquidFeb(year){
  const hf=debt(/HF|전세|전월세/).b||0;
  const woori=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0;
  const sh=debt(/Sh|더드림|수협/).b||0;
  let liquid=(vals.cash||0)+(vals.inv||0)+(vals.cheongMe||0)+(vals.cheongSp||0)+(vals.dojak||0)+Math.max(0,(vals.jeonse||0)-hf);
  let bankDebt=woori+sh+totalDebt(/예적금담보|예금담보|학자금/);
  const r=krStockRet(),surplus=Math.max(0,S.annualNetIncome-S.annualLiving)*W;

  for(let y=2027;y<year;y++){
    liquid+=unlockAt(y)+(regBonusNet[y]||0)+surplus;
    if(y===2027&&bankDebt>0){
      const p=Math.min(liquid,bankDebt);
      liquid-=p; bankDebt-=p;
    }
    liquid*=1+r;
  }
  liquid+=unlockAt(year)+(regBonusNet[year]||0);

  if(year>=2029){
    const youthMaturity=grow(vals.dojak||0,4.5,1.75)+70*W*21;
    liquid+=Math.max(0,youthMaturity-(vals.dojak||0));
  }
  return Math.max(0,liquid-S.reserve*W)
}

function mainPurchase(){
  const year=2029;
  const t=(year+1/12)-2026.75;
  const price=grow(S.dongPrice*W,S.dongGrow,t);
  const extra=price*S.buyCost/100+S.dongMove*W;
  const total=price+extra;
  const liquid=projectedLiquidFeb(year);
  const companyLoan=S.companyLoan*W;
  const gap=Math.max(0,total-liquid-companyLoan);
  const remain=Math.max(0,liquid+companyLoan-total);
  return{key:'29',year,label:'2029.2 동센자 입주',name:'동천센트럴자이 206동 · 40평 · 중층 이상',t,price,extra,total,liquid,loan:companyLoan,gap,remain}
}

function seoulMove(main){
  const surplus=Math.max(0,S.annualNetIncome-S.annualLiving)*W;
  let invest=main.remain;
  let earliest=null;
  const rows=[];
  for(let y=2030;y<=2042;y++){
    invest=(invest+surplus+unlockAt(y)+(regBonusNet[y]||0))*(1+krStockRet());
    const yearsFromBuy=Math.max(0,y-2029);
    const dongValue=grow(main.price,S.dongGrow,yearsFromBuy);
    const loan=compLoan(main.loan,yearsFromBuy).bal;
    const saleCost=dongValue*0.8/100;
    const dongEquity=Math.max(0,dongValue-loan-saleCost);
    const seoulPrice=grow(S.oksuPrice*W,S.oksuGrow,(y+1/12)-2026.75);
    const seoulExtra=seoulPrice*S.buyCost/100+S.oksuMove*W;
    const required=seoulPrice+seoulExtra;
    const available=dongEquity+invest+S.companyLoan*W;
    const gap=Math.max(0,required-available);
    rows.push({y,dongValue,dongEquity,seoulPrice,seoulExtra,required,available,gap,invest});
    if(!earliest&&gap<=0)earliest=rows[rows.length-1];
  }
  return{earliest,rows}
}

function shareCard(x){
  const host=$('shareStage');
  host.innerHTML=`<section class="sharecard" id="shareOne">
    <div class="sc-brand">상지홈 · 중심 주거 시나리오</div>
    <div class="sc-head"><div><small>BASE CASE</small><h2>${x.label}</h2><p>${x.name}</p></div>
    <div class="sc-gap ${x.gap?'bad':'good'}"><small>${x.gap?'추가 마련':'잔여 여유'}</small><b>${money(x.gap||x.remain)}</b></div></div>
    <div class="sc-grid"><div><small>예상 매수가</small><b>${money(x.price)}</b></div><div><small>취득·수리·이사</small><b>${money(x.extra)}</b></div>
    <div><small>매수 직전 가용자금</small><b>${money(x.liquid)}</b></div><div><small>회사 매매대출</small><b>${money(x.loan)}</b></div></div>
    <div class="sc-flow"><b>중심 전략</b><span>• 2027.2 전세 묵시적 갱신</span><span>• 2029.2 206동 40평 중층 이상 매수</span><span>• 준신축 상태를 살리고 필요한 부분만 수리</span><span>• 이후 자산을 다시 축적해 서울 진입 가능 시점에 갈아타기</span></div>
    <div class="sc-assume"><span>동센자 <b>${S.dongGrow.toFixed(1)}%</b>/년</span><span>서울 목표 <b>${S.oksuGrow.toFixed(1)}%</b>/년</span><span>S&P500(USD) <b>${S.stockUsd.toFixed(1)}%</b>/년</span><span>주담대 스트레스 <b>${S.mortgageRate.toFixed(1)}%</b></span></div>
    <footer>2026-10-04 기준 계획값 · 실제 대출한도/성과급/실거래가에 따라 자동 재계산</footer>
  </section>`;
  return $('shareOne')
}

async function shareScenario(){
  const x=mainPurchase(),el=shareCard(x);
  try{
    if(window.hhCaptureElement)await window.hhCaptureElement(el,{orientation:'portrait',name:'상지홈-중심주거시나리오',full:false});
    else alert('공유 모듈을 불러오지 못했습니다.')
  }finally{$('shareStage').innerHTML=''}
}

function render(){
  read();
  const main=mainPurchase(),seoul=seoulMove(main),target=seoul.earliest;
  const w=debt(/WON|직장인.*마통|우리은행 마이너스/).b||0,sh=debt(/Sh|더드림|수협/).b||0;
  const currentDebt=debts.reduce((a,x)=>a+(x.b||0),0),protectedAmt=(vals.isa||0)+(vals.pen||0);

  $('live').textContent=LIVE?`상지홈 DB ${LIVE.asof||''} 기준 · 중심 시나리오`:'기본 스냅샷 기준 · 중심 시나리오';

  $('cards').innerHTML=`
    <article class="scenario best">
      <div class="scenarioTop"><h3>중심 시나리오 <span class="tag">BASE</span></h3><button class="shareBtn hh-share-inline" data-share="main" type="button">공유</button></div>
      <div class="kv">
        <span>2027.02</span><b>현 전세 묵시적 갱신</b>
        <span>2029.02 목표</span><b>206동 40평 · 중층 이상</b>
        <span>2029.02 예상 매수가</span><b>${money(main.price)}</b>
        <span>취득·약간 수리·이사</span><b>${money(main.extra)}</b>
        <span>매수 직전 가용자금</span><b>${money(main.liquid)}</b>
        <span>회사 매매대출</span><b>${money(main.loan)}</b>
        <span>추가 마련 필요</span><b class="gap ${main.gap?'bad':'good'}">${main.gap?money(main.gap):'0'}</b>
        <span>매수 후 현금여유</span><b>${main.remain?money(main.remain):'–'}</b>
      </div>
      <div class="warn">2027.2에는 매수하지 않고 현 전세를 묵시적 갱신하는 것이 기본. 우리 마통 30% 감액 + Sh 상환 스트레스는 약 ${money(w*.3+sh)}, 전액 미연장 최악은 ${money(w+sh)}.</div>
    </article>
    <article class="scenario">
      <div class="scenarioTop"><h3>서울 갈아타기</h3></div>
      <div class="kv">
        <span>목표주택 기준값</span><b>${money(S.oksuPrice*W)} 현재가</b>
        <span>서울 집값 가정</span><b>${S.oksuGrow.toFixed(1)}%/년</b>
        <span>예상 진입 시점</span><b>${target?target.y+'년':'2042년 이후'}</b>
        <span>그때 서울 목표가</span><b>${target?money(target.seoulPrice):'–'}</b>
        <span>동센자 순자산</span><b>${target?money(target.dongEquity):'–'}</b>
        <span>별도 축적자산</span><b>${target?money(target.invest):'–'}</b>
      </div>
      <div class="warn">서울 매수는 연도를 고정하지 않고, 동센자 매각 순자산 + 축적자산 + 회사대출로 목표주택 총비용을 감당 가능한 첫 해를 자동 탐색합니다.</div>
    </article>`;

  $('opp').innerHTML=`<table><thead><tr><th>연도</th><th>동센자 예상가</th><th>동센자 순자산</th><th>서울 목표가</th><th>별도 축적자산</th><th>서울 진입 부족액</th></tr></thead>
    <tbody>${seoul.rows.filter(r=>r.y%2===1||r.y===2030||r===target).map(r=>`<tr><td>${r.y}</td><td>${money(r.dongValue)}</td><td>${money(r.dongEquity)}</td><td>${money(r.seoulPrice)}</td><td>${money(r.invest)}</td><td class="${r.gap?'bad':'good'}"><b>${r.gap?money(r.gap):'진입 가능'}</b></td></tr>`).join('')}</tbody></table>`;

  const rr=krStockRet()*100;
  $('ret').textContent=`현실 기본값: 동센자 40평 현재 16.0억 · 동센자 ${S.dongGrow.toFixed(1)}%/년 · 서울 ${S.oksuGrow.toFixed(1)}%/년 · S&P500 달러 ${S.stockUsd.toFixed(1)}%/년 · 원화 기대수익률 ${rr.toFixed(2)}%/년 · 은행 주담대 스트레스 ${S.mortgageRate.toFixed(1)}%`;

  $('metrics').innerHTML=`<div class="metric"><small>현재 전세보증금</small><b>${money(vals.jeonse||0)}</b></div>
    <div class="metric"><small>현재 총대출</small><b>${money(currentDebt)}</b></div>
    <div class="metric"><small>보호자산(ISA·연금)</small><b>${money(protectedAmt)}</b></div>
    <div class="metric"><small>회사 매매대출</small><b>${money(S.companyLoan*W)}</b></div>`;

  $('timeline').innerHTML=[
    ['2026.12.03','묵시적 갱신 안전선. 별도 종료 통보가 없다면 2027.2 이후 갱신 상태로 가는 중심 계획.'],
    ['2027.02','현 집 전세 계속 거주. 동센자 조기매수는 기본 시나리오에서 제외.'],
    ['2027.05~06',`우리 마통·Sh 만기 대응. 고금리 부채 우선 축소, 주거자금 현금버퍼 ${money(S.reserve*W)} 유지.`],
    ['2028.01','성과급/성과주 해제분을 부채 정리와 2029 매수자금으로 우선 적립.'],
    ['2028.07','청년도약 만기금은 2029 매수재원으로 이동.'],
    ['2028.10~2029.01','206동 40평 중층 이상 매물만 추적. 급매·동호수·수리상태를 가격보다 우선 확인.'],
    ['2029.02','동천센트럴자이 206동 40평 매수 후 필요한 부분만 수리하고 입주.'],
    [target?`${target.y}`:'2030s','동센자 이후에는 서울 매수 연도를 고정하지 않고, 목표주택 구매력이 충족되는 시점에 이동.']
  ].map(x=>`<div class="event"><b>${x[0]}</b><div>${x[1]}</div></div>`).join('');

  $('note').innerHTML=`<b>기본 시나리오를 하나로 고정했습니다.</b> 27.2 전세 묵시적 갱신 → 29.2 동천센트럴자이 206동 40평 중층 이상 매수 → 약간의 수리 후 입주 → 이후 서울 집을 살 수 있는 첫 시점에 갈아타기입니다. 
  현재 40평 기준값은 16.0억, 206동 40평 최근 확인 거래는 18층 14.2억이므로 206동·중층 이상 프리미엄과 최근 시세를 함께 반영했습니다. 동센자 장기 상승률은 최근 급등을 그대로 연장하지 않고 ${S.dongGrow.toFixed(1)}%, 서울 목표는 ${S.oksuGrow.toFixed(1)}%, S&P500은 장기 계획용 ${S.stockUsd.toFixed(1)}%로 낮췄습니다. 
  기준금리 3.0% 환경을 고려해 은행 주담대는 ${S.mortgageRate.toFixed(1)}% 스트레스로 둡니다. 특별성과급은 10.5% 재원·공통조직 메모리의 약 70%·3년 분할 매각 구조를 반영한 <b>계획값</b>이며, 공식 연도별 산식/실적이 확정되면 실제 DB 값이 우선입니다. 연금·IRP·ISA는 매수자금에서 제외하고 현금버퍼를 남기는 보수적 구조입니다.`;
}

async function loadPrices(){
  try{
    if(!HH||!HH.sb)return;
    const w=await HH.sb.from('realestate_watchlist').select('id,name').eq('active',true);
    for(const a of w.data||[]){
      let k=/동천.*센트럴.*자이|동센자/.test(a.name||'')?'dongPrice':/옥수.*파크힐스|옥수/.test(a.name||'')?'oksuPrice':null;
      if(!k)continue;
      const p=await HH.sb.from('realestate_prices').select('recent_trade_price,asking_price,deal_date,checked_on').eq('watch_id',a.id).order('deal_date',{ascending:false,nullsFirst:false}).order('checked_on',{ascending:false}).limit(1);
      const x=p.data&&p.data[0],v=x&&(x.asking_price||x.recent_trade_price);
      if(v)S[k]=Math.round(v/W);
    }
    write();render()
  }catch(e){console.warn(e)}
}
function reset(){S={...defaults};write();render()}

write();
ids.forEach(k=>$(k)&&$(k).addEventListener('input',render));
$('loadPrices')&&$('loadPrices').addEventListener('click',loadPrices);
$('reset')&&$('reset').addEventListener('click',reset);
$('cards')&&$('cards').addEventListener('click',e=>{const b=e.target.closest('[data-share]');if(b)shareScenario()});
render();
setTimeout(loadPrices,80);
})();