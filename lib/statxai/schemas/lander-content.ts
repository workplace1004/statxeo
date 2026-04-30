import { z } from "zod"

/**
 * Strict JSON schema for lander-default template output.
 * Used with generateObject() — the LLM must produce exactly this shape.
 * Never raw HTML. Structured content only.
 */
export const LanderHeroSchema = z.object({
  headline: z.string().describe("Primary headline, 5-12 words, action-oriented"),
  subheadline: z.string().describe("Supporting text, 15-30 words, value proposition"),
  ctaText: z.string().describe("Call-to-action button text, 2-5 words"),
  ctaUrl: z.string().describe("CTA target: tel:, mailto:, or relative path"),
  backgroundImagePrompt: z.string().describe("Image generation prompt for hero background, 10-20 words"),
})

export const LanderServiceItemSchema = z.object({
  title: z.string().describe("Service name, 2-5 words"),
  description: z.string().describe("Service description, 20-40 words"),
  icon: z.string().describe("Lucide icon name, e.g. 'wrench', 'shield', 'zap'"),
})

export const LanderServicesSchema = z.object({
  headline: z.string().describe("Section heading, 3-8 words"),
  items: z.array(LanderServiceItemSchema).min(3).max(6),
})

export const LanderAboutSchema = z.object({
  headline: z.string().describe("About section heading"),
  body: z.string().describe("About text, 50-120 words, first person or third person"),
  ownerName: z.string(),
  ownerRole: z.string().describe("e.g. 'Owner & Founder', 'Lead Contractor'"),
})

export const LanderTestimonialSchema = z.object({
  quote: z.string().describe("Testimonial text, 20-50 words, realistic and specific"),
  name: z.string().describe("Customer first name and last initial"),
  role: z.string().describe("e.g. 'Homeowner', 'Business Owner', 'Property Manager'"),
})

export const LanderTestimonialsSchema = z.object({
  headline: z.string().describe("Section heading, e.g. 'What Our Clients Say'"),
  items: z.array(LanderTestimonialSchema).min(2).max(4),
})

export const LanderContactSchema = z.object({
  headline: z.string().describe("Contact section heading"),
  subheadline: z.string().describe("Contact section supporting text, 10-20 words"),
  phone: z.string().describe("Formatted phone number from intake"),
  email: z.string().describe("Business email from intake"),
  address: z.string().describe("Business address from intake"),
  hours: z.string().describe("Business hours summary, e.g. 'Mon-Fri 8am-6pm'"),
})

export const LanderCtaSchema = z.object({
  headline: z.string().describe("Final CTA heading, 4-8 words, urgency"),
  subheadline: z.string().describe("Supporting CTA text, 10-20 words"),
  buttonText: z.string().describe("CTA button text, 2-5 words"),
  buttonUrl: z.string().describe("CTA target URL"),
})

export const LanderContentSchema = z.object({
  hero: LanderHeroSchema,
  services: LanderServicesSchema,
  about: LanderAboutSchema,
  testimonials: LanderTestimonialsSchema,
  contact: LanderContactSchema,
  cta: LanderCtaSchema,
})

export type LanderContent = z.infer<typeof LanderContentSchema>
