import {useMemo,useState} from "react";
import {
 COZUMEL_REVIEWED,COZUMEL_SOURCES,START_VISIT,emptyOffer,screenCozumel,reportCozumel,
 type Offer,type Visit,type QuoteId,type YesNo,type Activity,type BookingChannel,type Pier
} from "./lib/decision.ts";

const pierLabels:Record<Pier,string>={unknown:"Terminal not confirmed","puerta-maya":"Puerta Maya","international":"International (SSA) Pier","punta-langosta":"Punta Langosta"};
const yesNo:[YesNo,string][]=[
 ["unknown","Not confirmed"],["yes","Yes — independently verified"],["no","No / not confirmed"]
];
const activities:[Activity,string][]=[
 ["unknown","Choose excursion type"],["beach","Beach or beach club (Cozumel island)"],
 ["snorkeling","Snorkeling or marine tour (island)"],["island-tour","Land or cultural tour (island)"],
 ["mainland-ferry","Mainland trip requiring a ferry"],["other","Other on-island excursion"]
];
const channel:[BookingChannel,string][]=[
 ["unknown","Not confirmed"],["cruise-line","Sold by my cruise line"],["independent","Independently booked / third-party"]
];
const clock=(n:number|null)=>{
 if(n===null)return "Unknown";
 return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
};
const parseClock=(s:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
const money=(n:number)=>n.toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2});
const snapshot=()=>new Date().toISOString().slice(0,10);
const statusLabel:Record<string,string>={
 "conditional-window":"Tentative window fit","schedule-conflict":"Does not fit entered window",
 "needs-ship-details":"Confirm ship information","needs-offer-details":"Incomplete offer",
 "manual-ferry-review":"Ferry itinerary needs specialist review","source-review":"Source review required"
};
const headings=[
 ["royalAllAboard","Royal Caribbean: all-aboard and independent tours"],
 ["royalProtection","Royal Caribbean: ship-sold excursion protection"],
 ["carnivalIndependent","Carnival: independent excursion return responsibility"],
 ["portTerminals","Cozumel operator: three terminal meeting points"],
 ["timeWarning","Cozumel local vs ship time"],
 ["viatorPartner","Viator public affiliate program (not active here)"]
] as const;
function SelectYes({id,value,onChange}:{id:string;value:YesNo;onChange:(v:YesNo)=>void}){
 return <select id={id} value={value} onChange={e=>onChange(e.target.value as YesNo)}>
  {yesNo.map(([v,t])=><option key={v} value={v}>{t}</option>)}
 </select>;
}
function HourInput({id,value,onChange}:{id:string;value:number|null;onChange:(v:number|null)=>void}){
 return <input id={id} type="time" value={clock(value)=== "Unknown"?"":clock(value)}
  onChange={e=>onChange(parseClock(e.target.value))}/>;
}
function CountInput({id,value,onChange,min=0,max=1200}:{id:string;value:number|null;onChange:(v:number|null)=>void;min?:number;max?:number}){
 return <input id={id} type="number" min={min} max={max} step="1" inputMode="numeric" placeholder="Unknown"
  value={value??""} onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}/>;
}
function MoneyInput({id,value,onChange}:{id:string;value:number|null;onChange:(v:number|null)=>void}){
 return <input id={id} type="number" min="0" max="1000000" step="0.01" inputMode="decimal"
  placeholder="Unknown — not zero" value={value??""}
  onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}/>;
}

export function ShoreApp(){
 const [visit,setVisit]=useState<Visit>({...START_VISIT});
 const [offers,setOffers]=useState<[Offer,Offer]>([emptyOffer("a"),emptyOffer("b")]);
 const [asOf]=useState(snapshot);
 const [feedback,setFeedback]=useState("");
 const results=useMemo(()=>screenCozumel(visit,offers,asOf),[visit,offers,asOf]);
 const editVisit=<K extends keyof Visit>(key:K,value:Visit[K])=>{setVisit(old=>({...old,[key]:value}));setFeedback("");};
 const editOffer=(id:QuoteId,patch:Partial<Offer>)=>{
  setOffers(x=>x.map(q=>q.id===id?{...q,...patch}:q) as [Offer,Offer]);setFeedback("");
 };
 const copyText=()=>reportCozumel(results,visit,offers);
 async function copy(){
  try{await navigator.clipboard.writeText(copyText());setFeedback("Worksheet copied locally; no data submitted.");}
  catch{setFeedback("Clipboard unavailable. Download the report instead.");}
 }
 function download(){
  const blob=new Blob([copyText()],{type:"text/plain;charset=utf-8"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="cozumel-excursion-window-audit.txt";document.body.appendChild(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);}
  setFeedback("Report generated locally.");
 }
 const totalConditional=results.offers.filter(x=>x.status==="conditional-window").length;
 return <main className="shell">
  <nav className="nav">
   <span className="logo-mark">◈</span><span className="logo">Shore Window</span>
   <span className="nav-meta">COZUMEL / MEXICO <span aria-hidden="true">•</span> PRIVATE PRODUCT PILOT</span>
  </nav>
  <header className="hero">
   <div className="hero-copy">
    <p className="overline">CRUISE DAY PURCHASE CHECK · PORT 01</p>
    <h1>Can you take that shore excursion <em>and get back to your ship?</em></h1>
    <p>Check two written tour options against your own Cozumel port-day facts. We expose time-zone, terminal and return-window conflicts <strong>before you book</strong>—without inventing availability, prices or guarantees.</p>
    <div className="hero-pills"><span>Ship clock first</span><span>Three possible terminals</span><span>Independent tours ≠ ship guarantees</span></div>
   </div>
   <div className="hero-graphic" aria-hidden="true">
    <div className="ocean-circle"><span className="ocean-inner">PORT<br/><b>01</b></span></div>
    <div className="floating-a">ALL ABOARD<br/><b>VERIFY ON SHIP</b></div>
    <div className="floating-b">COZUMEL<br/><b>TIME MATTERS</b></div>
   </div>
  </header>
  <div className="warning"><b>Important:</b> This tool does not have live ship schedules, tour inventory, departure changes or verified pier transfers. Never treat a “tentative window fit” as a safe or bookable excursion. Your ship—not this website—sets all aboard. Independently booked operators may be late and your ship may leave.</div>
  <section className="section" aria-labelledby="visit-title">
   <div className="section-heading"><div><span className="number">01</span><p className="overline">VERIFY THE SHIP DAY</p><h2 id="visit-title">Your usable time ashore</h2></div><p>Enter ship time, not necessarily local Cozumel time. Do not subtract a guessed 30 minutes from the published departure.</p></div>
   <div className="form-grid">
    <label htmlFor="visit-pier">Actual cruise terminal
     <select id="visit-pier" value={visit.pier} onChange={e=>editVisit("pier",e.target.value as Pier)}>
      {Object.entries(pierLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
     </select>
    </label>
    <label htmlFor="visit-pierVerified">Did you confirm this pier with your cruise line?
     <SelectYes id="visit-pierVerified" value={visit.pierVerified} onChange={v=>editVisit("pierVerified",v)}/>
    </label>
    <label htmlFor="visit-allAboard">Exact ALL-ABOARD time (ship clock)
     <HourInput id="visit-allAboard" value={visit.allAboardShipMinute} onChange={v=>editVisit("allAboardShipMinute",v)}/>
     <small>Not scheduled sail-away/departure time.</small>
    </label>
    <label htmlFor="visit-allAboardVerified">Confirmed from ship app / onboard notice?
     <SelectYes id="visit-allAboardVerified" value={visit.allAboardVerified} onChange={v=>editVisit("allAboardVerified",v)}/>
    </label>
    <label htmlFor="visit-ashore">Earliest realistic time you'll be ashore (ship clock)
     <HourInput id="visit-ashore" value={visit.earliestAshoreShipMinute} onChange={v=>editVisit("earliestAshoreShipMinute",v)}/>
     <small>Include ship clearance, disembarkation and crowd delays.</small>
    </label>
    <label htmlFor="visit-clockVerified">Are all entered times converted to the ship clock?
     <SelectYes id="visit-clockVerified" value={visit.timesConvertedToShipClock} onChange={v=>editVisit("timesConvertedToShipClock",v)}/>
    </label>
    <label htmlFor="visit-party">Number of travelers
     <input id="visit-party" type="number" min="1" max="12" step="1" value={visit.partySize}
      onChange={e=>editVisit("partySize",Number(e.target.value))}/>
    </label>
    <label htmlFor="visit-reserve">Personal return reserve BEFORE all aboard
     <select id="visit-reserve" value={visit.preferredReturnReserveMinutes} onChange={e=>editVisit("preferredReturnReserveMinutes",Number(e.target.value) as Visit["preferredReturnReserveMinutes"])}>
      {[30,45,60,90,120].map(n=><option key={n} value={n}>{n} minutes before all aboard</option>)}
     </select><small>Planning preference, not a ship policy or safety guarantee.</small>
    </label>
   </div>
   <div className="factline"><strong>Conservative planning return cutoff:</strong> {visit.allAboardShipMinute!==null&&visit.allAboardShipMinute>=visit.preferredReturnReserveMinutes?clock(visit.allAboardShipMinute-visit.preferredReturnReserveMinutes)+" ship time":"Not determined"} <span>· All aboard: {clock(visit.allAboardShipMinute)}</span></div>
   {results.status==="ship-details-needed"&&<div className="followups"><h3>Resolve before using tour results</h3><ul>{results.checks.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
  </section>
  <section className="section" aria-labelledby="offers-title">
   <div className="section-heading"><div><span className="number">02</span><p className="overline">ENTER TWO REAL TOUR OFFERS</p><h2 id="offers-title">What are you considering?</h2></div>
    <p>Enter offer details directly from the operator. Empty means unknown. We list no fabricated tours, prices or booking slots.</p>
   </div>
   <div className="offer-grid">
    {offers.map((q,i)=>{
     const result=results.offers[i];
     return <div className="offer-card" key={q.id}>
      <div className="offer-head"><div><p className="overline">OPTION {q.id.toUpperCase()}</p><h3>{q.label.trim()||"Your excursion offer"}</h3></div><span className={"status status-"+result.status}>{statusLabel[result.status]}</span></div>
      <div className="offer-fields">
       <label htmlFor={"offer-"+q.id+"-label"}>Tour label (optional; no company name needed)
        <input id={"offer-"+q.id+"-label"} type="text" maxLength={80} value={q.label} placeholder="e.g. reef snorkel" onChange={e=>editOffer(q.id,{label:e.target.value})}/>
       </label>
       <label htmlFor={"offer-"+q.id+"-activity"}>Does this require the mainland ferry?
        <select id={"offer-"+q.id+"-activity"} value={q.activity} onChange={e=>editOffer(q.id,{activity:e.target.value as Activity})}>
         {activities.map(([value,title])=><option key={value} value={value}>{title}</option>)}
        </select>
       </label>
       <label htmlFor={"offer-"+q.id+"-channel"}>Who sells this excursion?
        <select id={"offer-"+q.id+"-channel"} value={q.sellerType} onChange={e=>editOffer(q.id,{sellerType:e.target.value as BookingChannel})}>
         {channel.map(([k,t])=><option key={k} value={k}>{t}</option>)}
        </select>
       </label>
       <div className="offer-times">
        <label htmlFor={"offer-"+q.id+"-start"}>Tour starts (SHIP clock)
         <HourInput id={"offer-"+q.id+"-start"} value={q.tourStartShipMinute} onChange={v=>editOffer(q.id,{tourStartShipMinute:v})}/>
        </label>
        <label htmlFor={"offer-"+q.id+"-duration"}>Full tour duration (minutes)
         <CountInput id={"offer-"+q.id+"-duration"} value={q.tourDurationMinutes} onChange={v=>editOffer(q.id,{tourDurationMinutes:v})}/>
        </label>
        <label htmlFor={"offer-"+q.id+"-outbound"}>Pier → meeting point (minutes)
         <CountInput id={"offer-"+q.id+"-outbound"} value={q.pierToMeetingMinutes} onChange={v=>editOffer(q.id,{pierToMeetingMinutes:v})}/>
        </label>
        <label htmlFor={"offer-"+q.id+"-checkin"}>Extra operator check-in time (minutes)
         <CountInput id={"offer-"+q.id+"-checkin"} value={q.checkInMinutes} onChange={v=>editOffer(q.id,{checkInMinutes:v})}/>
        </label>
        <label htmlFor={"offer-"+q.id+"-return"}>Tour finish → ship's pier (minutes)
         <CountInput id={"offer-"+q.id+"-return"} value={q.finishToPierMinutes} onChange={v=>editOffer(q.id,{finishToPierMinutes:v})}/>
        </label>
       </div>
       <details className="offer-evidence" open={i===0}>
        <summary>Verify booking, timing, and price details</summary>
        <div className="offer-verify">
         {([
          ["dateSpecificTourConfirmed","Actual cruise date and tour start are confirmed by seller"],
          ["meetingAtCorrectPier","Operator gave a meeting point at MY actual pier"],
          ["offerTimesOnShipClock","Seller times converted to SHIP time (not assumed local)"],
          ["ageAndAccessibilityTermsChecked","All travelers meet age, boarding and activity requirements"],
          ["missedPortCancellationReviewed","Written missed-port / cancellation policy reviewed"]
         ] as const).map(([key,label])=><label key={key} htmlFor={"offer-"+q.id+"-"+key}>{label}
          <SelectYes id={"offer-"+q.id+"-"+key} value={q[key]} onChange={v=>editOffer(q.id,{[key]:v})}/>
         </label>)}
         <label htmlFor={"offer-"+q.id+"-currency"}>Quote currency
          <select id={"offer-"+q.id+"-currency"} value={q.currency} onChange={e=>editOffer(q.id,{currency:e.target.value as Offer["currency"]})}>
           <option value="unknown">Unknown</option><option value="USD">USD — seller confirmed</option><option value="other">Different currency — no price total</option>
          </select>
         </label>
         <label htmlFor={"offer-"+q.id+"-perperson"}>Written price per traveler (USD)
          <MoneyInput id={"offer-"+q.id+"-perperson"} value={q.pricePerPerson} onChange={v=>editOffer(q.id,{pricePerPerson:v})}/>
         </label>
         <label htmlFor={"offer-"+q.id+"-fees"}>All mandatory extra fees for the whole party (USD)
          <MoneyInput id={"offer-"+q.id+"-fees"} value={q.mandatoryAdditionalTotal} onChange={v=>editOffer(q.id,{mandatoryAdditionalTotal:v})}/>
          <small>Enter 0 only if the operator confirms there are no additional mandatory fees.</small>
         </label>
        </div>
       </details>
      </div>
      <div className={"offer-result offer-result-"+result.status} aria-label={"Option "+q.id.toUpperCase()+" assessment"} role="region" aria-live="polite">
       <strong>{result.headline}</strong>
       {result.estimatedPierReturnShipMinute!==null&&<div className="timing">
        <div><span>Earliest possible meeting</span><b>{clock(result.earliestPossibleMeetingMinute)}</b></div>
        <div><span>Estimated return to pier</span><b>{clock(result.estimatedPierReturnShipMinute)}</b></div>
        <div><span>Return cutoff (your buffer)</span><b>{clock(result.latestConservativePierReturnMinute)}</b></div>
        <div><span>Buffer slack</span><b>{result.slackMinutes} min</b></div>
       </div>}
       {result.totalGroupPriceUSD!==null&&<p className="group-cost">Self-reported group price: <b>{money(result.totalGroupPriceUSD)}</b> · not a verified checkout</p>}
       <ul>{result.issues.map((issue,j)=><li key={j}>{issue}</li>)}</ul>
      </div>
     </div>;
    })}
   </div>
  </section>
  <section className="section summary" aria-labelledby="summary-title">
   <div className="section-heading"><div><span className="number">03</span><p className="overline">FINAL PURCHASE SCREEN</p><h2 id="summary-title">What you can—and cannot—conclude</h2></div></div>
   <div className="summary-grid"><div>
    <p className="summary-stat">{totalConditional}<span> / 2</span></p><p>offers have a <em>tentative arithmetic window fit</em>, not a verified reservation or safe return guarantee.</p>
   </div><div><h3>Before paying</h3><ol>
    <li>Verify port, date, ship all-aboard and ship-vs-local clock aboard your ship.</li>
    <li>Ask the tour seller to confirm pickup, transit, full duration, actual tour date, late-return protection and missed-port refund.</li>
    <li>For any ferry/mainland trip, verify live ferry and road connections manually—this app will not approve it based on arithmetic alone.</li>
   </ol></div></div>
   <div className="actions"><button type="button" onClick={()=>void copy()}>Copy complete audit</button><button type="button" className="button-secondary" onClick={download}>Download independent checklist (.txt)</button></div>
   {feedback&&<p role="status" className="feedback">{feedback}</p>}
  </section>
  <footer className="footer"><div><p className="overline">EVIDENCE & LIMITS</p><h3>Official cruise-line policies and local operator guidance</h3>
   <p>Royal Caribbean generally schedules all aboard about 30 minutes before departure, but the exact onboard notice governs. Carnival and Royal Caribbean treat self-booked excursions differently from line-sold trips. Cozumel can use a different clock.</p>
   <ul>{headings.map(([key,label])=><li key={key}><a href={COZUMEL_SOURCES[key]} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul>
  </div><div><p className="overline">PRIVACY · NO COMMERCIAL LINKS</p>
   <p>All entries remain in the browser tab. No passwords, cruise booking numbers, dates of birth, location, prices, itinerary details or contact information are sent to us. We make no operator claim, availability check, referral, affiliate offer, ticket sale or ship-return warranty.</p>
   <small>Source snapshot: {COZUMEL_REVIEWED} · Manual recheck required within 45 days. This is a research pilot, not travel-agent advice.</small>
  </div></footer>
 </main>;
}
