# Agent instructions

- Implement one verified residential heat-pump project in Portland/Oregon first. Do not add all projects or all jurisdictions before product validation.
- Official municipal and program rules supersede AI summaries. Each published rule has a source URL, review date, applicability and exceptions.
- Do not guarantee rebates or tax incentives. Funding availability is a frequently changing snapshot; confirm it live before users commit to work.
- Do not claim a permit or inspection is unnecessary when the facts do not support that determination. Mark uncertain cases as `verify`.
- Keep decision logic pure, separate from the presentation, and add regression fixtures for each supported branch.
- Do not expose a quote-generation or contractor-referral integration without confirmed partners and appropriate disclosure.
- Do not introduce a generic cross-industry rules platform, auth, scraping or payment infrastructure for this initial narrow milestone.
- Use a feature branch, passing tests, and a concise PR. Do not merge automatically.

## Massachusetts market pilot
- Do not reuse Oregon HP3 funding logic or Portland permit statements. Mass Save sponsorship, installation date, heating fuel, whole/partial/basic categorization, qualified products, installer network, and weatherization are independent requirements.
- 2026 published air-source rebates: whole $2,650/ton capped $8,500; partial $1,125/ton capped $8,500; basic $250/ton capped $2,500. Announced 2027 **whole/partial only**: $2,350/ton and $1,000/ton, both capped $7,500; no claimed 2027 basic rate or confirmed enrollment terms.
- Qualified AHRI tonnage is cooling BTU divided by 12,000; hypothetical formula is NOT awarded rebate. Never double-subtract from bids already after rebate or automatically count unsigned offers. No personal income, utility account, exact property address or quote uploads.
- Keep noindex and Vercel SSO until qualified review. Source ledger is manually updated, not an automatic regulation changer.
