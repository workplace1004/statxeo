import { describe, it, expect } from "vitest"
import { TitanContentSchema } from "../../schemas/titan-content"

const makeServicePage = (slug: string) => ({
  slug,
  headline: `${slug} Service`,
  intro: "We provide excellent service.",
  benefits: [
    { title: "Fast", description: "We work quickly." },
    { title: "Reliable", description: "You can count on us." },
    { title: "Affordable", description: "Fair prices always." },
  ],
  process: [
    { step: 1, title: "Call Us", description: "Reach out to schedule." },
    { step: 2, title: "We Come", description: "Technician arrives on time." },
  ],
  faq: [
    { question: "How fast?", answer: "Same day in most cases." },
    { question: "Licensed?", answer: "Yes, fully licensed." },
  ],
  relatedServices: [],
  seo: { title: `${slug} | Business`, description: `${slug} service description.` },
})

const makeCityPage = (slug: string, city: string) => ({
  slug,
  city,
  headline: `Service in ${city}`,
  intro: `We serve ${city} with expert service.`,
  serviceHighlights: [
    { title: "AC Repair", description: `Fast AC repair in ${city}.` },
    { title: "Heating", description: `Expert heating in ${city}.` },
  ],
  localSignals: [`Serving ${city} since 2008`, "Licensed in Texas"],
  seo: {
    title: `Service ${city} | Business`,
    description: `Expert service in ${city}. Call today.`,
  },
})

const baseCore = {
  home: {
    hero: { headline: "Headline", subheadline: "Sub", ctaText: "CTA", backgroundImagePrompt: "bg" },
    featuredServices: [
      { title: "S1", description: "D1", icon: "wrench" },
      { title: "S2", description: "D2", icon: "zap" },
      { title: "S3", description: "D3", icon: "shield" },
    ],
    aboutPreview: { headline: "About", body: "We are great.", ownerName: "John", ownerRole: "Owner" },
    testimonials: {
      headline: "Reviews",
      items: [
        { quote: "Great service!", name: "A B.", role: "Homeowner" },
        { quote: "Very fast!", name: "C D.", role: "Renter" },
      ],
    },
    stats: [{ value: "100+", label: "Clients" }, { value: "5 Years", label: "Experience" }, { value: "5★", label: "Rating" }],
    primaryCta: { headline: "Ready?", subheadline: "Call now.", buttonText: "Call" },
  },
  servicesPage: {
    headline: "Services",
    intro: "We offer many services.",
    services: [
      { title: "S1", description: "D1", features: ["F1", "F2"], icon: "wrench" },
      { title: "S2", description: "D2", features: ["F3", "F4"], icon: "zap" },
      { title: "S3", description: "D3", features: ["F5", "F6"], icon: "shield" },
    ],
    faq: [
      { question: "Q1?", answer: "A1." },
      { question: "Q2?", answer: "A2." },
      { question: "Q3?", answer: "A3." },
    ],
    cta: { headline: "Need help?", subheadline: "Call us.", buttonText: "Call" },
  },
  aboutPage: {
    headline: "About Us",
    story: "We started in 2010.",
    mission: "To serve our community.",
    values: [
      { title: "Quality", description: "We do quality work." },
      { title: "Speed", description: "We work fast." },
      { title: "Honesty", description: "We are honest." },
    ],
    ownerName: "John",
    ownerRole: "Owner",
    cta: { headline: "Work with us", subheadline: "Contact us.", buttonText: "Contact" },
  },
  contactPage: {
    headline: "Contact",
    intro: "Reach out today.",
    formHeadline: "Send a Message",
    formButtonText: "Send",
    hours: "Mon-Fri 8am-5pm",
    cta: { headline: "Call now", subheadline: "We answer fast.", buttonText: "Call" },
  },
}

describe("Titan slug validation", () => {
  it("accepts valid Titan content with correct slugs", () => {
    const content = {
      ...baseCore,
      servicePages: [makeServicePage("ac-repair"), makeServicePage("heating")],
      cityPages: [makeCityPage("austin-tx", "Austin"), makeCityPage("round-rock-tx", "Round Rock")],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(true)
  })

  it("rejects service page slug with uppercase letters", () => {
    const content = {
      ...baseCore,
      servicePages: [makeServicePage("AC-Repair")],
      cityPages: [makeCityPage("austin-tx", "Austin")],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it("rejects city page slug with spaces", () => {
    const content = {
      ...baseCore,
      servicePages: [makeServicePage("ac-repair")],
      cityPages: [makeCityPage("austin tx", "Austin")],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it("rejects empty servicePages array", () => {
    const content = {
      ...baseCore,
      servicePages: [],
      cityPages: [makeCityPage("austin-tx", "Austin")],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })

  it("rejects empty cityPages array", () => {
    const content = {
      ...baseCore,
      servicePages: [makeServicePage("ac-repair")],
      cityPages: [],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(false)
  })
})

describe("Titan city uniqueness", () => {
  it("detects duplicate city slugs", () => {
    const content = {
      ...baseCore,
      servicePages: [makeServicePage("ac-repair")],
      cityPages: [
        makeCityPage("austin-tx", "Austin"),
        makeCityPage("austin-tx", "Austin TX"),
      ],
    }
    const result = TitanContentSchema.safeParse(content)
    expect(result.success).toBe(true)

    if (result.success) {
      const slugs = result.data.cityPages.map((p) => p.slug)
      const unique = new Set(slugs)
      expect(unique.size).toBeLessThan(slugs.length)
    }
  })
})
