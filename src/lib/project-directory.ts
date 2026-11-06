/**
 * Supported project journeys, not public program eligibility.
 * Avoid linking to unmerged routes (M2 is still an independent PR).
 */
export type ProjectGoal="all"|"space-heat-pump"|"water-heater"|"ev-charger";
export type ProjectRegion="all"|"or"|"ma"|"ca";
export interface ProjectWorkflow{
 id:string;name:string;goal:Exclude<ProjectGoal,"all">;region:Exclude<ProjectRegion,"all">;
 href:string;useWhen:string;confirm:string;notFor:string;
}
export const PROJECT_WORKFLOWS:readonly ProjectWorkflow[]=[
 {id:"ca-sj-ev",name:"San José, California · home EV charger permits",goal:"ev-charger",region:"ca",
 href:"/california/san-jose-ev-charger",useWhen:"Prepare a location-specific Level 1 or Level 2 charger and potential panel-work checklist.",
 confirm:"Actual San José city permit jurisdiction, property type, equipment, electrician load evaluation and permit route.",
 notFor:"Not a statewide California permit, utility rebate, load calculation or electrician referral."},
 {id:"or-space",name:"Oregon · space-heating heat pumps",goal:"space-heat-pump",region:"or",
 href:"/#oregon-project",useWhen:"Explore project permits, Oregon HP3 conditions, and compare contractor installation bids.",
 confirm:"Actual permit jurisdiction, equipment ratings, approved contractor and live HP3 funding.",
 notFor:"Not heat-pump water heaters or awarded rebate calculations."},
 {id:"ma-space",name:"Massachusetts · air-source heat pumps",goal:"space-heat-pump",region:"ma",
 href:"/massachusetts/heat-pumps",useWhen:"Review Mass Save scenario conditions and differences between two or three contractor proposals.",
 confirm:"Program sponsorship, qualified AHRI products, installer conditions and effective rebate terms.",
 notFor:"Not Massachusetts building-permit clearance or an actual approved rebate."},
 {id:"or-water",name:"Oregon · heat-pump water heaters",goal:"water-heater",region:"or",
 href:"/oregon/heat-pump-water-heaters",useWhen:"Compare water-heater installation scope and dated incentive routes, including plumbing and electrical permit questions.",
 confirm:"Correct property jurisdiction, current program terms and complete installed bid line items.",
 notFor:"Not a space-heating heat pump, HP3 project, or a water-heater rebate award."}
];
export function filterProjectWorkflows(goal:ProjectGoal,region:ProjectRegion):ProjectWorkflow[]{
 if(!["all","space-heat-pump","water-heater","ev-charger"].includes(goal)||
   !["all","or","ma","ca"].includes(region))throw new RangeError("Unsupported project filter.");
 return PROJECT_WORKFLOWS.filter(x=>(goal==="all"||goal===x.goal)&&(region==="all"||region===x.region));
}
