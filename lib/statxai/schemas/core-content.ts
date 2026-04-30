import { z } from "zod"

/**
 * Strict JSON schema for core-default template output.
 * 4 pages: Home, Services, About, Contact.
 * Used with generateObject() — the LLM must produce exactly this shape.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export const CoreServiceItemSchema = z.object({
  title: z.string().describe("Service name, 2-5 words"),
  description: z.string().describe("Service description, 25-50 words"),
  features: z.array(z.string().describe("Feature bullet, 3-8 words")).min(2).max(5),
  icon: z.string().describe("Lucide icon name, e.g. 'wrench', 'shield', 'zap'"),
})

export const CoreTestimonialSchema = z.object({
  quote: z.string().describe("Testimonial text, 20-50 words, realistic and specific"),
  name: z.string().describe("Customer first name and last initial"),
  role: z.string().describe("e.g. 'Homeowner', 'Business Owner', 'Property Manager'"),
})

export const CoreStatSchema = z.object({
  value: z.string().describe("Stat value, e.g. '500+', '15 Years', '4.9★'"),
  label: z.string().describe("Stat label, e.g. 'Clients Served', 'Experience', 'Rating'"),
})

export const CoreFaqItemSchema = z.object({
  question: z.string().describe("FAQ question, 5-15 words"),
  answer: z.string().describe("FAQ answer, 30-80 words"),
})

export const CoreCtaSchema = z.object({
  headline: z.string().describe("CTA heading, 4-8 words"),
  subheadline: z.string().describe("CTA supporting text, 10-20 words"),
  buttonText: z.string().describe("Button label, 2-5 words"),
})

// ─── Home page ────────────────────────────────────────────────────────────────

export const CoreHomePageSchema = z.object({
  hero: z.object({
    headline: z.string().describe("Primary headline, 5-12 words, action-oriented"),
    subheadline: z.string().describe("Supporting text, 15-30 words, value proposition"),
    ctaText: z.string().describe("CTA button text, 2-5 words"),
    backgroundImagePrompt: z.string().describe("Image generation prompt for hero, 10-20 words"),
  }),
  featuredServices: z.array(
    z.object({
      title: z.string().describe("Service name, 2-5 words"),
      description: z.string().describe("Service teaser, 15-30 words"),
      icon: z.string().describe("Lucide icon name"),
    }),
  ).min(3).max(4).describe("Top services shown on home page"),
  aboutPreview: z.object({
    headline: z.string().describe("About section heading, 4-8 words"),
    body: z.string().describe("About preview text, 40-80 words"),
    ownerName: z.string(),
    ownerRole: z.string().describe("e.g. 'Owner & Founder'"),
  }),
  testimonials: z.object({
    headline: z.string().describe("Section heading, e.g. 'What Our Clients Say'"),
    items: z.array(CoreTestimonialSchema).min(2).max(3),
  }),
  stats: z.array(CoreStatSchema).min(3).max(4).describe("Trust/social proof stats"),
  primaryCta: CoreCtaSchema,
})

// ─── Services page ────────────────────────────────────────────────────────────

export const CoreServicesPageSchema = z.object({
  headline: z.string().describe("Page heading, 3-8 words"),
  intro: z.string().describe("Page intro text, 30-60 words"),
  services: z.array(CoreServiceItemSchema).min(3).max(8),
  faq: z.array(CoreFaqItemSchema).min(3).max(6),
  cta: CoreCtaSchema,
})

// ─── About page ───────────────────────────────────────────────────────────────

export const CoreAboutPageSchema = z.object({
  headline: z.string().describe("Page heading, 4-8 words"),
  story: z.string().describe("Company story, 80-150 words, first or third person"),
  mission: z.string().describe("Mission statement, 20-50 words"),
  values: z.array(
    z.object({
      title: z.string().describe("Value name, 1-3 words"),
      description: z.string().describe("Value description, 15-30 words"),
    }),
  ).min(3).max(5),
  ownerName: z.string(),
  ownerRole: z.string().describe("e.g. 'Owner & Founder', 'Lead Contractor'"),
  cta: CoreCtaSchema,
})

// ─── Contact page ─────────────────────────────────────────────────────────────

export const CoreContactPageSchema = z.object({
  headline: z.string().describe("Page heading, 3-7 words"),
  intro: z.string().describe("Contact page intro, 20-40 words"),
  formHeadline: z.string().describe("Form section heading, 3-6 words"),
  formButtonText: z.string().describe("Form submit button text, 2-4 words"),
  hours: z.string().describe("Business hours summary, e.g. 'Mon-Fri 8am-6pm, Sat 9am-3pm'"),
  cta: CoreCtaSchema,
})

// ─── Root schema ──────────────────────────────────────────────────────────────

export const CoreContentSchema = z.object({
  home: CoreHomePageSchema,
  servicesPage: CoreServicesPageSchema,
  aboutPage: CoreAboutPageSchema,
  contactPage: CoreContactPageSchema,
})

export type CoreContent = z.infer<typeof CoreContentSchema>
export type CoreServiceItem = z.infer<typeof CoreServiceItemSchema>
export type CoreFaqItem = z.infer<typeof CoreFaqItemSchema>
