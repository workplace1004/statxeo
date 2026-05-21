import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import type { LanderContent } from "../schemas/lander-content"
import type { CoreContent } from "../schemas/core-content"
import type { TitanContent } from "../schemas/titan-content"
import type { NormalizedIntake } from "../schemas/intake"

/**
 * Stage: mapping_slots
 *
 * Maps validated content into route-scoped slot maps.
 * Output: slotsByRoute — Record<routeKey, Record<string, unknown>>
 *
 * Route keys:
 *   Lander:  { "index": {...} }
 *   Core:    { "index": {...}, "services": {...}, "about": {...}, "contact": {...} }
 *   Titan:   Core routes + { "services/{slug}": {...}, "{city-slug}": {...} }
 */

export type SlotsByRoute = Record<string, Record<string, unknown>>

export async function mapSlots(ctx: JobContext): Promise<void> {
  const validatedArtifact = await readArtifact<{
    content: unknown
    templateName: string
  }>(ctx.projectId, "validated_slots")

  const copyArtifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; pages: string[] }
  }>(ctx.projectId, "generated_copy")

  const slotsByRoute = buildSlotsByRoute(
    validatedArtifact.templateName,
    validatedArtifact.content,
    copyArtifact.normalizedIntake,
  )

  await writeArtifact(ctx.jobId, ctx.projectId, "validated_slots", {
    ...validatedArtifact,
    slotsByRoute,
    mappedAt: new Date().toISOString(),
  })
}

function buildSlotsByRoute(
  templateName: string,
  content: unknown,
  intake: NormalizedIntake,
): SlotsByRoute {
  switch (templateName) {
    case "lander-default":
      return buildLanderSlots(content as LanderContent, intake)
    case "core-default":
      return buildCoreSlots(content as CoreContent, intake)
    case "titan-default":
      return buildTitanSlots(content as TitanContent, intake)
    default:
      return buildLanderSlots(content as LanderContent, intake)
  }
}

// ─── Lander ───────────────────────────────────────────────────────────────────

function buildLanderSlots(content: LanderContent, intake: NormalizedIntake): SlotsByRoute {
  return {
    index: {
      "hero.headline": content.hero.headline,
      "hero.subheadline": content.hero.subheadline,
      "hero.ctaText": content.hero.ctaText,
      "hero.ctaUrl": resolveCtaUrl(content.hero.ctaUrl, intake),
      "hero.backgroundImagePrompt": content.hero.backgroundImagePrompt,

      "services.headline": content.services.headline,
      "services.items": content.services.items.map((item, i) => ({
        key: `service_${i}`,
        title: item.title,
        description: item.description,
        icon: item.icon,
      })),

      "about.headline": content.about.headline,
      "about.body": content.about.body,
      "about.ownerName": content.about.ownerName,
      "about.ownerRole": content.about.ownerRole,

      "testimonials.headline": content.testimonials.headline,
      "testimonials.items": content.testimonials.items.map((t, i) => ({
        key: `testimonial_${i}`,
        quote: t.quote,
        name: t.name,
        role: t.role,
      })),

      "contact.headline": content.contact.headline,
      "contact.subheadline": content.contact.subheadline,
      "contact.phone": intake.phone ?? content.contact.phone,
      "contact.email": intake.email ?? content.contact.email,
      "contact.address": intake.businessAddress ?? content.contact.address,
      "contact.hours": content.contact.hours,

      "cta.headline": content.cta.headline,
      "cta.subheadline": content.cta.subheadline,
      "cta.buttonText": content.cta.buttonText,
      "cta.buttonUrl": resolveCtaUrl(content.cta.buttonUrl, intake),

      "site.businessName": intake.businessName,
      "site.phone": intake.phone,
      "site.email": intake.email,
      "site.address": intake.businessAddress,
      "site.primaryColor": intake.primaryColor,
      "site.secondaryColor": intake.secondaryColor,
      "site.socialLinks": intake.socialLinks ?? {},
    },
  }
}

// ─── Core ─────────────────────────────────────────────────────────────────────

function buildCoreSlots(content: CoreContent, intake: NormalizedIntake): SlotsByRoute {
  const site = buildSiteGlobals(intake)

  return {
    index: {
      ...site,
      "hero.headline": content.home.hero.headline,
      "hero.subheadline": content.home.hero.subheadline,
      "hero.ctaText": content.home.hero.ctaText,
      "hero.backgroundImagePrompt": content.home.hero.backgroundImagePrompt,
      "featuredServices": content.home.featuredServices,
      "aboutPreview.headline": content.home.aboutPreview.headline,
      "aboutPreview.body": content.home.aboutPreview.body,
      "aboutPreview.ownerName": content.home.aboutPreview.ownerName,
      "aboutPreview.ownerRole": content.home.aboutPreview.ownerRole,
      "testimonials.headline": content.home.testimonials.headline,
      "testimonials.items": content.home.testimonials.items,
      "stats": content.home.stats,
      "primaryCta.headline": content.home.primaryCta.headline,
      "primaryCta.subheadline": content.home.primaryCta.subheadline,
      "primaryCta.buttonText": content.home.primaryCta.buttonText,
    },

    services: {
      ...site,
      "headline": content.servicesPage.headline,
      "intro": content.servicesPage.intro,
      "services": content.servicesPage.services,
      "faq": content.servicesPage.faq,
      "cta.headline": content.servicesPage.cta.headline,
      "cta.subheadline": content.servicesPage.cta.subheadline,
      "cta.buttonText": content.servicesPage.cta.buttonText,
    },

    about: {
      ...site,
      "headline": content.aboutPage.headline,
      "story": content.aboutPage.story,
      "mission": content.aboutPage.mission,
      "values": content.aboutPage.values,
      "ownerName": content.aboutPage.ownerName,
      "ownerRole": content.aboutPage.ownerRole,
      "cta.headline": content.aboutPage.cta.headline,
      "cta.subheadline": content.aboutPage.cta.subheadline,
      "cta.buttonText": content.aboutPage.cta.buttonText,
    },

    contact: {
      ...site,
      "headline": content.contactPage.headline,
      "intro": content.contactPage.intro,
      "formHeadline": content.contactPage.formHeadline,
      "formButtonText": content.contactPage.formButtonText,
      "hours": content.contactPage.hours,
      "cta.headline": content.contactPage.cta.headline,
      "cta.subheadline": content.contactPage.cta.subheadline,
      "cta.buttonText": content.contactPage.cta.buttonText,
    },
  }
}

// ─── Titan ────────────────────────────────────────────────────────────────────

function buildTitanSlots(content: TitanContent, intake: NormalizedIntake): SlotsByRoute {
  const coreSlots = buildCoreSlots(content, intake)
  const site = buildSiteGlobals(intake)
  const extraRoutes: SlotsByRoute = {}

  for (const sp of content.servicePages) {
    extraRoutes[`services/${sp.slug}`] = {
      ...site,
      "slug": sp.slug,
      "headline": sp.headline,
      "intro": sp.intro,
      "benefits": sp.benefits,
      "process": sp.process,
      "faq": sp.faq,
      "relatedServices": sp.relatedServices,
      "seo.title": sp.seo.title,
      "seo.description": sp.seo.description,
    }
  }

  for (const cp of content.cityPages) {
    extraRoutes[cp.slug] = {
      ...site,
      "slug": cp.slug,
      "city": cp.city,
      "headline": cp.headline,
      "intro": cp.intro,
      "serviceHighlights": cp.serviceHighlights,
      "localSignals": cp.localSignals,
      "seo.title": cp.seo.title,
      "seo.description": cp.seo.description,
    }
  }

  return { ...coreSlots, ...extraRoutes }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSiteGlobals(intake: NormalizedIntake): Record<string, unknown> {
  return {
    "site.businessName": intake.businessName,
    "site.phone": intake.phone,
    "site.email": intake.email,
    "site.address": intake.businessAddress,
    "site.primaryColor": intake.primaryColor,
    "site.secondaryColor": intake.secondaryColor,
    "site.socialLinks": intake.socialLinks ?? {},
  }
}

function resolveCtaUrl(llmUrl: string, intake: NormalizedIntake): string {
  if (llmUrl.startsWith("tel:") || llmUrl.startsWith("mailto:") || llmUrl.startsWith("http")) {
    return llmUrl
  }
  switch (intake.ctaPreference) {
    case "call":
      return intake.phone ? `tel:${intake.phone.replace(/\D/g, "")}` : "/contact/"
    case "book":
    case "quote":
    case "contact":
      return "/contact/"
    default:
      return "/contact/"
  }
}
