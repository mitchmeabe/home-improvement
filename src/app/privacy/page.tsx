import type { Metadata } from "next";
import Link from "next/link";

export const metadata:Metadata={title:"Privacy & Data Use | Home Improvement",robots:{index:false,follow:false}};
export default function PrivacyPage(){
 return <main className="pilot-privacy"><p><Link href="/">← Back to Home Improvement</Link></p>
 <h1>Privacy and data use</h1>
 <p><strong>Updated November 4, 2026.</strong> This is a private research pilot, not a government website or verified application/eligibility service.</p>
 <h2>Information you enter</h2>
 <p>The calculators run in your browser session. We do not request full names, Social Security numbers, financial account details, license numbers or payment credentials; do not enter them. Questionnaire answers, cost figures and other fields are not saved in an application database.</p>
 <p><strong>Optional City of Portland jurisdiction check:</strong> Only if you click “Check City GIS jurisdiction” on the Oregon dossier page, the street number, street name and optional unit/ZIP are sent directly from your browser to the City of Portland's public ArcGIS address-point service. This is an external City service that may log the lookup and associated technical information. Our site does not proxy, log, save, persist or add the address to exported reports; the address input is cleared after a successful match. You can use PortlandMaps manually instead. An official address-point match is not a permit or parcel-title verification.</p>
 <h2>Website analytics</h2>
 <p>Vercel Web Analytics is installed. It may process visit/page information and limited non-identifying interaction events (such as a copied checklist, provider link clicked, or yes/no usefulness response). Interaction events do not include your form answers or quote amounts. Vercel may process technical information under its own privacy practices. Your browser's tracker restrictions may affect event collection.</p>
 <h2>Third-party sites</h2>
 <p>Official-government, educator and vendor links take you to separate websites with their own privacy and enrollment terms. We are not affiliated with the agencies and currently receive no affiliate compensation from those listed provider links.</p>
 <h2>Limitations</h2>
 <p>Sources, prices, incentives and government rules can change. Nothing here constitutes professional legal, tax, insurance, building-code or licensing advice; obtain confirmation from the relevant agency before paying or applying.</p>
 <p><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel privacy policy ↗</a></p>
 </main>;
}