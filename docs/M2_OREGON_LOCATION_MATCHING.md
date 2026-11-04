# Milestone 2 — Oregon residential heat-pump location and program matching

Reviewed 2026-11-04; protected/noindex private research pilot.

## Why source-backed jurisdiction matters
Portland Permitting & Development warns that a Portland mailing address or ZIP does not prove Portland city jurisdiction. Verify the actual property's jurisdiction in PortlandMaps. Never infer city jurisdiction from a postal city, county, or ZIP.
Primary: https://www.portland.gov/ppd/property-addressing
Map: https://www.portlandmaps.com/
Within Portland city and supported one/two-family residences, townhouses or ADUs, the city lists heat pumps/mini-splits as mechanically permitted work and most equipment projects require electrical permits; new/changed hard-wiring requires electrical permit. Source: https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits and https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits .

## Programs checked
- Oregon HP3 statewide (not tied to one city or utility). ODOE 2026-10-01 funding table had existing owner-occupied funds fully reserved; other categories were listed but current funding has not been checked. Site: https://www.oregon.gov/energy/incentives/Pages/HP3.aspx
- Energy Trust residential program intake lists PGE and Pacific Power among electric utilities, and restricts/redirects certain structure types. Source: https://form.energytrust.org/ ; PGE heat-pump guidance: https://portlandgeneral.com/save-money/save-money-home/heating-cooling/high-efficiency-heat-pumps
- Pacific Power's 2026 official bill insert references Energy Trust heat pump incentives subject to program requirements: https://www.pacificpower.net/content/dam/pcorp/documents/en/pacificpower/my-account/bill-inserts/or/PP_OR_ETO_Incentives_Jan2026.pdf

## Implemented
- User-confirmed (not geocoded) jurisdiction state, building class, utility on bill, and existing property/project.
- Pure source-backed route matcher for city mechanical/electrical and outdoor equipment siting, statewide HP3 and potential utility-specific Energy Trust inquiry.
- Suppresses automatic Portland mechanical permit conclusion when property jurisdiction is not confirmed or housing class is unsupported.
- Never estimates a rebate value, live funding balance, or eligible contractor; no stacked-rebate arithmetic or address collection.
- Fully retains Oregon HP3 and existing contractor bid comparison; adds focused tests for false Portland positives, rentals, out-of-state, utility uncertainty and electrically altered work.
- Rule and program information are snapshots for human review, not automatically updated live agency data.

## Unsupported
Automated address or assessor lookup, utility account confirmation, permit submissions, permit fees, zoning/HOA approval, and real-time Energy Trust or HP3 award decisions. Other Oregon cities must still consult their own permit authorities. Before public launch, expert review and realistic homeowner acceptance tests remain necessary.
