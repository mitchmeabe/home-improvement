# Massachusetts sample-contract price and payment-schedule acceptance

**Reviewed:** November 5, 2026  
**Source:** Massachusetts Office of Consumer Affairs — [Home Improvement Contract Sample Language](https://www.mass.gov/info-details/home-improvement-contract-sample-language)  
**Additional scope reference:** [Westfield Gas + Electric residential heat-pump specification](https://www.wgeld.org/H-%2B-ASHP-Spec-Sheet%5B89%5D.pdf) (municipal utility program, **not** a Mass Save sponsor-wide eligibility statement).

## Why this matters

The Massachusetts government’s **blank sample home-improvement agreement** uses a section called **Total Contract Price and Payment Schedule** and separately lists the contract total, deposit/down payment and installment amounts. The sample notes that a contractor may need to identify special-order items, permits, warranty terms, and contract dates. It is **sample legal wording**, **not a paid customer's signed contractor quote**. It cannot establish that a specific transaction is compliant or that a rebate will be approved.

Westfield Gas + Electric's sample request-for-proposal language also calls for a detailed quote and scope, Manual J load calculations, permits, equipment specifications and rebate assistance, but the municipal utility document uses **its own program standards**. Do not merge WG+E's equipment thresholds or funding terms into Mass Save rebate rules.

## Implemented input safeguards

- A labeled `Total Contract Price: $18,900` is parsed as **one candidate** requiring explicit visitor confirmation, independently of separate deposits or installment amounts.
- The **exact empty section heading** `Total Contract Price and Payment Schedule` is skipped. It must not accidentally attach an unlabeled payment amount to a total.
- Multiple prices on the contract-total line, competing total labels, or an explicit lower `Final Cost` / `Net Project Cost` suppress automatic installed-price selection.
- Deposits and installment wording generate a **review-topic mention, not a calculated contract price or approval**.
- Plural `Permits` and `Inspections` now produce the existing **topic-mentioned** warning, without inferring a permit was obtained.

Five deterministic parser cases and two desktop/mobile browser scenarios cover these conditions. No actual signed homeowner document, identity, address, financial account or original permit-record PDF is saved by these tests.

## Separate HEAT Loan documentation

Mass Save's public HEAT Loan information packet describes documentation such as the signed participating-installer proposal, manufacturer/models, scope and pricing, total cost for each heat pump system, and an AHRI reference/certificate. The retrieved packet is **historical**, and its rebate rates or financing limits **must not be represented as current 2026 terms** without separate updated verification.

Official reference: https://www.masssave.com/residential/programs-and-services/-/media/4509678EBFE0459A96E54955CD26CAE4.ashx

**This work does not determine Massachusetts home-improvement contract compliance, loan eligibility, rebate funding, price correctness or vendor qualifications.** Recent genuinely redacted Massachusetts proposals and human professional review remain outstanding.
