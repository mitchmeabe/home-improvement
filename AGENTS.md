# Agent instructions

- Implement one verified residential heat-pump project in Portland/Oregon first. Do not add all projects or all jurisdictions before product validation.
- Official municipal and program rules supersede AI summaries. Each published rule has a source URL, review date, applicability and exceptions.
- Do not guarantee rebates or tax incentives. Funding availability is a frequently changing snapshot; confirm it live before users commit to work.
- Do not claim a permit or inspection is unnecessary when the facts do not support that determination. Mark uncertain cases as `verify`.
- Keep decision logic pure, separate from the presentation, and add regression fixtures for each supported branch.
- Do not expose a quote-generation or contractor-referral integration without confirmed partners and appropriate disclosure.
- Do not introduce a generic cross-industry rules platform, auth, scraping or payment infrastructure for this initial narrow milestone.
- Use a feature branch, passing tests, and a concise PR. Do not merge automatically.

## Quote comparison extension
- Never infer an awarded HP3 rebate from the October 1 funding table or from the $2,000 ceiling. Existing owner-occupied funds are fully reserved in the last published table, and rental/new-construction require live confirmation.
- Never double-subtract a quoted discount that is already included in the installation price. Conditional net cost is only arithmetic on explicitly user-confirmed conditions; not an agency award.
- Never invent annual savings. Ten-year operating costs are calculated only from explicitly entered user-provided estimates and are not a technical equipment efficiency simulation.
- Do not store or transmit quote amounts, applicant addresses or contractor identities through analytics events.
- Sources are human-maintained and held in docs/SOURCE_REGISTRY.json. No automatic rule updates on fetch results; manual review mandatory.


## Massachusetts market pilot
- Do not reuse Oregon HP3 funding logic or Portland permit statements. Mass Save sponsorship, installation date, heating fuel, whole/partial/basic categorization, qualified products, installer network, and weatherization are independent requirements.
- 2026 published air-source rebates: whole $2,650/ton capped $8,500; partial $1,125/ton capped $8,500; basic $250/ton capped $2,500. Announced 2027 **whole/partial only**: $2,350/ton and $1,000/ton, both capped $7,500; no claimed 2027 basic rate or confirmed enrollment terms.
- Qualified AHRI tonnage is cooling BTU divided by 12,000; hypothetical formula is NOT awarded rebate. Never double-subtract from bids already after rebate or automatically count unsigned offers. No personal income, utility account, exact property address or quote uploads.
- Keep noindex and Vercel SSO until qualified review. Source ledger is manually updated, not an automatic regulation changer.

## Massachusetts quote acceptance and competition
- Only rank quotes when their broad installation scope (ducted reused, new ductwork, ductless, mixed) AND before/after-rebate basis are the same and known. Still never call the lowest quote 'best'.
- Real-world public homeowner anecdotes are *unverified reports*; never present as authentic signed contractor PDFs, independently evaluated actual work, or current price benchmarks.
- Mass Save offers no-cost quote review consultations; municipal utility networks sometimes use Abode. Never claim unique service or guaranteed affiliate demand.
- Anonymous click events for multiple-bid readiness, report copy and official support use no price, equipment ID, identity or location data.
