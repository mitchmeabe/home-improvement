# Architecture

Next.js App Router client routes use separate pure TypeScript modules: `src/lib/heat-pump.ts` and `src/lib/heat-pump-quotes.ts` for Oregon, `src/lib/oregon-project-dossier.ts` for project requirements, `src/lib/mass-save.ts` and `src/lib/massachusetts-proposal-audit.ts` for Massachusetts eligibility warnings and bid analysis, and `src/lib/mass-hpqpl.ts` for equipment-list matching.

`src/lib/proposal-pdf-client.ts` and `src/lib/proposal-text-import.ts` generate candidates from locally read text-layer PDFs or text, requiring human confirmation before applying fields to a bid; scans need manual entry. The opt-in `src/lib/portland-jurisdiction-gis.ts` checks City ArcGIS address points conservatively, without determining final permit authority. No quote bytes or residence addresses are stored in an application database.

The rule engine does not fetch live government data and must not be represented as live eligibility verification. Avoid storing entered project details or collecting sensitive personal information in this prototype.

If traffic and demand warrant extension: authoritative official-page fetch -> document/source archival -> typed proposed facts -> deterministic integrity checks -> human review -> versioned effective-dated rules -> regression tests -> publishing with freshness alerts. Separate stable permit rules from volatile program funding snapshots.
