import { describe, it, expect } from "vitest"
import { TitanContentSchema } from "../titan-content"

const validServicePage = {
  slug: "ac-repair",
  headline: "Professional AC Repair in Austin",
  intro: "Torres Home Comfort provides fast, reliable AC repair for Austin homeowners.",
  benefits: [
    { title: "Same-Day Service", description: "We respond quickly to keep you comfortable." },
    { title: "All Brands", description: "We repair all major AC brands and models." },
    { title: "Licensed Technicians", description: "Fully licensed and insured in Texas." },
  ],
  process: [
    { step: 1, title: "Call Us", description: "Reach out and describe your issue." },
    { step: 2, title: "Diagnosis", description: "We diagnose the problem on-site." },
    { step: 3, title: "Repair", description: "We fix it right the first time." },
  ],
  faq: [
    { question: "How fast can you come?", answer: "We offer same-day service in most cases." },
    { question: "Do you offer warranties?", answer: "Yes, all repairs come with a 90-day warranty." },
  ],
  relatedServices: ["heating", "maintenance"],
  seo: {
    title: "AC Repair Austin TX | Torres Home Comfort",
    description: "Fast AC repair in Austin. Same-day service, all brands. Call Torres Home Comfort.",
  },
}

const validCityPage = {
  slug: "austin-tx",
  city: "Austin",
  headline: "HVAC Services in Austin, TX",
  intro: "Torres Home Comfort proudly serves Austin homeowners with expert HVAC solutions.",
  serviceHighlights: [
    { title: "AC Repair", description: "Fast AC repair for Austin's hot summers." },
    { title: "Heating", description: "Reliable heating service for Austin winters." },
  ],
  localSignals: [
    "Serving Austin and surrounding areas since 2008",
    "Licensed and insured in the state of Texas",
  ],
  seo: {
    title: "HVAC Services Austin TX | Torres Home Comfort",
    description: "Expert HVAC in Austin TX. AC repair, heating, maintenance. Call today.",
  },
}

const validTitan = {
  home: {
    hero: {
      headline: "Austin's Trusted HVAC Experts",
      subheadline: "Fast, reliable heating and cooling service.",
      ctaText: "Get a Free Quote",
      backgroundImagePrompt: "HVAC technician working on air conditioning unit",
    },
    featuredServices: [
      { title: "AC Repair", description: "Fast AC repair.", icon: "wrench" },
      { title: "Heating", description: "Expert heating service.", icon: "zap" },
      { title: "Maintenance", description: "Seasonal tune-ups.", icon: "settings" },
    ],
    aboutPreview: {
      headline: "Family-Owned Since 2008",
      body: "Serving Austin families for over 15 years.",
      ownerName: "Michael Torres",
      ownerRole: "Owner & Founder",
    },
    testimonials: {
      headline: "What Our Clients Say",
      items: [
        { quote: "Best HVAC company in Austin!", name: "Sarah K.", role: "Homeowner" },
        { quote: "Fast and honest service.", name: "James R.", role: "Property Manager" },
      ],
    },
    stats: [
      { value: "500+", label: "Clients Served" },
      { value: "15 Years", label: "Experience" },
      { value: "4.9★", label: "Rating" },
    ],
    primaryCta: { headline: "Ready?", subheadline: "Call today.", buttonText: "Call Now" },
  },
  servicesPage: {
    headline: "Our Services",
    intro: "Comprehensive HVAC solutions.",
    services: [
      { title: "AC Repair", description: "Fast AC repair.", features: ["Same-day", "All brands"], icon: "wrench" },
      { title: "Heating", description: "Expert heating.", features: ["Gas & electric", "Heat pumps"], icon: "zap" },
      { title: "Maintenance", description: "Seasonal tune-ups.", features: ["Spring & fall", "Full inspection"], icon: "settings" },
    ],
    faq: [
      { question: "How fast?", answer: "Same-day in most cases." },
      { question: "Licensed?", answer: "Yes, fully licensed and insured." },
      { question: "Financing?", answer: "Yes, flexible options available." },
    ],
    cta: { headline: "Need Service?", subheadline: "Call for a free estimate.", buttonText: "Get a Quote" },
  },
  aboutPage: {
    headline: "About Us",
    story: "Founded in 2008 by Michael Torres.",
    mission: "Honest, reliable HVAC at fair prices.",
    values: [
      { title: "Honesty", description: "Straight answers and fair prices." },
      { title: "Quality", description: "Top-rated equipment and parts." },
      { title: "Speed", description: "Same-day service." },
    ],
    ownerName: "Michael Torres",
    ownerRole: "Owner & Founder",
    cta: { headline: "Work With Us", subheadline: "Join satisfied homeowners.", buttonText: "Contact Us" },
  },
  contactPage: {
    headline: "Contact Us",
    intro: "Ready to schedule service?",
    formHeadline: "Send Us a Message",
    formButtonText: "Send Message",
    hours: "Mon-Fri 8am-6pm",
    cta: { headline: "Call Now", subheadline: "Same-day available.", buttonText: "Call Us" },
  },
  servicePages: [validServicePage],
  cityPages: [validCityPage],
}

describe("TitanContentSchema", () => {
  it("validates a complete valid Titan content object", () => {
    const result = TitanContentSchema.safeParse(validTitan)
    if (!result.success) {
      console.error(result.error.issues)
    }
    expect(result.success).toBe(true)
  })

  it("requires at least 1 service page", () => {
    const invalid = { ...validTitan, servicePages: [] }
    const result = TitanContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("requires at least 1 city page", () => {
    const invalid = { ...validTitan, cityPages: [] }
    const result = TitanContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("rejects service page slug with uppercase", () => {
    const invalid = {
      ...validTitan,
      servicePages: [{ ...validServicePage, slug: "AC-Repair" }],
    }
    const result = TitanContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("rejects city page slug with spaces", () => {
    const invalid = {
      ...validTitan,
      cityPages: [{ ...validCityPage, slug: "austin tx" }],
    }
    const result = TitanContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("inherits Core schema structure", () => {
    const result = TitanContentSchema.safeParse(validTitan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.home.hero.headline).toBe("Austin's Trusted HVAC Experts")
      expect(result.data.servicePages[0].slug).toBe("ac-repair")
      expect(result.data.cityPages[0].city).toBe("Austin")
    }
  })
})
