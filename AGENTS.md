# Agent instructions

- The initial Portland/Oregon heat-pump scope is historical. The protected pilot now also covers Oregon project requirements and Massachusetts heat-pump quote analysis. Do not add more project types or jurisdictions until those existing paths are validated.
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

## Protected San José EV integration and acquisition hold (2026-11-06)
- This branch combines the complete quote-parser safety work from draft PR #24 and San José EV permitting pilot PR #25; neither source PR nor main is changed or merged.
- Preserve Vercel all-environment SSO, site-wide noindex and robots Disallow; no public deployment, indexing, permit filing, affiliate code, lead capture or contractor outreach without explicit later owner authorization.
- Events count **only anonymous action types**: first form interaction, successful checklist copy, official source click, and an explicit quote-interest button; never attach answers, property addresses, electrical service details, cost estimates, or user identifiers. Quote intent is NOT an actual referral, sale or partner acceptance.
- The San José organic search/partner hypothesis and honest future editorial page plan are in docs/experiments/san-jose-ev-charger-acquisition-20261106.md.

## San José EV panel-alternative buying audit (2026-11-06)
- The new panel vs managed-charging worksheet is *not* an electrical design tool. Use only for confirmed San José single-family/duplex Level 2 projects with proposed or unresolved panel work; do not extend to multifamily, other cities, Level 1 or utility service upgrades without a new source audit.
- City EV guidance requires a written load calculation including 125% EV charging load for residential service panels rated 125 A or less; this does NOT mean a panel replacement is compulsory. No self-calculated electrical capacity, circuit size, amperage or code approval may be emitted.
- If a panel has an unrelated safety/condition defect, or a qualified electrician finds a managed-only approach technically unsuitable, block quote comparison. Never frame a lower bid as a safe workaround.
- Show a numeric first-year *quoted cost gap* only with two electrician-confirmed technically viable designs meeting the same charging goal, known utility costs, matched price/incentive basis, permit and inspection inclusion, all known fees and first-year ongoing charges, documented equipment and active suitable contractor license check. A quoted cost gap is NOT verified savings or a recommended installer.
- No direct CSLB lookup or PG&E real-time estimate exists. Buyer-entered verification booleans do not certify licenses, insurance, utility approval or compliance. Do not collect license numbers, addresses or contractor identity.
- Preserve signed-off official City and CSLB source-ledger IDs and 30-day stale snapshot gate, site-wide Vercel SSO/noindex, local-only quote data, and no affiliate, contractor referral, provider selection or lead capture. More in `docs/markets/san-jose-ev-panel-alternative-buying-20261106.md`.
