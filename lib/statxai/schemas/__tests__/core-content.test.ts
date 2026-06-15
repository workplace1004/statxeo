import { describe, it, expect } from "vitest"
import { CoreContentSchema } from "../core-content"

const validCore = {
  home: {
    hero: {
      headline: "Austin's Trusted HVAC Experts",
      subheadline: "Fast, reliable heating and cooling service for Austin homeowners.",
      ctaText: "Get a Free Quote",
      backgroundImagePrompt: "HVAC technician working on air conditioning unit",
    },
    featuredServices: [
      { title: "AC Repair", description: "Fast AC repair for Austin homes.", icon: "wrench" },
      { title: "Heating", description: "Expert furnace and heat pump service.", icon: "zap" },
      { title: "Duct Cleaning", description: "Improve air quality with professional cleaning.", icon: "shield" },
    ],
    aboutPreview: {
      headline: "Family-Owned Since 2008",
      body: "Torres Home Comfort has served Austin families for over 15 years.",
      ownerName: "Michael Torres",
      ownerRole: "Owner & Founder",
    },
    testimonials: {
      headline: "What Our Clients Say",
      items: [
        { quote: "Michael fixed our AC in under 2 hours. Incredible service!", name: "Sarah K.", role: "Homeowner" },
        { quote: "Best HVAC company in Austin. Fair prices and honest work.", name: "James R.", role: "Property Manager" },
      ],
    },
    stats: [
      { value: "500+", label: "Clients Served" },
      { value: "15 Years", label: "Experience" },
      { value: "4.9★", label: "Rating" },
    ],
    primaryCta: {
      headline: "Ready to Stay Comfortable?",
      subheadline: "Call us today for same-day service.",
      buttonText: "Call Now",
    },
  },
  servicesPage: {
    headline: "Our HVAC Services",
    intro: "We offer comprehensive heating and cooling solutions for Austin homeowners.",
    services: [
      {
        title: "AC Repair",
        description: "Fast, reliable AC repair for all makes and models.",
        features: ["Same-day service", "All brands", "Licensed technicians"],
        icon: "wrench",
      },
      {
        title: "Heating",
        description: "Expert furnace and heat pump installation and repair.",
        features: ["Gas & electric", "Heat pumps", "Emergency service"],
        icon: "zap",
      },
      {
        title: "Maintenance",
        description: "Seasonal tune-ups to keep your system running efficiently.",
        features: ["Spring & fall", "Filter replacement", "Full inspection"],
        icon: "settings",
      },
    ],
    faq: [
      { question: "How quickly can you respond?", answer: "We offer same-day service for most repairs." },
      { question: "Do you offer financing?", answer: "Yes, we offer flexible financing options." },
      { question: "Are you licensed and insured?", answer: "Yes, fully licensed and insured in Texas." },
    ],
    cta: { headline: "Need HVAC Service?", subheadline: "Call us for a free estimate.", buttonText: "Get a Quote" },
  },
  aboutPage: {
    headline: "About Torres Home Comfort",
    story: "Founded in 2008 by Michael Torres, we have grown to serve over 500 Austin families.",
    mission: "To provide honest, reliable HVAC service at fair prices.",
    values: [
      { title: "Honesty", description: "We give you straight answers and fair prices." },
      { title: "Quality", description: "We use only top-rated equipment and parts." },
      { title: "Speed", description: "Same-day service because your comfort matters." },
    ],
    ownerName: "Michael Torres",
    ownerRole: "Owner & Founder",
    cta: { headline: "Work With Us", subheadline: "Join hundreds of satisfied Austin homeowners.", buttonText: "Contact Us" },
  },
  contactPage: {
    headline: "Contact Us",
    intro: "Ready to schedule service? Reach out today.",
    formHeadline: "Send Us a Message",
    formButtonText: "Send Message",
    hours: "Mon-Fri 8am-6pm, Sat 9am-3pm",
    cta: { headline: "Call Us Now", subheadline: "Same-day service available.", buttonText: "Call (512) 555-4821" },
  },
}

describe("CoreContentSchema", () => {
  it("validates a complete valid Core content object", () => {
    const result = CoreContentSchema.safeParse(validCore)
    expect(result.success).toBe(true)
  })

  it("requires at least 3 featured services on home page", () => {
    const invalid = {
      ...validCore,
      home: {
        ...validCore.home,
        featuredServices: validCore.home.featuredServices.slice(0, 2),
      },
    }
    const result = CoreContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("requires at least 3 services on services page", () => {
    const invalid = {
      ...validCore,
      servicesPage: {
        ...validCore.servicesPage,
        services: validCore.servicesPage.services.slice(0, 2),
      },
    }
    const result = CoreContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("requires at least 3 values on about page", () => {
    const invalid = {
      ...validCore,
      aboutPage: {
        ...validCore.aboutPage,
        values: validCore.aboutPage.values.slice(0, 2),
      },
    }
    const result = CoreContentSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it("rejects missing required fields", () => {
    const result = CoreContentSchema.safeParse({ home: {} })
    expect(result.success).toBe(false)
  })
})
