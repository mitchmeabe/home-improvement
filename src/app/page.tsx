"use client";

import { useMemo, useState } from "react";
import { evaluateHeatPump, RULE_REVIEWED_ON, SOURCES, type Location, type Property, type Wiring, type Equipment, type Status } from "../lib/heat-pump";

function formatStatus(status: Status) {
  return status === "required" ? "Required" : status === "check" ? "Verify" : "Not applicable";
}
function numberOrUndefined(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}
export default function Home() {
  const [location, setLocation] = useState<Location>("portland");
  const [property, setProperty] = useState<Property>("existing-owner-occupied");
  const [equipment, setEquipment] = useState<Equipment>("heat-pump");
  const [wiring, setWiring] = useState<Wiring>("unsure");
  const [hspf2, setHspf2] = useState("");
  const [seer2, setSeer2] = useState("");
  const { result, error } = useMemo(() => {
    try {
      return { result: evaluateHeatPump({ location, property, equipment, wiring, hspf2: numberOrUndefined(hspf2), seer2: numberOrUndefined(seer2) }), error: "" };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input" };
    }
  }, [location, property, equipment, wiring, hspf2, seer2]);

  return <main className="container">
    <header className="topbar"><span className="brand">HOME IMPROVEMENT</span><span className="edition">Early research prototype · Oregon</span></header>
    <section className="hero"><p className="eyebrow">Residential heat pump project planner</p><h1>Plan the work before you pay for it.</h1><p className="lead">An initial checklist of permits and Oregon heat-pump incentive questions, backed by government sources. Not an official eligibility determination.</p></section>
    <div className="grid">
      <section className="panel"><h2>Tell us about the project</h2><p className="muted">Enter basic information. This prototype does not collect your address or income.</p>
        <label htmlFor="location">Property location</label>
        <select id="location" value={location} onChange={(e) => setLocation(e.target.value as Location)}>
          <option value="portland">Within Portland city limits, Oregon</option><option value="other-oregon">Elsewhere in Oregon</option><option value="outside-oregon">Outside Oregon</option><option value="unknown">Not sure</option>
        </select>
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
          <h3>Permits</h3>
          {result.permits.map((finding) => <div className="finding" key={finding.title}><span className={"flag " + finding.status}>{formatStatus(finding.status)}</span><div><strong>{finding.title}</strong><p>{finding.detail} <a href={finding.sourceUrl} target="_blank" rel="noreferrer">Official guidance ↗</a></p></div></div>)}
          <h3>Oregon HP3 incentive funding</h3>
          <div className="notice"><b>{result.funding === "fully-reserved" ? "Fully reserved — existing owner-occupied" : result.funding === "not-applicable" ? "Outside current program scope" : "Current funding & eligibility: verify"}</b><p>{result.fundingExplanation}</p></div>
          <h3>General equipment efficiency check</h3>
          <div className="notice"><b>{result.efficiency === "meets-numeric-thresholds-only" ? "Numeric minimums met (not approval)" : result.efficiency === "below-threshold" ? "Below a general numeric minimum" : "Ratings not yet checked"}</b><p>{result.efficiencyExplanation}</p></div>
        </> : null}
        <div className="next"><h3>Before signing an installation contract</h3><ol><li>Verify the applicable permitting authority and contractor responsibilities.</li><li>Check current incentive funds and conditions with ODOE and an approved contractor.</li><li>Confirm equipment model ratings, possible restrictions on stacking, and the invoice requirements.</li></ol></div>
      </section>
    </div>
    <section className="sources"><h2>Official government sources</h2><p className="muted">Reviewed {RULE_REVIEWED_ON}. Funding can change quickly, so confirm live before relying on any incentive.</p><ul>{SOURCES.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></section>
    <footer>Independent planning prototype. Not affiliated with Portland or the Oregon Department of Energy; does not issue permits, verify active incentive reservations or approve eligibility.</footer>
  </main>;
}
