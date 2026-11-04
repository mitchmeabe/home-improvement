# Private milestone: browser-local contractor proposal text import

- Added opt-in plain-text paste / .txt load inside each Oregon and Massachusetts quote card.
- A deterministic conservative extractor suggests explicitly labeled installed totals, stated rebate amounts, cooling-capacity numbers, scope and before/after-rebate basis; Oregon only imports installed total and scope.
- Every extracted candidate remains unapplied until the user individually checks and applies it.
- Contradictory quoted totals or scopes are withheld, and textual mentions of a permit, warranty or rebate are never converted into confirmed compliance or eligibility.
- No server upload, model/AI processing, OCR, PDF parsing, tracking of pasted content, browser storage or persistent quote identity is added.
- .txt source may contain sensitive data, so the UI prompts the user to redact first. This does not make the source independently trustworthy.

## Deferred
- PDF and scanned proposals require a separate, reviewed extraction/parsing path and privacy review.
- Equipment-model and license-registry verification are not added.
- Real signed homeowner bids, technical expert review and real user acceptance remain public-launch gates.
- Existing noindex, robots disallow, and Vercel protection are unchanged.
