"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {filterProjectWorkflows,type ProjectGoal,type ProjectRegion} from "../../lib/project-directory";
import "./projects.css";
const projects=[["all","All supported projects"],["space-heat-pump","Heating/cooling heat pump"],["water-heater","Heat-pump water heater"]] as const;
const regions=[["all","Any supported location"],["or","Oregon"],["ma","Massachusetts"]] as const;
export default function Projects(){
 const [goal,setGoal]=useState<ProjectGoal>("all");
 const [region,setRegion]=useState<ProjectRegion>("all");
 const matches=useMemo(()=>filterProjectWorkflows(goal,region),[goal,region]);
 return <main className="project-finder">
  <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / Choose a project</nav>
  <header><p className="project-kicker">START WITH YOUR HOME PROJECT</p><h1>Find the right planning tool before comparing prices.</h1>
   <p>Select the type of work and its location. The tools are designed for specific programs and jurisdictions; using a water-heater rebate on a space-heating project can produce a misleading estimate.</p></header>
  <section className="project-finder-form" aria-labelledby="project-start-heading">
   <h2 id="project-start-heading">Find a supported project in two choices</h2>
   <div className="project-filter-fields">
    <label htmlFor="pf-project">1. What are you installing?
      <select id="pf-project" value={goal} onChange={e=>setGoal(e.target.value as ProjectGoal)}>
       {projects.map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label htmlFor="pf-region">2. Where is the property?
      <select id="pf-region" value={region} onChange={e=>setRegion(e.target.value as ProjectRegion)}>
       {regions.map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
    </label>
   </div>
   <p className="project-match-count" role="status">{matches.length} matching project planner{matches.length===1?"":"s"}</p>
  </section>
  <section aria-labelledby="project-options-heading">
   <h2 id="project-options-heading">Choose a supported workflow</h2>
   {matches.length?<ul className="project-card-grid">{matches.map(p=><li key={p.id} className="project-finder-card">
     <h3>{p.name}</h3><p><strong>Use this when:</strong> {p.useWhen}</p>
     <p><strong>Verify independently:</strong> {p.confirm}</p>
     <p><strong>Not for:</strong> {p.notFor}</p>
     <Link href={p.href}>Open project planner <span aria-hidden="true">→</span></Link>
   </li>)}</ul>:<div className="project-no-match">
     <p>This combination is not supported. Do not apply Oregon program rates to a Massachusetts project or water-heater incentives to space-heating equipment.</p>
     <button type="button" onClick={()=>{setGoal("all");setRegion("all")}}>Show all project planners</button>
   </div>}
  </section>
  <aside className="project-finder-note"><h2>How to get the most useful result</h2>
   <ol><li>Choose the correct equipment and actual property jurisdiction.</li><li>Enter only information you can confirm from your proposal, utility bill or government program.</li>
    <li>Compare identical installation scope and price basis, then verify official program terms before signing.</li></ol>
   <p>These independent planning tools do not issue permits, confirm funding, or collect your address, utility account or income.</p>
  </aside>
 </main>;
}
