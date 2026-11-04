# Milestone 1: browser-local text-based PDF import

Added opt-in .pdf and .txt import to the existing Oregon and Massachusetts proposal-review components. PDF text is read in the browser via bundled Mozilla pdfjs-dist 6.5.438, not sent to the server, a third-party AI service or analytics. The PDF.js worker is loaded from the application bundle, not a CDN.

## Safeguards
- Validate .pdf filename, %PDF- header, up to 5 MB and 12 pages; at most 25,000 extracted characters.
- Extract positioned text items into separate rows to reduce misleading cross-line label/price matching.
- Scanned/image-only documents have no selectable text, so this is **not OCR**.
- All extracted values remain candidate evidence until the user individually selects and applies them; permit, equipment and rebate eligibility remain unverified.
- Failed, encrypted, oversized or unreadable PDFs never modify existing quotes.
- Report PDF page count and truncation. An import intentionally does not preserve raw file bytes beyond processing; extracted text remains only in in-memory page state while it is displayed.
- Maintain existing conditional rebate and scope comparison safeguards. No backend endpoint, persistent quote store, address collection or affiliate routing.

## Remaining limitations
Real contractor PDFs vary dramatically. This text parser may miss labels or misread tables and must be tested with consenting users' redacted signed proposals before any public assertion of reliable accuracy. No equipment validation, contractor verification, automatic approval, OCR, or jurisdiction matching is implemented. Do not imply that a scanned or image-only PDF can be analyzed. Private/noindex settings remain unchanged.
