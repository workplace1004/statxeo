export type ClientShowcaseSite = {
  slug: string;
  name: string;
  domain: string;
  href: string;
  category: string;
  summary: string;
  oldSiteImageSrc: string;
  previewMode?: "iframe" | "external-only";
  previewFallbackLabel?: string;
  accentGlowClass: string;
  accentChipClass: string;
  accentBorderClass: string;
};

export const clientShowcaseSites: ClientShowcaseSite[] = [
  {
    slug: "low-cost-garage-door",
    name: "Low Cost Garage Door",
    domain: "lowcostgaragedoor.com",
    href: "https://lowcostgaragedoor.com",
    category: "Garage door service",
    summary:
      "Local-service lead generation site with direct service messaging, clearer offer framing, and stronger CTA paths for urgent homeowner searches.",
    oldSiteImageSrc: "/oldsite/lowcostgaragedoorold.png",
    accentGlowClass: "from-emerald-400/30 via-cyan-400/12 to-transparent",
    accentChipClass: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    accentBorderClass: "border-emerald-300/20",
  },
  {
    slug: "union-restoration",
    name: "Union Restoration",
    domain: "unionrestoration.net",
    href: "https://unionrestoration.net",
    category: "Restoration",
    summary:
      "Premium contractor positioning with a trust-forward structure for emergency and insurance-driven restoration work.",
    oldSiteImageSrc: "/oldsite/unionrestoration.png",
    accentGlowClass: "from-sky-400/28 via-cyan-400/12 to-transparent",
    accentChipClass: "border-sky-300/25 bg-sky-400/10 text-sky-100",
    accentBorderClass: "border-sky-300/20",
  },
  {
    slug: "sun-roofing-repair",
    name: "Sun Roofing Repair",
    domain: "sunroofingrepair.com",
    href: "https://sunroofingrepair.com",
    category: "Roofing",
    summary:
      "Roof repair presentation tuned for rapid trust-building, clean offer hierarchy, and strong above-the-fold conversion cues.",
    oldSiteImageSrc: "/oldsite/sunroofing.png",
    accentGlowClass: "from-amber-300/30 via-orange-300/10 to-transparent",
    accentChipClass: "border-amber-300/25 bg-amber-400/10 text-amber-50",
    accentBorderClass: "border-amber-300/20",
  },
  {
    slug: "advance-garage-door-tx",
    name: "Advance Garage Door TX",
    domain: "advancegaragedoortx.com",
    href: "https://advancegaragedoortx.com",
    category: "Garage door service",
    summary:
      "Service-business architecture built to surface offers quickly, clarify credibility, and move visitors into quote intent faster.",
    oldSiteImageSrc: "/oldsite/advancedgaragedoortx.png",
    accentGlowClass: "from-fuchsia-400/28 via-pink-300/12 to-transparent",
    accentChipClass: "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-50",
    accentBorderClass: "border-fuchsia-300/20",
  },
  {
    slug: "statxd",
    name: "Statxd",
    domain: "statxd.com",
    href: "https://statxd.com",
    category: "Lead routing platform",
    summary:
      "Platform marketing site with clearer product framing, higher-end visuals, and cleaner action paths across the funnel.",
    oldSiteImageSrc: "/oldsite/statxd-old.png",
    accentGlowClass: "from-violet-400/28 via-indigo-400/10 to-transparent",
    accentChipClass: "border-violet-300/25 bg-violet-400/10 text-violet-50",
    accentBorderClass: "border-violet-300/20",
  },
  {
    slug: "bsd-garage-door-fl",
    name: "BSD Garage Door FL",
    domain: "bsdgaragedoorfl.com",
    href: "https://www.bsdgaragedoorfl.com",
    category: "Garage door service",
    summary:
      "Florida service-site build with sharper local positioning, better CTA pacing, and a more credible presentation for paid or organic traffic.",
    oldSiteImageSrc: "/oldsite/bsdgaragedoor.png",
    previewMode: "external-only",
    previewFallbackLabel: "This site blocks embedded previews, so open the live launch in a new tab.",
    accentGlowClass: "from-teal-300/28 via-cyan-300/12 to-transparent",
    accentChipClass: "border-teal-300/25 bg-teal-400/10 text-teal-50",
    accentBorderClass: "border-teal-300/20",
  },
];
