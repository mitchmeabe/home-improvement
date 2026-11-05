# Real contractor-proposal layout audit — pricing and rebate separation

**Review:** November 5, 2026  
**Scope:** Private accuracy research and fail-closed import tests. No homeowner documents uploaded to the product, no accounts, no contact or outreach, no rebate applications or purchase.

## Authentic reference

A **five-page residential heat-pump installation proposal** is available in a public municipal permit record maintained by the City of Portland, Maine:

https://parcelsfolder.portlandmaine.gov/Files/047/047%20%20C025/Building%20Permits/2016-01468%20HVAC/2.%20Documents/Product%20info.pdf

This is a real historical **2015** installer proposal, **not a current Massachusetts quote, current Maine rebate recommendation, or evidence of 2026 market pricing**. An isolated, domain-restricted read-only fetch on November 5 returned **HTTP 200**, `application/pdf`, **809,536 bytes**, valid `%PDF-` header and source SHA-256 `5e07de1aa2f9d9f6709e9a373dbbc1ed8e52c2ceec1c0cd1a8c82ca204b08736`. The temporary copy was not added to GitHub. PDF parser installation was blocked by the sandbox's network resolver; the tests validate the privacy-scrubbed proposal structure rather than claiming to have executed the original PDF through the app. The public PDF includes private homeowner/contact details; **none of those identifiers, addresses, phone numbers, emails, original PDF pages, or unredacted PDF bytes are committed**.

The proposal's layout separates an installation total, a conditional rebate, and a lower final customer figure. In the PDF text layer the three labels may appear on separate lines from the three numeric entries. It also has operating-cost and energy-savings estimates, equipment specifications, payment installments, and a scope with exclusions. Such documents should not be treated as though every printed dollar amount were a contractor's installed-price quote.

## Verified defect and conservative correction

Previously, the importer recognized phrases like `total installed price` but **not** the simple `Total Cost` used in this real document. More importantly, a lower `Final Cost` printed beside a conditional or “available” rebate could be mistaken for the equivalent gross installed price or used as the basis for subtracting an incentive twice.

The updated `src/lib/proposal-text-import.ts`:
1. Recognizes a single, explicitly priced `Total Cost` as a **candidate** requiring human confirmation (still does not approve a contract).
2. If **any** separate final/net price is present, **withholds automatic installed-price extraction** and warns that the user must establish whether the amount is before or after incentives.
3. Treats a rebate described as **available or conditional** as neither confirmed funding nor an automatic arithmetic deduction, with an explicit warning.
4. Does not attach separately rendered PDF table labels to adjacent/unlabeled money rows.
5. Withholds operating-cost and annual heating-expense values from installed-price recognition.

Six unit tests and two desktop/mobile browser scenarios use *minimal privacy-safe structural reconstructions* of the public proposal's pricing layout and additionally verify unambiguous gross cost, rebate handling, net-only caution, unrelated operating costs, and continued explicit human confirmation. They are not falsely described as executing the original PDF or as true signed-proposal performance statistics.

## Remaining work and boundaries

A robust real-world bid-import release still needs **multiple recent, genuinely redacted Massachusetts contractor proposals** in their original PDF/scan formats and human-reviewed expected outputs. This public Maine case is one useful structural stress test, not a representative performance benchmark. OCR is intentionally not implemented; scanned files must use manual transcription. Never extract a client identity or home address from the public municipal PDF into test fixtures.

The source may be visually inspected through the public permit record. The application itself never contacts that source or transmits homeowner text to any server.

**No final rebate, utility approval, proposal price, contractor compliance, tax credit, or current 2026 sales offer is verified by this historical reference.**
