export const WEBSITE_PACKAGES = [
  {
    id: "statxeo_lander",
    name: "Lander",
    label: "one-time",
    priceLabel: "$149.99",
    amountCents: 14999,
    tint: "#ededed",
    description: "Pay once — site goes live. No subscriptions, no hidden fees.",
    ownershipModel: "statxt_managed",
    ownershipSummary: "Managed by Statxt on Statxt infrastructure.",
    cta: "Get Lander",
    features: [
      "Custom high-converting landing page (designed + optimized)",
      "Mobile-first, fast load, clean modern layout",
      "Clear call-to-action (Call / Book / Quote)",
      "Statxt platform access",
    ],
  },
  {
    id: "statxeo_core",
    name: "Core",
    label: "one-time",
    priceLabel: "$399.99",
    amountCents: 39999,
    tint: "#abceb4",
    description: "Pay once — site goes live. No subscriptions, no hidden fees.",
    ownershipModel: "customer_owned_site",
    ownershipSummary: "You own the delivered site content and structure; Statxt retains framework and platform rights.",
    cta: "Get Core",
    features: [
      "Full multi-page site (Home, Services, About, Contact)",
      "Local SEO optimization & AI-readable llms.txt",
      "Instant SMS lead routing to your phone",
      "Statxt platform access + 1500 credits",
    ],
  },
  {
    id: "statxeo_titan",
    name: "Titan",
    label: "one-time",
    priceLabel: "$999.99",
    amountCents: 99999,
    tint: "#94dbff",
    description: "Pay once — site goes live. No subscriptions, no hidden fees.",
    ownershipModel: "customer_owned_site",
    ownershipSummary: "You own the delivered site content and structure; Statxt retains framework and platform rights.",
    cta: "Get Titan",
    features: [
      "Nested service + city pages for advanced SEO structure",
      "Full funnel integration + automation routing",
      "Technical SEO optimization (schema, indexing, performance)",
      "Statxt platform access + 5000 credits",
    ],
  },
] as const

export const BOOST_PACKAGES = [
  {
    id: "mach_1_foundation",
    codeName: "Mach 1",
    name: "Foundation",
    priceLabel: "$249",
    periodLabel: "/month",
    amountCents: 24900,
    color: "#ff9ffc",
    features: [
      "Lead Funnel Automation",
      "Indexing",
      "1 blog post per month — onsite",
    ],
  },
  {
    id: "mach_2_accelerator",
    codeName: "Mach 2",
    name: "Accelerator",
    priceLabel: "$499",
    periodLabel: "/month",
    amountCents: 49900,
    color: "#a0b3fd",
    highlighted: true,
    features: [
      "Everything from Mach 1",
      "2 blogs per month onsite",
      "4 social media posts on 1 social media account",
      "Lead funnel automation email / text",
    ],
  },
  {
    id: "mach_3_xeo",
    codeName: "Mach 3",
    name: "XEO",
    priceLabel: "$749",
    periodLabel: "/month",
    amountCents: 74900,
    color: "#b9b15b",
    features: [
      "Everything in Mach 2",
      "10 directory submissions per month",
      "4–8 social media posts, 3 social media accounts",
      "1 YouTube video per month",
      "Review chaser link",
      "Titan site free with yearly billing",
    ],
  },
] as const

export type WebsitePackageId = (typeof WEBSITE_PACKAGES)[number]["id"]
export type BoostPackageId = (typeof BOOST_PACKAGES)[number]["id"]

export const RECOMMENDED_BOOST_BY_WEBSITE: Record<WebsitePackageId, BoostPackageId> = {
  statxeo_lander: "mach_1_foundation",
  statxeo_core: "mach_2_accelerator",
  statxeo_titan: "mach_3_xeo",
}

export function isWebsitePackageId(value: string): value is WebsitePackageId {
  return WEBSITE_PACKAGES.some((item) => item.id === value)
}

export function isBoostPackageId(value: string): value is BoostPackageId {
  return BOOST_PACKAGES.some((item) => item.id === value)
}

export function getWebsitePackage(packageId: WebsitePackageId) {
  return WEBSITE_PACKAGES.find((item) => item.id === packageId) ?? WEBSITE_PACKAGES[0]
}

export function getBoostPackage(packageId: BoostPackageId) {
  return BOOST_PACKAGES.find((item) => item.id === packageId) ?? BOOST_PACKAGES[0]
}

export function getRecommendedBoostPackageId(websitePackageId: WebsitePackageId) {
  return RECOMMENDED_BOOST_BY_WEBSITE[websitePackageId]
}