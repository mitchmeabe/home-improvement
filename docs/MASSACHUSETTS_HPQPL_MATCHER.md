# Massachusetts HPQPL equipment matcher — tested against an actual Mass Save XLSX

**Source inspected:** Mass Save [Heat Pump Qualified Product List](https://www.masssave.com/heat-pump-qualified-list), [public XLSX download](https://www.masssave.com/-/media/Files/PDFs/Mass-Save-Heat-Pump-QPL.xlsx). Retrieved directly from Mass Save in an isolated networked validation environment on **November 4, 2026**.

## Actual workbook evidence

- **Size:** 32,691,017 bytes (31.2 MiB). The PR #14 upload limit of 20 MiB rejected the authentic file, even though its reader was otherwise correctly using `read-excel-file/browser` version 9.3.12. That package's default export *does* return arrays of `{sheet,data}` objects; the original earlier diagnosis of that API shape was incorrect.
- **SHA-256:** `fc18759d904e4195c2ecd41fe2fd48b25aafc6f527b6d8f51cbc964a86ada23c`.
- **Workbook sheet count:** 10. The `Read Me` worksheet's `Data updated` entry is Excel date serial `46292`, equivalent to **2026-09-27**. This date comes from the workbook, not the time a homeowner uploads it.
- **Main `Air Source Heat Pump` tab:** worksheet dimension `A1:Z205863`; package version 9.3.12 `readSheet(...,"Air Source Heat Pump")` produces **204,559 rows** including its header. The current HPQPL normalizer produced **204,558 candidate equipment rows**, **zero schema warnings** and **1,307 rows with a parsed `Date No Longer Eligible`** (zero unparseable nonempty expiry dates). A clean parse + normalizer ran in about **11.3 seconds**, consuming roughly **1 GB RSS** in isolated Node. This does not establish equivalent speed or memory use in the browser.
- **Actual positive example:** AHRI `218636276`, outdoor `H18TT2`, indoor `H18TT2-I`, `R-32`, 18,000 BTU/h, `Residential & Commercial`, main tab row 1806. The application normalizer and matcher returned `listed-residential` when evaluated using the genuine downloaded file. This verifies a dated *row match*, **not** AHRI certification, a live government approval, sponsor eligibility or a paid rebate.
- **High Velocity ASHPs:** parsed 6 equipment rows from the current workbook with the same scheme and no normalizer warnings.
- **Other tabs:** `Residential Air to Water HPs` and integrated-controls worksheets lack the AHRI/outdoor-column pair the current matching algorithm requires. Residential GSHP and several commercial tabs lack comparable rebate-type evidence; the 2026 implementation therefore **does not offer those tabs** in the residential air-source selector.

## Corrections in the reviewed integration

1. **Authentic XLSX size:** increased browser upload maximum to 64 MiB. No raw workbook is committed, uploaded to the website or included in a client bundle.
2. **Memory / worksheet scope:** switched from parsing all sheets simultaneously to `readSheet(file,selectedSheet)` with a limited choice of the two verified air-source tabs. Users can change tabs without uploading the file again. Processing remains local to the browser.
3. **Source metadata:** parse the workbook's `Read Me` update date, distinguish it from import date, and display both with the caution that the file itself is user-supplied and not source-authenticated.
4. **Expiry:** normalize the real `Date No Longer Eligible` header and parse dates from Excel serials, ISO, US-formatted text or JS dates. For matched systems, a known expiration on/before the reference date yields `listing-expired` and no supported rebate-capacity match. Unknown nonempty dates and contradictory expiry rows fail closed.
5. **Scope:** classify a quoted system as residential-listed only when a consistent AHRI + exact indoor + outdoor combination and residential rebate type exist. Unknown indoor configurations, wildcards, absent entries, commercial-only rows and non-comparable tabs do not establish residential qualification.
6. **Regression tests:** a stable synthetic fixture uses the **actual 26-column Air Source Heat Pump worksheet header**, actual example identifiers and representative cells; the tests cover source date conversion, expiry, ambiguity, commercially scoped entries, exact matching and missing indoor units.

## Remaining acceptance boundaries

- **Private browser verification is still needed.** The full 204k-row import uses substantial memory (~1 GB in Node). The available isolated test proves the real parser/normalizer works, not that all target browsers/mobile devices handle it well. The upload control does not enforce source authenticity. Do not claim browser acceptance.
- **The workbook can change.** The named tabs, headers, number of rows and update date are **observations of the downloaded 2026-09-27 data**; users should retrieve the current official file and verify the source/date at decision time. A not-found result in one tab is not proof that the equipment is unqualified in every category.
- **Mass Save rebate qualification is more than equipment listing.** Utility sponsor, program year, installation date, old fuel/system, weatherization, participating contractor, project scope, documentation, air-flow and other program conditions still require individual confirmation. A listed row is not a rebate award.
- **AHRI certification is a separate check.** The workbook row is evidence to investigate. It is not an authenticated AHRI certified reference or equipment registration. The official [AHRI Directory](https://www.ahrinet.org/certification/ahri-directory) is a separate source.
- **No unattended ingestion or provenance verification.** No service-side official snapshot has been published to the app. User-supplied workbook metadata is not a verified chain of custody.

## Integration

The new consolidated Home Improvement PR stacks on #13 and #14, preserves the existing Massachusetts proposal auditor and buyer comparisons, leaves `main` and public indexing unchanged, and intentionally has no GitHub Actions, new CI workflow, affiliate/checkout integration, or public release.
