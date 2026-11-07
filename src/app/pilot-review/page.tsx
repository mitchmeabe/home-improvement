import type {Metadata} from "next";
import Link from "next/link";
import "../projects/projects.css";

export const metadata:Metadata={
 title:"Protected Home Improvement Buyer Tools | Private Review",
 robots:{index:false,follow:false},
 description:"Private integration acceptance of three homeowner quote and installation decision workflows."
};

const products=[
 {
  pr:27,
  title:"San José EV charger installation — compare electrician bids",
  market:"San José, California",
  route:"/california/san-jose-ev-charger",
  guide:"/california/san-jose-ev-charger",
  summary:"Distinguish Level 1 and Level 2 installation, potential panel work and city permit questions. Compare two electricians on charger compatibility, breaker/circuit, load-management, wiring, inspection responsibility and actual installed prices.",
  verify:"City permit jurisdiction, proper load calculation, real circuit and service conditions, and an electrician's documented specifications. Not an inspection or electrical approval.",
 },
 {
  pr:28,
  title:"Oregon space-heating heat pump — compare system design evidence",
  market:"Oregon residential space heating",
  route:"/#heat-pump-design-review",
  guide:"/projects/heat-pump-bid-quality",
  summary:"Request common HVAC design evidence and compare two or three installation proposals by served rooms, Manual J/load information, low-temperature heating capacity, backup strategy, ducts/airflow and commissioning.",
  verify:"Qualified designer's building load, actual manufacturer equipment match, permit authority, live HP3 funding and full included work. Not an automatic sizing or rebate award.",
 },
 {
  pr:29,
  title:"Oregon heat-pump water heater — verify model and room fit",
  market:"Oregon residential hot water",
  route:"/oregon/heat-pump-water-heaters#hpwh-installation-fit",
  guide:"/oregon/heat-pump-water-heaters/buying-guide",
  summary:"Compare model-specific First Hour Rating (FHR), room air volume, temperature, voltage, circuit, condensate, and installed bid completeness. Withhold a cheapest-equivalent claim until reported model and site evidence aligns.",
  verify:"Exact manufacturer's manual, room airflow and service space, hot-water peak demand, electrical and plumbing code, permit authority and current water-heater incentive terms.",
 }
] as const;

export default function HomeImprovementPilotReview(){
 return <main className="project-finder" style={{maxWidth:1050}}>
  <nav aria-label="Breadcrumb"><Link href="/projects">Project planners</Link> / Protected review</nav>
  <header>
   <p className="project-kicker">PRIVATE INTEGRATION CANDIDATE · NOVEMBER 6, 2026</p>
   <h1>Three homeowner purchasing decisions, one protected review build.</h1>
   <p>These tools compare installation scope and the evidence behind a contractor's proposal—not arbitrary sponsored rankings. Feature PRs #27, #28 and #29 have been consolidated onto a separate branch without changing their original branches or merging into production.</p>
  </header>
  <section className="project-finder-note" aria-label="Pilot safety and review status">
   <h2>Private release safeguards</h2>
   <p><strong>Not launched:</strong> Vercel login remains required, site-wide search indexing is disabled, and there is no contractor matching, lead collection, affiliate tracking, payment processing or referral revenue. No installer has been approved by this tool.</p>
   <p><strong>Not government decisions:</strong> Incentives, available funding, permits, electrical safety and equipment sizing must all be verified through current official program rules, actual manufacturer instructions, and qualified professionals. Every tool retains its source review and unsupported-case limits.</p>
  </section>
  <section aria-label="Three homeowner purchase reviews" style={{marginTop:26}}>
   <h2>Review each full buyer workflow</h2>
   <div className="project-card-grid" style={{marginTop:18}}>
    {products.map(product=><article key={product.pr} className="project-finder-card" style={{listStyle:"none"}}>
     <p className="project-kicker">{product.market} · ORIGINAL FEATURE PR #{product.pr}</p>
     <h3>{product.title}</h3>
     <p><strong>What it does:</strong> {product.summary}</p>
     <p><strong>Still verify:</strong> {product.verify}</p>
     <p><Link href={product.route}>Open interactive purchasing tool →</Link></p>
     {product.guide!==product.route&&<p><Link href={product.guide}>Read source-backed buying guide →</Link></p>}
     <p><a href={`https://github.com/mitchmeabe/home-improvement/pull/${product.pr}`} target="_blank" rel="noopener noreferrer">Review original draft PR #{product.pr}</a></p>
    </article>)}
   </div>
  </section>
  <section className="project-finder-note" style={{marginTop:26}}>
   <h2>Release and verification status</h2>
   <p>Run all Node tests, TypeScript and source/market/evidence checks, Next.js build and then the real Playwright Chromium test suite. Playwright <em>test discovery</em> alone does not demonstrate the site's functionality works in a browser.</p>
   <p>The next roadmap item is cross-site end-to-end QA and a separate evaluation of customer acquisition and real referral economics before any public launch.</p>
   <p><Link href="/projects">Browse all existing location-specific project planners →</Link></p>
  </section>
 </main>;
}
