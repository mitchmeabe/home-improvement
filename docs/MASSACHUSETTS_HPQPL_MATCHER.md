# Massachusetts equipment matching — local HPQPL workbook

## Product capability
The Massachusetts quote comparison accepts the publicly downloadable Mass Save HPQPL .xlsx workbook in the **visitor's browser**. It extracts matching entries, compares the exact **AHRI reference plus outdoor and indoor model identifiers** from each proposal, identifies conflicts/multiple listings/commercial-only entries, and shows the source sheet/row, listed rebate scope and cooling capacity. A dated-list match does not imply final program approval.

The official HPQPL page is https://www.masssave.com/heat-pump-qualified-list and the observed linked spreadsheet URL on November 4, 2026 is https://www.masssave.com/-/media/Files/PDFs/Mass-Save-Heat-Pump-QPL.xlsx .

**Evidence limitation:** The official .xlsx bytes could not be downloaded in this engineering environment. The code therefore does not ship unverified or fabricated model data; it loads a real workbook supplied by the visitor and detects known column patterns, including spelling variants. The workbook parser and exact-match behavior need to be checked against a genuine current HPQPL export before the tool is represented as complete. Imported file name and import date are not official issuance metadata or proof of provenance.

## Behavior
- The locally imported public workbook is never uploaded or persisted.
- An AHRI hit without matching *both* paired model designations is **not** an exact match. Wildcards, omitted indoor models and multi-zone configurations are flagged.
- A commercial-only row or unknown rebate-type column cannot substantiate residential rebates.
- No row is treated as an approved rebate, and a not-found result is not treated as proof of exclusion.
- Contradictory duplicate rows with different eligibility/capacity/refrigerant statuses are marked ambiguous.
- Cooling capacity comes from the matching row only, with tonnage as fallback; conflicts with self-reported quote capacity are flagged.
- When an uploaded workbook is in use, non-matching/ambiguous equipment suppresses conditional post-rebate price arithmetic, while original as-quoted amounts remain visible.
- Source and provenance disclaimers remain in comparison results and copied reports.

## Still missing
- An authenticated, automatic official-data ingestion process with publisher timestamps and source fingerprinting.
- End-to-end verification of the exact Mass Save workbook's sheet/column format.
- Automatic authoritative AHRI certificate retrieval, live qualified-list status and installation-specific rebate approval.
- No public rollout without domain and privacy review; preserve deployment protection and noindex.

This change introduces no GitHub Actions, local validation scripts, Playwright/browser tests, public indexing, user accounts, or referral agreements.