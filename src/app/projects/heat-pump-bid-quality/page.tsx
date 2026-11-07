import Link from "next/link";
import {BID_QUALITY_REVIEWED,BID_QUALITY_SOURCES} from "../../../lib/heat-pump-bid-quality";
import "../projects.css";

export default function HeatPumpBidQualityGuide(){
 return <main className="project-finder" style={{maxWidth:960}}>
  <nav aria-label="Breadcrumb"><Link href="/projects">← Project planners</Link> / Heat-pump installation proposal quality</nav>
  <header>
   <p className="project-kicker">HOMEOWNER BUYING GUIDE · SOURCE REVIEWED {BID_QUALITY_REVIEWED}</p>
   <h1>Compare heat pump installation quotes by design, not just price.</h1>
   <p>A cheaper proposal may cover fewer rooms, use different ductwork, rely on a different winter heating strategy, or omit the evidence needed to evaluate performance. A contractor's promise of similar “tons” is not proof the systems are interchangeable.</p>
  </header>
  <aside className="project-finder-note" style={{borderTop:0,background:"#fff8ec",borderRadius:10,marginTop:20}}>
   This guide does not size equipment, approve permits, verify contractor qualifications, confirm energy savings, or award an incentive. An appropriately qualified HVAC professional must evaluate your actual house and the manufacturer performance data.
  </aside>
  <section className="project-finder-form">
   <h2>The five biggest differences worth investigating</h2>
   <ol>
    <li><strong>Whole-home versus selected-room heating.</strong> Specify which rooms, floors and thermal conditions the system must cover. A ductless head in one room is not automatically equivalent to a whole-home ducted installation.</li>
    <li><strong>Design heating load versus nameplate size.</strong> Ask each bidder for site-specific heating/cooling loads based on ACCA Manual J or an appropriate documented equivalent. Professional equipment selection must consider capacity at local outdoor design temperature, system match and the house—not merely nominal tonnage.</li>
    <li><strong>Existing ducts and delivered airflow.</strong> For ducted work, request an inspection of condition, sizing, leakage and airflow, including repairs or new ductwork. For ductless projects, ask about indoor head placement, refrigerant-line routing and conditioned coverage instead of claiming duct leakage tests are required.</li>
    <li><strong>Backup heating and controls.</strong> An installation that keeps an existing furnace/boiler as backup is different from one designed to replace it entirely or add electric auxiliary heat. Both the comfort outcome and installation scope can change.</li>
    <li><strong>Installation evidence and commissioning.</strong> Clarify mechanical/electrical work, permits, inspections, condensate, startup refrigerant verification, measured airflow where applicable, system controls and written labor/equipment warranties. Ask for a written post-installation verification report.</li>
   </ol>
  </section>
  <section className="project-finder-form">
   <h2>Why two similar quoted totals can still be incomparable</h2>
   <p>Ask bidders to provide the exact matched indoor/outdoor model numbers, heating capacity at the stated winter design temperature, documented building load and served zones. If bidders use different design temperatures, serve a different number of rooms or assume different backup heat, the scope is not yet equivalent. That does not mean either system is technically right or wrong—it means you need clarification from a qualified professional.</p>
   <p>Quoted cost should distinguish before- versus after-incentives pricing and explicitly included ductwork, electrical work, permits and commissioning. Rebates must not be counted as guaranteed savings unless the program and contractor actually confirm them. The companion Oregon heat-pump planner keeps jurisdiction-specific HP3 and Portland permitting questions separate.</p>
  </section>
  <section className="project-dossier-callout">
   <div>
    <p className="project-kicker">INTERACTIVE BUYER TOOL</p>
    <h2>Request identical bids, compare design evidence, and export contractor follow-ups.</h2>
    <p>The Oregon heat-pump quote comparator now includes a bid-specification generator and a detailed quality-evidence workspace for two or three competing proposals. All data stays locally in your browser.</p>
   </div>
   <Link href="/#heat-pump-design-review">Open the heat-pump bid comparison tool →</Link>
  </section>
  <section className="project-finder-form">
   <h2>Primary engineering and public information references</h2>
   <ul>{Object.values(BID_QUALITY_SOURCES).map(source=><li key={source.url}>
    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
   </li>)}</ul>
   <p>ENERGY STAR emphasizes professional sizing, ACCA describes equipment selection using building loads and manufacturer data, and U.S. DOE Building America publishes replacement and commissioning procedures. These references are not an independent inspection of any quote and do not determine Oregon incentive eligibility.</p>
  </section>
  <p>Research snapshot {BID_QUALITY_REVIEWED}. Protected research pilot; no live contractor shopping, referral service, submission, tax-credit estimate or product endorsement.</p>
 </main>;
}
