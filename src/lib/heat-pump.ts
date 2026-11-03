/**
 * Oregon heat pump project planning. Reviewed snapshot, NOT a funding or permit
 * eligibility certification. Portland permit conclusions never apply elsewhere.
 */
export const RULE_REVIEWED_ON = "2026-11-03";
export const SOURCES = [
  { label: "Portland — residential mechanical permits", url: "https://www.portland.gov/ppd/residential-permitting/residential-mechanical-permits" },
  { label: "Portland — which residential projects need permits", url: "https://www.portland.gov/ppd/residential-permitting/do-you-need-permit/residential-permits" },
  { label: "Oregon — Heat Pump Purchase Program (HP3)", url: "https://www.oregon.gov/energy/incentives/Pages/HP3.aspx" },
] as const;

export type Location = "portland" | "other-oregon" | "outside-oregon" | "unknown";
export type Property = "existing-owner-occupied" | "existing-rental" | "new-construction" | "vacation-or-commercial" | "other";
export type Wiring = "new-hardwired-work" | "no-known-work" | "unsure";
export type Equipment = "heat-pump" | "mini-split";
export interface ProjectInput {
  location: Location;
  property: Property;
  equipment: Equipment;
  wiring: Wiring;
  hspf2?: number;
  seer2?: number;
}
export type Status = "required" | "check" | "not-applicable";
export interface Finding {
  status: Status;
  title: string;
  detail: string;
  sourceUrl: string;
}
export type FundingStatus = "fully-reserved" | "verify-live" | "not-applicable";
export type EfficiencyStatus = "meets-numeric-thresholds-only" | "below-threshold" | "unknown";

export interface ProjectResult {
  permits: Finding[];
  funding: FundingStatus;
  fundingExplanation: string;
  efficiency: EfficiencyStatus;
  efficiencyExplanation: string;
}

export function evaluateHeatPump(input: ProjectInput): ProjectResult {
  for (const [name, value] of [["HSPF2", input.hspf2], ["SEER2", input.seer2]] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
      throw new RangeError(name + " must be a positive finite number or left blank.");
    }
  }

  const permits: Finding[] = [];
  if (input.location === "portland") {
    permits.push({
      status: "required",
      title: "Residential mechanical permit",
      detail: "Portland identifies heat pumps and mini-splits among projects requiring a residential mechanical permit. Confirm additional site-specific or zoning requirements with the city.",
      sourceUrl: SOURCES[0].url,
    });
    permits.push({
      status: input.wiring === "new-hardwired-work" ? "required" : "check",
      title: "Electrical permit",
      detail: input.wiring === "new-hardwired-work"
        ? "New or changed hard-wired electrical systems require a permit under Portland's residential guidance."
        : "Portland says most mechanical equipment projects also need an electrical permit. Ask the city and your installer whether your specific installation does.",
      sourceUrl: SOURCES[1].url,
    });
  } else {
    permits.push({
      status: "check",
      title: "Local mechanical and electrical permits",
      detail: input.location === "outside-oregon"
        ? "Portland rules do not determine permit requirements outside Oregon. Consult the relevant local building department."
        : "This prototype only covers Portland permit rules. Verify the actual authority for your address before installation.",
      sourceUrl: SOURCES[0].url,
    });
  }

  let funding: FundingStatus;
  let fundingExplanation: string;
  if (input.location === "outside-oregon" || input.property === "vacation-or-commercial") {
    funding = "not-applicable";
    fundingExplanation = "This Oregon residential program does not cover out-of-state work or commercial/vacation occupancies.";
  } else if (input.location === "unknown" || input.property === "other") {
    funding = "verify-live";
    fundingExplanation = "Location or property classification is not established. Check eligibility and current state funding with Oregon ODOE and an approved contractor.";
  } else if (input.property === "existing-owner-occupied") {
    funding = "fully-reserved";
    fundingExplanation = "ODOE currently lists HP3 funding for existing owner-occupied homes as fully reserved for new applications. A previously approved reservation may have a different status. Recheck live before relying on this result.";
  } else {
    funding = "verify-live";
    fundingExplanation = "ODOE lists existing rentals and eligible new construction as possible HP3 categories, but funds, approval, contractor eligibility and all other conditions must be confirmed live.";
  }

  let efficiency: EfficiencyStatus = "unknown";
  let efficiencyExplanation = "Enter published HSPF2 and SEER2 equipment ratings to compare general HP3 numeric minimums. This does not evaluate PTHPs or all program criteria.";
  if (input.hspf2 !== undefined && input.seer2 !== undefined) {
    if (input.hspf2 >= 8.1 && input.seer2 >= 16) {
      efficiency = "meets-numeric-thresholds-only";
      efficiencyExplanation = "Meets the general HP3 numeric HSPF2 ≥ 8.1 and SEER2 ≥ 16 thresholds. This alone does not establish eligibility, approval, or available funding. PTHPs use separate criteria.";
    } else {
      efficiency = "below-threshold";
      efficiencyExplanation = "Below at least one general HP3 efficiency threshold (HSPF2 ≥ 8.1 and SEER2 ≥ 16). Do not assume eligibility; special equipment rules, including PTHPs, must be checked separately.";
    }
  }
  return { permits, funding, fundingExplanation, efficiency, efficiencyExplanation };
}
