/**
 * Quote-readiness questions ONLY. Self-reported evidence labels are not a
 * verification of a contractor, permit, efficiency approval or HP3 funding.
 */
export type Evidence = "documented" | "not-mentioned" | "unsure";
export type QuoteKey =
  | "equipmentModel"
  | "installedPrice"
  | "mechanicalPermit"
  | "electricalWork"
  | "finalInspection"
  | "warranty"
  | "approvedContractor"
  | "hp3Funding"
  | "upfrontDiscount";

export interface QuoteQuestion {
  id: QuoteKey;
  label: string;
  ask: string;
  source: string;
  scope: "general" | "hp3";
}

const PORTLAND = "https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits";
const HP3 = "https://www.oregon.gov/energy/incentives/Pages/HP3.aspx";

export const QUOTE_QUESTIONS: readonly QuoteQuestion[] = [
  { id: "equipmentModel", label: "The exact heat pump equipment model is identified", ask: "Which exact outdoor and indoor model numbers will be installed, and where can I verify their rated efficiency?", source: HP3, scope: "general" },
  { id: "installedPrice", label: "The quote itemizes the installed price and major work", ask: "Can you itemize the equipment, labor, electrical work, permits and optional upgrades in the total price?", source: HP3, scope: "general" },
  { id: "mechanicalPermit", label: "Mechanical permit responsibility is documented", ask: "Who will obtain and pay for the applicable mechanical permit for this address?", source: PORTLAND, scope: "general" },
  { id: "electricalWork", label: "Electrical scope and any required permit are documented", ask: "Will new wiring, a circuit or a panel upgrade be needed, and who handles any electrical permit?", source: PORTLAND, scope: "general" },
  { id: "finalInspection", label: "Responsibility for required final inspection is clear", ask: "Who will schedule the required final mechanical inspection and provide permit-closeout evidence?", source: PORTLAND, scope: "general" },
  { id: "warranty", label: "Equipment and labor warranty terms are in writing", ask: "What equipment and workmanship warranties apply, and what service is included?", source: PORTLAND, scope: "general" },
  { id: "approvedContractor", label: "Contractor's current HP3-approved status is confirmed", ask: "Are you currently ODOE-approved for HP3, and can I verify your listing with the state?", source: HP3, scope: "hp3" },
  { id: "hp3Funding", label: "Current funding/reservation situation has been checked", ask: "Is HP3 funding currently available for this property category, or do you hold an approved reservation for this project?", source: HP3, scope: "hp3" },
  { id: "upfrontDiscount", label: "Potential HP3 savings are described as an upfront price reduction", ask: "If this project qualifies, where will the HP3 incentive be deducted before payment, and how will it appear on my final signed invoice?", source: HP3, scope: "hp3" },
] as const;

export type QuoteAnswers = Partial<Record<QuoteKey, Evidence>>;

export interface QuoteReviewResult {
  checked: number;
  documented: number;
  toClarify: QuoteQuestion[];
  considered: QuoteQuestion[];
}

export function reviewQuote(answers: QuoteAnswers, hp3Interested: boolean): QuoteReviewResult {
  const considered = QUOTE_QUESTIONS.filter((q) => q.scope === "general" || hp3Interested);
  const documented = considered.filter((q) => answers[q.id] === "documented").length;
  return {
    checked: considered.length,
    documented,
    considered,
    toClarify: considered.filter((q) => answers[q.id] !== "documented"),
  };
}

export function makeQuoteQuestions(result: QuoteReviewResult, fundingWarning: boolean): string {
  const lines = [
    "HEAT PUMP QUOTE — QUESTIONS FOR MY CONTRACTOR",
    "Self-reported quote-review checklist, not verification of project compliance.",
    ...(fundingWarning ? ["IMPORTANT: HP3 funding for existing owner-occupied properties was fully reserved as of the October 1, 2026 agency funding table. Confirm any existing reservation; do not assume funds are available."] : []),
    ...result.toClarify.map((q, i) => (i + 1) + ". " + q.ask),
    "Official Portland permit guide: " + PORTLAND,
    "Official Oregon HP3 program and current contractor directory: " + HP3,
  ];
  return lines.join("\n");
}
