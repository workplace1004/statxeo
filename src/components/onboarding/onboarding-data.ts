export const WEBSITE_PACKAGES = [
  {
    id: "lander",
    name: "Lander",
    price: "$149.99",
    priceLabel: "one project fee",
    priceCents: 14999,
    ownership:
      "Managed by Statxt on Statxt infrastructure.",
    highlights: [
      "Custom high-converting landing page (designed + optimized)",
      "Mobile-first, fast load, clean modern layout",
      "Clear call-to-action (Call / Book / Quote)",
      "Statxt platform access",
    ],
  },
  {
    id: "core",
    name: "Core",
    price: "$399.99",
    priceLabel: "one project fee",
    priceCents: 39999,
    popular: true,
    ownership:
      "You own the delivered site content and structure; Statxt retains framework and platform rights.",
    highlights: [
      "Full multi-page site (Home, Services, About, Contact)",
      "Local SEO optimization & AI-readable llms.txt",
      "Instant SMS lead routing to your phone",
      "Statxt platform access + 1,500 credits",
    ],
  },
  {
    id: "titan",
    name: "Titan",
    price: "$999.99",
    priceLabel: "one project fee",
    priceCents: 99999,
    ownership:
      "You own the delivered site content and structure; Statxt retains framework and platform rights.",
    highlights: [
      "Nested service + city pages for advanced SEO structure",
      "Full funnel integration + automation routing",
      "Technical SEO optimization (schema, indexing, performance)",
      "Statxt platform access + 5,000 credits",
    ],
  },
] as const;

export type WebsitePackageId = (typeof WEBSITE_PACKAGES)[number]["id"];

export const BOOST_PACKAGES = [
  {
    id: "mach-1",
    name: "Mach 1",
    subtitle: "Foundation",
    price: "$249",
    priceSuffix: "/month",
    notes: "Lead funnel automation, indexing, 1 blog post per month — onsite",
    highlights: ["Lead funnel automation", "Indexing", "1 blog post per month — onsite"],
    featured: false,
  },
  {
    id: "mach-2",
    name: "Mach 2",
    subtitle: "Accelerator",
    price: "$499",
    priceSuffix: "/month",
    notes: "Everything from Mach 1, plus blogs, social, and lead funnel email/text",
    highlights: [
      "Everything from Mach 1",
      "2 blogs per month onsite",
      "4 social media posts on 1 social media account",
      "Lead funnel automation email / text",
    ],
    featured: false,
  },
  {
    id: "mach-3",
    name: "Mach 3",
    subtitle: "XEO",
    price: "$749",
    priceSuffix: "/month",
    notes: "Titan site free with yearly billing",
    highlights: [
      "Everything in Mach 2",
      "10 directory submissions per month",
      "4–8 social media posts, 3 social media accounts",
      "1 YouTube video per month",
      "Review chaser link",
      "Titan site free with yearly billing",
    ],
    featured: true,
  },
] as const;

export type BoostPackageId = (typeof BOOST_PACKAGES)[number]["id"];
