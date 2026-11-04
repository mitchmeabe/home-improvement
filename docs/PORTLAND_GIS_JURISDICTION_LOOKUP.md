# Portland official address-point jurisdiction lookup — engineering acceptance

**Date:** November 4, 2026
**New capability:** A user-initiated, client-side City GIS lookup inside the Oregon project dossier route `/projects/oregon-requirements`.
**Stack:** Draft PR on top of Home Improvement #16 (itself on #15). No merge to `main` or public release.

## Official data source and legal boundary

- **City of Portland's public ArcGIS Active Address Points layer:** https://www.portlandmaps.com/arcgis/rest/services/Public/CGIS_MJ_Address_Taxlot/MapServer/0
- **ArcGIS REST query endpoint:** https://www.portlandmaps.com/arcgis/rest/services/Public/CGIS_MJ_Address_Taxlot/MapServer/0/query
- **City's instructions to inspect the jurisdiction field:** https://www.portland.gov/phb/rental-services/helpdesk/portland-maps
- **Official parcel-detail portal for manual follow-up:** https://www.portlandmaps.com/
- **No licensed PortlandMaps API key used.** `/api/suggest/` needs a registered key, but the separate public ArcGIS service is queryable without a key. Do not misrepresent the endpoint as the key-protected suggest API.

The City reports the `JURISDICTION_NAME` for official *address points*, not a formal permit adjudication. Matching an address point does not independently establish parcel boundaries, zoning, exact legal dwelling classification, annexation at a past date, electrical or mechanical permit application status, utility territory, licensed contractor, project funding, or an issued approval. Published conditional Portland rules still require an appropriate residence and work scope.

## Source queries verified against actual public records

**Read-only, anonymous requests tested November 4, 2026:**
- Public City office, `1120 SW 5th Ave`, ZIP `97204`: exactly 3 active address entries, all the same public property ID, `JURISDICTION_NAME=PORTLAND`, `STATE_ABBREVIATION=OR`. Direct application parser returns `portland` with exact active-address evidence and official parcel detail link.
- Gresham City Hall, `1333 NW Eastman Pkwy`, ZIP `97030`: one active address entry, `JURISDICTION_NAME=GRESHAM`, `STATE_ABBREVIATION=OR`. Direct application parser returns `other-oregon`, so Portland permit rules are never applied.
- Nonsensical unit `9999` at the City-office address: no exact unit record; returns `not-found`, never a nearby/similar parcel's jurisdiction.
- A cross-origin request using `Origin: https://example.com` returned HTTP 200 and `Access-Control-Allow-Origin: https://example.com`. This demonstrates permissive cross-origin responses in the isolated Node environment, **not an actual browser test in the protected deployment**.
- City `ADDRESS_NUMBER_CHAR` returns e.g. `1120`, rather than just a suffix. The real-file test exposed and corrected an overly strict equality check: the parser now accepts empty or exact matching number strings but rejects `1120A` when only `1120` was entered.

## Exact-match and fail-closed design

Only a deliberately narrow address grammar is accepted: numeric street number, optional prefix direction, exact street name, recognized street-type suffix, optional unit and five-digit ZIP. No geocoder, fuzzy match, longitude/latitude, arbitrary SQL, neighborhood guessing or ZIP-based permit conclusions.

The REST query selects only these official fields:
`ADDRESS_FULL, ADDRESS_NUMBER, ADDRESS_NUMBER_CHAR, STREET_NAME, STREET_PREFIX_DIRECTION, STREET_POST_DIRECTION, STREET_TYPE_CODE, UNIT, ZIP_CODE, JURISDICTION_NAME, STATE_ABBREVIATION, STATUS, PROPERTY_ID`.

It sets `returnGeometry=false` and never requests owner, assessment or contact information. Client-side validation requires the full numeric/string identity, active status, same city jurisdiction, supported state, and at most one determinable parcel ID. Multiple conflicting jurisdictions, ambiguous/mixed parcel IDs, more than 100 records, missing state, a non-active record, unit mismatch, no record, malformed address, API error and rate limits all produce an unresolved result without Portland permit authority.

If the record reports Portland, the existing dossier composes the Portland permit rules *conditionally on the separately selected building class and work scope*. If it reports another Oregon city, Portland rules are not applied. Out-of-Oregon addresses do not inherit Oregon incentives.

## Privacy and consent

The address fields are **not** searched on typing or page load. Clicking `Check City GIS jurisdiction` initiates a direct browser-to-City request; the City may log the address components and connection metadata. The site does not proxy the request, store the address in its own database or browser storage, insert it in analytics custom events, or export it in the generated dossier. The address entry clears after an exact result. The dossier retains only source, jurisdiction class, match category and observation date (not house number/street, ZIP, unit or property identifier). The optional City parcel detail link is displayed on the live page only.

Changing the address, clearing it, or overriding jurisdiction manually invalidates previous official result state. In-flight requests can be aborted. If the municipal service is unavailable, a plain link to the government's own PortlandMaps search remains usable.

Privacy page was amended to disclose the explicit data transfer to the municipal service, the site's non-retention, and the fact that the City controls its logs.

## Validation

- Direct City ArcGIS endpoint exercised via actual anonymous HTTP GET requests for two public civic locations and a deliberately nonexistent unit.
- The City's exact live `ADDRESS_NUMBER_CHAR` semantics and CORS behavior checked rather than guessed.
- Existing Node unit runner extended with new deterministic tests for query construction, exact match, ambiguous/truncated/retired/error cases, wrong unit/ZIP, malformed/SQL-like input, active City and other-Oregon jurisdictions, absent state, missing/mixed parcel IDs, authorized request options and truthful no-approval dossier reports.
- No GitHub Actions, new CI infrastructure, credentials, secrets, background scrapers, app server routes or address persistence introduced.
- Vercel protected preview build and TypeScript checks are separate from Node unit acceptance; neither substitutes for interactive browser/mobile testing.

## Remaining acceptance limitations

**A full authenticated browser UI test is still outstanding.** The official endpoint is public, but the Home Improvement Vercel preview remains protected. City GIS responses may change shape, data coverage or CORS policy. Some address variants, rural roads, number suffixes, intersections and fuzzy names are intentionally unsupported and require manual PortlandMaps lookup. The address-point record cannot replace checking the official property's detail and the permit authority before hiring or filing. The platform does not prove that all city/county jurisdictions or utility incentives have been resolved.
