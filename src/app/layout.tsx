import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import {SiteWayfinding} from "../components/site-wayfinding";

export const metadata: Metadata = {
  title: "Home Improvement | Heat-Pump Quotes and Incentive Planning",
  description: "Compare Massachusetts and Oregon heat-pump installation proposals, review documented scope, verify incentives, and prepare contractor questions.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteWayfinding/><div id="primary-content" tabIndex={-1}>{children}</div><div className="pilot-footer-links"><a href="/privacy">Privacy &amp; data use</a><span>Independent research pilot · Not government affiliated</span></div><Analytics /></body></html>;
}
