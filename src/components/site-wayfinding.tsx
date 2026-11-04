import Link from "next/link";
export function SiteWayfinding(){
 return <>
  <a className="site-skip" href="#primary-content">Skip to main content</a>
  <div className="site-wayfinding">
   <Link className="site-wayfinding-brand" href="/">Home Improvement</Link>
   <nav aria-label="Main site navigation">
    <Link href="/projects">Choose a project</Link>
    <Link href="/">Home</Link>
    <Link href="/privacy">Privacy</Link>
   </nav>
  </div>
 </>;
}
