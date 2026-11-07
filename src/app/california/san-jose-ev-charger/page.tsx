"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {track} from "@vercel/analytics";
import {SJ_INITIAL,SJ_EV_REVIEWED,SJ_EV_SOURCES,screenSanJoseEV,sanJoseEVChecklist,type SJInput} from "../../../lib/san-jose-ev";
import {SanJoseEVQuoteWorkspace} from "../../../components/san-jose-ev-quote-workspace";
import {SanJoseEVPanelAlternatives} from "../../../components/san-jose-ev-panel-alternatives";
import "./ev-charger.css";
type Field=keyof SJInput;
const options:[Field,string,[string,string][]][]=[
 ["location","1. Is the property inside the City of San José building jurisdiction?",[["unsure","Not verified"],["city-verified","Yes, I checked actual city jurisdiction"],["elsewhere","Outside San José city jurisdiction"]]],
 ["property","2. What property and parking arrangement is this?",[["unsure","Not sure"],["single-duplex","Single-family home or duplex"],["multi-assigned","Multifamily: my assigned parking space"],["multi-common","Multifamily: common or shared parking"],["other","Commercial or other"]]],
 ["charge","3. What charging equipment and wiring work are planned?",[["unsure","Not sure yet"],["level1-existing","Use existing suitable Level 1 (120V) outlet; no new electrical work"],["level1-new-outlet","Install a NEW 120V outlet for Level 1"],["level2","Install Level 2 (240V) charging equipment"]]],
 ["panel","4. Is a main electrical service panel change proposed?",[["unsure","Not determined by an electrician"],["not-proposed","No panel change proposed"],["proposed","Yes, a separate panel change is proposed"]]],
 ["ventilation","5. For Level 2, does the manufacturer require mechanical ventilation?",[["unsure","Not checked or not applicable"],["confirmed-not-required","No, checked the exact manufacturer manual"],["requires-mechanical","Yes, manual says ventilation required"]]]
];
export default function SanJoseEVPage(){
 const [input,setInput]=useState<SJInput>({...SJ_INITIAL});
 const [note,setNote]=useState("");
 const [started,setStarted]=useState(false);
 const [quoteIntent,setQuoteIntent]=useState(false);
 const outcome=useMemo(()=>screenSanJoseEV(input,new Date().toISOString().slice(0,10)),[input]);
 function change(key:Field,v:string){if(!started){track("sj_ev_matcher_start");setStarted(true)}setInput(old=>({...old,[key]:v}));setNote("");setQuoteIntent(false);}
 async function copy(){try{await navigator.clipboard.writeText(sanJoseEVChecklist(outcome));setNote("Project checklist copied.");track("sj_ev_checklist_copied");}catch{setNote("Clipboard unavailable. The checklist is displayed below.");}}
 const readable=(v:string)=>v==="required"?"Required by City guidance":v==="not-indicated"?"Not indicated for reported work":v==="possibly-required"?"Possible additional permit":v==="separate-if-proposed"?"Separate permit review":v==="likely-online"?"Online permit wizard may apply":v==="agency-confirm"?"Ask the permitting office":"Verify with City";
 return <main className="sjev">
 <nav className="sjev-nav"><Link href="/projects">Home Improvement / project planners</Link><span>SAN JOSÉ • CALIFORNIA</span></nav>
 <header className="sjev-hero"><p className="sjev-kicker">PRIVATE RESEARCH PILOT · SOURCE REVIEW {SJ_EV_REVIEWED}</p><h1>Plan an EV charger installation before getting quotes.</h1><p>Distinguish existing 120V charging, a new outlet, Level 2 installation, multifamily parking and separate service-panel work. See the correct city permit questions and what to ask an electrician.</p></header>
 <aside className="sjev-warning"><strong>Electrical safety and jurisdiction:</strong> This is not an electrical load calculation, construction design, permit approval, rebate offer, or installer referral. A qualified electrician and the City determine the actual requirements. No user address or utility account is collected.</aside>
 <div className="sjev-layout"><section className="sjev-card"><h2>Five project questions</h2>
 {options.map(([key,label,values])=><label key={key} className="sjev-field" htmlFor={"sj-"+key}>{label}<select id={"sj-"+key} value={input[key]} onChange={e=>change(key,e.target.value)}>{values.map(([v,txt])=><option value={v} key={v}>{txt}</option>)}</select></label>)}
 <p className="sjev-sub">A San José postal address does not always mean San José controls the permit. Verify the municipality rather than inferring from ZIP code.</p></section>
 <section className="sjev-card sjev-result" aria-live="polite"><span className="sjev-tag">{outcome.status==="source-review"?"Evidence review due":outcome.status==="verify"||outcome.status==="outside-scope"||outcome.status==="additional-review"?"More verification needed":"Permit planning result"}</span>
 <h2>{outcome.heading}</h2><p>{outcome.summary}</p>
 <div className="sjev-facts"><div><small>Electrical permit</small><strong>{readable(outcome.electricalPermit)}</strong></div><div><small>Mechanical permit</small><strong>{readable(outcome.mechanicalPermit)}</strong></div><div><small>Panel permit</small><strong>{readable(outcome.panelPermit)}</strong></div><div><small>Application route</small><strong>{readable(outcome.onlinePath)}</strong></div></div>
 <h3>Project and quote checklist</h3><ol>{outcome.nextSteps.map(s=><li key={s}>{s}</li>)}</ol>
 <button type="button" onClick={copy}>Copy project checklist</button>{note&&<p role="status">{note}</p>}
 <h3>City and technical sources</h3><ul>{outcome.sourceKeys.map(k=><li key={k}><a href={SJ_EV_SOURCES[k].url} target="_blank" rel="noopener noreferrer" onClick={()=>track("sj_ev_official_outbound")}>{SJ_EV_SOURCES[k].label} ↗</a></li>)}</ul>
 </section></div>
 <section className="sjev-card"><h2>Before paying an installer</h2><ol>
 <li>Ask for a documented electrical load calculation or manufacturer-supported load-management proposal. A 100-amp panel alone does not prove replacement is necessary.</li>
 <li>Confirm exact equipment, new circuit or outlet, breaker and wiring scope, permit responsibility, inspection, and whether any utility service coordination is required.</li>
 <li>Check current City requirements and obtain permit authorization before work that requires it. Verify utility incentives separately; this prototype does not calculate rebates.</li>
 </ol>{outcome.status==="electrical-permit"&&<div className="sjev-quote-interest"><p>Preparing to compare quotes for the reported new electrical work? This does not request bids or contact any contractor.</p><button type="button" disabled={quoteIntent} onClick={()=>{setQuoteIntent(true);track("sj_ev_quote_intent")}}>I plan to compare electrician quotes</button>{quoteIntent&&<p role="status">Quote-shopping interest counted anonymously. No project details or referral request were sent.</p>}</div>}<p>For general home charging considerations, review the <a href={SJ_EV_SOURCES.energy.url} target="_blank" rel="noopener noreferrer" onClick={()=>track("sj_ev_official_outbound")}>US Department of Energy's home charging guide</a>.</p></section>
 <SanJoseEVQuoteWorkspace plan={input} permit={outcome}/>
 <SanJoseEVPanelAlternatives key={input.location+':'+input.property+':'+input.charge+':'+input.panel+':'+input.ventilation} project={input} permit={outcome}/>
 </main>;
}