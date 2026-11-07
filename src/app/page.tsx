"use client";

import { useMemo, useState } from "react";
import { QuoteReview } from "../components/quote-review";
import { HeatPumpQuoteComparison } from "../components/heat-pump-quote-comparison";
import { evaluateHeatPump, RULE_REVIEWED_ON, FUNDING_SNAPSHOT_AS_OF, SOURCES, type Location, type Property, type Wiring, type Equipment, type Status } from "../lib/heat-pump";
import {resolveOregonProject,LOCAL_REVIEWED_ON,LOCAL_SOURCES,type JurisdictionEvidence,type BuildingKind,type ElectricUtility} from "../lib/oregon-location-matcher";

function formatStatus(status: Status) {
  return status === "required" ? "Required" : status === "check" ? "Verify" : "Not applicable";
}
function numberOrUndefined(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}
export default function Home() {
  const [location, setLocation] = useState<Location>("portland");
  const [jurisdiction, setJurisdiction] = useState<JurisdictionEvidence>("unverified");
  const [building, setBuilding] = useState<BuildingKind>("unknown");
  const [electricUtility, setElectricUtility] = useState<ElectricUtility>("unknown");
  const [property, setProperty] = useState<Property>("existing-owner-occupied");
  const [equipment, setEquipment] = useState<Equipment>("heat-pump");
  const [wiring, setWiring] = useState<Wiring>("unsure");
  const [hspf2, setHspf2] = useState("");
  const [seer2, setSeer2] = useState("");
  const locationMatch = useMemo(()=>resolveOregonProject({
    location,jurisdiction,building,electricUtility,property,equipment,wiring
  }),[location,jurisdiction,building,electricUtility,property,equipment,wiring]);
  const { result, error } = useMemo(() => {
    try {
      return { result: evaluateHeatPump({ location:locationMatch.effectiveLocation, property, equipment, wiring, hspf2: numberOrUndefined(hspf2), seer2: numberOrUndefined(seer2) }), error: "" };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input" };
    }
  }, [locationMatch.effectiveLocation, property, equipment, wiring, hspf2, seer2]);

  return <main className="container">
    
    <section className="improvement-directory-intro"><p className="eyebrow">Independent heat-pump project guidance</p><h1>Compare the real project before accepting a contractor quote.</h1><p>Understand your program questions, spot differences in installation scope, and prepare informed contractor follow-ups. Incentives and permits require official confirmation; no personal account or proposal upload.</p><p className="project-finder-prompt"><a href="/projects"><strong>Need help choosing the right tool?</strong> Select your project and location <span aria-hidden="true">→</span></a></p></section>
    <section className="improvement-directory" id="project-tools" aria-label="Available project planners">
      <a href="/california/san-jose-ev-charger"><b>San José EV charger installation</b><span>Check city permit questions and compare two electrician quotes by charging capability, circuit, load-management and electrical scope.</span><em>Open EV charger planner ↗</em></a>
      <a href="/massachusetts/heat-pumps"><b>Massachusetts heat-pump quote review</b><span>Compare contractor bids, equipment and 2026 or announced 2027 Mass Save program conditions.</span><em>Open Massachusetts planner ↗</em></a>
      <a href="/oregon/heat-pump-water-heaters"><b>Oregon heat-pump water heaters</b><span>Check permits, source-dated incentives, manufacturer model fit and two or three water-heater installation bids.</span><em>Open water-heater planner ↗</em></a>
      <a href="/projects/heat-pump-bid-quality"><b>NEW: Heat-pump bid design and quality check</b><span>Request identical installation proposals; compare sizing evidence, winter capacity, coverage, backup strategy and commissioning.</span><em>Read the heat-pump bid guide ↗</em></a>
      <a href="/projects/oregon-requirements"><b>NEW: Oregon project requirements dossier</b><span>Combine location, project type, permits, panel/circuit work, incentives, and documentation into one exportable report.</span><em>Build Oregon dossier ↗</em></a>
      <a href="#oregon-project"><b>Oregon installation and incentive questions</b><span>Review Portland permit considerations, Oregon HP3 funding limits and contractor quote completeness.</span><em>Open Oregon planner ↓</em></a>
    </section>
    <section className="hero oregon-project-section" id="oregon-project"><p className="eyebrow">Residential heat pump project planner</p><h2 className="homepage-secondary-heading">Plan the work before you pay for it.</h2><p className="lead">An initial checklist of permits and Oregon heat-pump incentive questions, backed by government sources. Not an official eligibility determination.</p></section>
    <div className="grid">
      <section className="panel"><h2>Tell us about the project</h2><p className="muted">Enter basic information. This prototype does not collect your address or income.</p>
        <label htmlFor="location">Property location</label>
        <select id="location" value={location} onChange={(e) => setLocation(e.target.value as Location)}>
          <option value="portland">Within Portland city limits, Oregon</option><option value="other-oregon">Elsewhere in Oregon</option><option value="outside-oregon">Outside Oregon</option><option value="unknown">Not sure</option>
        </select>
        {location!=="outside-oregon"&&<div className="local-project-conditions">
          <h3>Verify jurisdiction and utility service</h3>
          <p className="small">Use <a href={LOCAL_SOURCES.portlandMaps} target="_blank" rel="noreferrer">PortlandMaps</a> to check the property's actual Jurisdiction field. A Portland mailing address or ZIP code is not confirmation; do not enter an address here.</p>
          {location==="portland"&&<><label htmlFor="portland-jurisdiction">What does the official property jurisdiction show?</label>
            <select id="portland-jurisdiction" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value as JurisdictionEvidence)}>
             <option value="unverified">Not checked / mailing address only</option>
             <option value="portland-confirmed">Portland city jurisdiction verified in PortlandMaps</option>
             <option value="not-portland">Not Portland city jurisdiction</option>
            </select></>}
          <label htmlFor="building-structure">Building type for permit/program screening</label>
          <select id="building-structure" value={building} onChange={e=>setBuilding(e.target.value as BuildingKind)}>
           <option value="unknown">Not sure</option><option value="one-two-family">One- or two-family dwelling</option>
           <option value="townhouse-adu">Townhouse or ADU</option><option value="multifamily-other">Larger multifamily / commercial / other</option>
          </select>
          <label htmlFor="electric-utility">Electricity provider shown on your bill</label>
          <select id="electric-utility" value={electricUtility} onChange={e=>setElectricUtility(e.target.value as ElectricUtility)}>
           <option value="unknown">Not checked</option><option value="pge">Portland General Electric</option>
           <option value="pacific-power">Pacific Power</option><option value="other">Another utility</option>
          </select>
        </div>}
        <label htmlFor="property">Property category</label>
        <select id="property" value={property} onChange={(e) => setProperty(e.target.value as Property)}>
          <option value="existing-owner-occupied">Existing home I own and live in</option><option value="existing-rental">Existing long-term residential rental</option><option value="new-construction">New residential construction</option><option value="vacation-or-commercial">Vacation rental or commercial property</option><option value="other">Other / not sure</option>
        </select>
        <label htmlFor="equipment">Equipment project</label>
        <select id="equipment" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
          <option value="heat-pump">Residential heat pump</option><option value="mini-split">Ductless mini-split heat pump</option>
        </select>
        <label htmlFor="wiring">New or modified hard-wired electrical work?</label>
        <select id="wiring" value={wiring} onChange={(e) => setWiring(e.target.value as Wiring)}>
          <option value="unsure">Not sure</option><option value="new-hardwired-work">Yes</option><option value="no-known-work">No known electrical changes</option>
        </select>
        <div className="two">
          <div><label htmlFor="hspf">Equipment HSPF2 (optional)</label><input id="hspf" type="number" min="0" step="0.1" placeholder="e.g. 8.5" value={hspf2} onChange={(e) => setHspf2(e.target.value)} /></div>
          <div><label htmlFor="seer">Equipment SEER2 (optional)</label><input id="seer" type="number" min="0" step="0.1" placeholder="e.g. 17" value={seer2} onChange={(e) => setSeer2(e.target.value)} /></div>
        </div>
        <p className="small">Packaged terminal heat pumps (PTHPs) have special program criteria and are not evaluated here.</p>
      </section>
      <section className="panel results" aria-live="polite"><p className="eyebrow">Your project checklist</p>
        {error ? <p className="warning" role="alert">{error}</p> : result ? <>
          <section className="local-project-results" aria-label="Jurisdiction and utility program matches">
           <h3>Jurisdiction and program matching</h3>
           <p className="small">Source review {LOCAL_REVIEWED_ON}. We do not geocode addresses, confirm utility accounts, reserve funds or determine incentives automatically.</p>
           <p><strong>{locationMatch.permitAuthority==="portland-confirmed"?"Portland permit authority confirmed by your report":
              locationMatch.permitAuthority==="outside-portland"?"Portland permits do not establish your authority":"Permit authority not yet established"}</strong></p>
           {locationMatch.locationFindings.map(x=><div className="finding" key={x.id}>
             <span className={"flag "+(x.status==="required"?"required":x.status==="not-applicable"?"not-applicable":"check")}>{x.status==="required"?"Required":x.status==="not-applicable"?"N/A":"Verify"}</span>
             <div><strong>{x.title}</strong><p>{x.detail} <a href={x.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></p></div>
           </div>)}
           <h3>Potential program routes — not awarded rebates</h3>
           {locationMatch.programs.map(x=><div className="finding" key={x.id}>
             <span className={"flag "+(x.status==="not-applicable"?"not-applicable":"check")}>{x.status==="not-applicable"?"N/A":"Verify"}</span>
             <div><strong>{x.title}</strong><p>{x.detail} <a href={x.sourceUrl} target="_blank" rel="noreferrer">Program instructions ↗</a></p></div>
           </div>)}
           <details><summary><strong>Project-specific contractor questions</strong></summary><ul>{locationMatch.questions.map(q=><li key={q}>{q}</li>)}</ul></details>
          </section>
          <h3>Existing Oregon planner permit checks</h3>
          {result.permits.map((finding) => <div className="finding" key={finding.title}><span className={"flag " + finding.status}>{formatStatus(finding.status)}</span><div><strong>{finding.title}</strong><p>{finding.detail} <a href={finding.sourceUrl} target="_blank" rel="noreferrer">Official guidance ↗</a></p></div></div>)}
          <h3>Oregon HP3 incentive funding</h3><p className="small"><strong>Agency funding table dated {FUNDING_SNAPSHOT_AS_OF}.</strong> This is not a real-time inventory or reservation.</p>
          <div className="notice"><b>{result.funding === "fully-reserved" ? "Fully reserved — existing owner-occupied" : result.funding === "not-applicable" ? "Outside current program scope" : "Current funding & eligibility: verify"}</b><p>{result.fundingExplanation}</p></div>
          <h3>General equipment efficiency check</h3>
          <div className="notice"><b>{result.efficiency === "meets-numeric-thresholds-only" ? "Numeric minimums met (not approval)" : result.efficiency === "below-threshold" ? "Below a general numeric minimum" : "Ratings not yet checked"}</b><p>{result.efficiencyExplanation}</p></div>
        </> : null}
        <div className="next"><h3>Before signing an installation contract</h3><ol><li>Verify the applicable permitting authority and contractor responsibilities.</li><li>Get multiple quotes from ODOE-approved contractors; ask whether a permit and final inspection are included.</li><li>Verify live incentive funding, program restrictions and any limitations on stacking before relying on savings.</li><li>Check that any HP3 discount is applied upfront on your quote and retain the signed final invoice.</li></ol></div>
      </section>
    </div>
    <section id="oregon-quotes"><HeatPumpQuoteComparison location={location} property={property} hspf2={hspf2.trim()===""?null:Number(hspf2)} seer2={seer2.trim()===""?null:Number(seer2)} /></section>
    <div id="review-quote"><QuoteReview funding={result?.funding} /></div>
    <section className="sources"><h2>Official government sources</h2><p className="muted">Reviewed {RULE_REVIEWED_ON}. ODOE funding numbers last updated {FUNDING_SNAPSHOT_AS_OF}. Confirm live before relying on any incentive.</p><ul>{SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
    <footer>Independent planning prototype. Not affiliated with Portland or the Oregon Department of Energy; does not issue permits, verify active incentive reservations or approve eligibility.</footer>
  </main>;
}
