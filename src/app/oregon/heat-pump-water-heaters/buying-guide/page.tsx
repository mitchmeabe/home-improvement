import Link from "next/link";
import {HPWH_FIT_REVIEWED,HPWH_FIT_SOURCES} from "../../../../lib/hpwh-purchase-fit";
import {HPWH_SOURCES} from "../../../../lib/oregon-heat-pump-water-heater";
import "../water-heaters.css";

export default function HPWHBuyingGuide(){
 return <main className="hpwh">
  <nav aria-label="Breadcrumb"><Link href="/oregon/heat-pump-water-heaters">← Oregon water-heater purchase planner</Link></nav>
  <header className="hpwh-hero">
   <p className="hpwh-kicker">CONTRACTOR QUOTE AND MODEL SELECTION GUIDE · {HPWH_FIT_REVIEWED}</p>
   <h1>Will this heat-pump water heater actually fit your home?</h1>
   <p>Before buying a heat-pump water heater, check four separate requirements: peak hot-water delivery, manufacturer-required air, the real electrical connection, and a safe condensate drain. Two tanks with the same gallon capacity or similar price may not satisfy the same household need.</p>
  </header>
  <section className="hpwh-card hpwh-static">
   <h2>1. Compare First Hour Rating, not tank gallons alone</h2>
   <p>First Hour Rating (FHR), shown on the model's EnergyGuide label, is the hot-water volume it can deliver during one hour starting with a full heated tank. Two similarly sized tanks can have different FHR, especially depending on heat-pump versus electric-resistance operation. Your plumber should compare rated FHR to the household's busiest shower/bath periods and applicable plumbing code, rather than assuming that a 50-, 65- or 80-gallon label decides suitability.</p>
   <p>UEF (Uniform Energy Factor) compares laboratory-rated efficiency; by itself it does not predict your personal utility bill or dollar savings. Read the <a href={HPWH_FIT_SOURCES.doe.url} target="_blank" rel="noopener noreferrer">DOE Building America heat-pump water heater engineering overview</a> for both first-hour performance and different 120 V/240 V electrical options.</p>
  </section>
  <section className="hpwh-card hpwh-static">
   <h2>2. Measure the room and verify the model's airflow instructions</h2>
   <p>Many integrated models use ambient air to heat water and need substantial free air volume. ENERGY STAR design guidance gives common manufacturer examples around 450–700 cubic feet, but those are <strong>not universal clearance or code limits</strong>. Manufacturer-specified air volume and service access are the important facts.</p>
   <p>A small closet may still work with a documented, manufacturer-approved louvered-door, transfer-air or ducting configuration. Do not assume that a 700-cubic-foot room automatically has safe airflow, that an open door provides acceptable supply air, or that venting can be installed without the model's specific approval.</p>
   <p>Use the <a href={HPWH_FIT_SOURCES.energyStarDesign.url} target="_blank" rel="noopener noreferrer">ENERGY STAR design and room-air guidance</a>, then request the appliance's actual installation manual and a plumber/HVAC professional's site check.</p>
  </section>
  <section className="hpwh-card hpwh-static">
   <h2>3. Confirm electrical, drainage, location and operating temperature</h2>
   <ol>
    <li><strong>Electrical supply:</strong> Some HPWHs need 240 V with a dedicated circuit; other models use 120 V or have different amperage. Neither a matching outlet-voltage label nor the size of the electrical panel proves that a particular installed circuit can safely supply the appliance. Include needed wiring, breakers, permits and electrician evaluation in the written price.</li>
    <li><strong>Condensate disposal:</strong> Heat-pump operation produces water that needs a suitable drain or a properly routed condensate pump. Ask whether condensate piping and any pump are included; a “water heater installation” line item alone is not proof.</li>
    <li><strong>Cold garages:</strong> ENERGY STAR advises that heat-pump water heaters generally perform best in spaces not regularly colder than about 38°F. This is a buying-review trigger, not a manufacturer-specific prohibition; obtain the exact model's allowed ambient range and backup-heating strategy.</li>
    <li><strong>Comfort and service:</strong> Fan noise and cooled exhaust may matter beside bedrooms or living areas. Check noise rating, physical height and width, filter access, service clearances, leak protection and owner instructions.</li>
   </ol>
   <p><a href={HPWH_FIT_SOURCES.energyStarBuying.url} target="_blank" rel="noopener noreferrer">ENERGY STAR's homeowner installation overview</a> and <a href={HPWH_FIT_SOURCES.energyStarInstall.url} target="_blank" rel="noopener noreferrer">professional installation best practices</a> cover these issues.</p>
  </section>
  <section className="hpwh-card hpwh-static">
   <h2>4. Make two installer quotes comparable</h2>
   <p>Before choosing the lowest price, confirm the same exact model, FHR, efficiency rating, 120 V/240 V circuit requirements, tank and site location, manufacturer's air/vent plan, plumbing/electrical work, condensate, old equipment disposal, permits, inspections and written warranties. A cheaper bid for different hot-water capacity, without the necessary electrical work, or based on an assumed unawarded incentive is not the same purchase.</p>
   <p>For Oregon properties, Portland's <a href={HPWH_SOURCES.plumbing} target="_blank" rel="noopener noreferrer">plumbing permit rules</a> and <a href={HPWH_SOURCES.electrical} target="_blank" rel="noopener noreferrer">electrical guidance</a> are location-specific. A Portland mailing address alone is not proof of City permit jurisdiction; ask the responsible city or county. Energy Trust discounts require current transaction, retailer/distributor and utility-specific verification, not just an advertised dollar amount.</p>
   <p>The independent comparison tool asks for reported room dimensions and model specifications, identifies mismatches, and exports an identical installer quote request. It **does not** approve model sizing, determine safety, generate permits, award rebates or endorse an installer.</p>
   <p><Link href="/oregon/heat-pump-water-heaters#hpwh-installation-fit"><strong>Open the personalized room and quote-fit decision tool →</strong></Link></p>
  </section>
  <section className="hpwh-card hpwh-static">
   <h2>Official technical references</h2>
   <ul>{Object.values(HPWH_FIT_SOURCES).map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>
   <p className="hpwh-muted">Human-reviewed technical sources {HPWH_FIT_REVIEWED}. A manufacturer's installation manual and a qualified professional's site-specific assessment take precedence over generic rules of thumb. This guide is private and not indexed.</p>
  </section>
 </main>;
}
