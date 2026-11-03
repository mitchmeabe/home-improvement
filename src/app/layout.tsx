import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heat Pump Project Planner | Home Improvement",
  description: "Plan Portland residential heat pump permits and investigate Oregon incentives using official sources.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
