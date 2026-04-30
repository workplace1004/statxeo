import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import { selectContentSchema } from "../schemas"
import { dedupeSlugList } from "../utils/slugify"
import type { NormalizedIntake } from "../schemas/intake"

/**
 * Stage: assembling_prompt
 *
 * Builds the system + user prompt for the LLM from normalized intake data.
 * For Titan, deterministic slugs are generated here and passed into the
 * prompt so the model echoes them back rather than inventing its own.
 *
 * Design principle: prompts are deterministic given the same intake.
 */

export async function assemblePrompt(ctx: JobContext): Promise<void> {
  const artifact = await readArtifact<{
    normalizedIntake: NormalizedIntake
    template: { name: string; slotSchema: unknown; pages: string[] }
  }>(ctx.projectId, "generated_copy")

  const { normalizedIntake: intake, template } = artifact

  // For Titan: generate canonical slug tables before prompt assembly
  const serviceSlugs =
    template.name === "titan-default" && intake.offeredServices?.length
      ? dedupeSlugList(intake.offeredServices)
      : []

  const citySlugs =
    template.name === "titan-default" && intake.serviceAreas?.length
      ? dedupeSlugList(intake.serviceAreas)
      : []

  const systemPrompt = buildSystemPrompt(template.name)
  const userPrompt = buildUserPrompt(intake, template, serviceSlugs, citySlugs)

  await writeArtifact(ctx.jobId, ctx.projectId, "prompt", {
    systemPrompt,
    userPrompt,
    templateName: template.name,
    intakeSnapshot: intake,
    assembledAt: new Date().toISOString(),
  })

  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    normalizedIntake: intake,
    template,
    systemPrompt,
    userPrompt,
    // Store slug tables for use in validate-output
    serviceSlugs: intake.offeredServices
      ? Object.fromEntries(
          (intake.offeredServices ?? []).map((s, i) => [s, serviceSlugs[i] ?? ""]),
        )
      : null,
    citySlugs: intake.serviceAreas
      ? Object.fromEntries(
          (intake.serviceAreas ?? []).map((s, i) => [s, citySlugs[i] ?? ""]),
        )
      : null,
  })
}

function buildSystemPrompt(templateName: string): string {
  const schema = selectContentSchema(templateName)
  const schemaJson = JSON.stringify(schema._def, null, 2).slice(0, 4000)

  return `You are an expert web copywriter and SEO specialist creating content for a local business website.

Your task is to generate structured JSON website content. You must respond with valid JSON only — no prose, no markdown, no explanations.

Rules:
- Every field is required unless marked optional
- Write in a natural, human tone that matches the specified brand tone
- Use the business's actual services, location, and unique selling points
- Write testimonials that sound realistic and specific, not generic
- All copy must be concise — no padding or filler
- CTA buttons must match the preferred call-to-action type
- Phone numbers and emails must appear exactly as provided
- Do not invent services the business does not offer
- Produce content appropriate for the "${templateName}" template
- For slug fields: echo back the exact slug provided — do not modify or invent slugs

Output format: strict JSON matching the schema provided. No other text.`
}

function buildUserPrompt(
  intake: NormalizedIntake,
  template: { name: string; slotSchema: unknown; pages: string[] },
  serviceSlugs: string[],
  citySlugs: string[],
): string {
  const lines: string[] = []
  const premiumDirectives = buildPremiumDirectives(intake, template.name)

  lines.push("Generate website content for the following business:")
  lines.push("")

  lines.push(`Business Name: ${intake.businessName}`)
  if (intake.businessIndustry) lines.push(`Industry: ${intake.businessIndustry}`)
  if (intake.businessAddress) lines.push(`Location: ${intake.businessAddress}`)
  if (intake.ownerFullName) lines.push(`Owner: ${intake.ownerFullName}`)
  if (intake.email) lines.push(`Email: ${intake.email}`)
  if (intake.phone) lines.push(`Phone: ${intake.phone}`)

  lines.push("")

  if (intake.businessProductsServices) {
    lines.push(`Services/Products:`)
    lines.push(intake.businessProductsServices)
    lines.push("")
  }

  if (intake.brandTone) lines.push(`Brand Tone: ${intake.brandTone}`)
  if (intake.targetAudience) lines.push(`Target Audience: ${intake.targetAudience}`)
  if (intake.ctaPreference) {
    const ctaText = intake.ctaCustomText ? `"${intake.ctaCustomText}"` : intake.ctaPreference
    lines.push(`Call-to-Action Style: ${ctaText}`)
  }

  if (intake.uniqueSellingPoints && intake.uniqueSellingPoints.length > 0) {
    lines.push("")
    lines.push("Unique Selling Points:")
    for (const usp of intake.uniqueSellingPoints) {
      lines.push(`- ${usp}`)
    }
  }

  if (intake.serviceAreas && intake.serviceAreas.length > 0) {
    lines.push("")
    lines.push(`Service Areas: ${intake.serviceAreas.join(", ")}`)
  }

  if (intake.businessHours && typeof intake.businessHours === "object") {
    const hours = intake.businessHours as Record<string, string>
    const hoursSummary = Object.entries(hours)
      .filter(([k]) => k !== "notes")
      .map(([day, time]) => `${capitalize(day)}: ${time}`)
      .join(", ")
    if (hoursSummary) lines.push(`Business Hours: ${hoursSummary}`)
    if (hours.notes) lines.push(`Hours Note: ${hours.notes}`)
  }

  lines.push("")
  lines.push(`Template: ${template.name}`)
  lines.push(`Pages: ${template.pages.join(", ")}`)
  lines.push("Important: Generate content only for fields defined in the schema. Do not add extra pages/keys.")

  if (premiumDirectives.length > 0) {
    lines.push("")
    lines.push("High-Priority Brand & Compliance Directives:")
    for (const directive of premiumDirectives) {
      lines.push(`- ${directive}`)
    }
  }

  // Titan-specific: inject canonical slug tables
  if (template.name === "titan-default") {
    if (intake.offeredServices?.length && serviceSlugs.length) {
      lines.push("")
      lines.push("Service Pages — use these EXACT slugs (do not modify):")
      intake.offeredServices.forEach((service, i) => {
        lines.push(`  ${service} → slug: "${serviceSlugs[i]}"`)
      })
    }

    if (intake.serviceAreas?.length && citySlugs.length) {
      lines.push("")
      lines.push("City Pages — use these EXACT slugs (do not modify):")
      intake.serviceAreas.forEach((city, i) => {
        lines.push(`  ${city} → slug: "${citySlugs[i]}"`)
      })
    }
  }

  lines.push("")
  lines.push("Output Schema (produce JSON matching this structure exactly):")
  lines.push(JSON.stringify(template.slotSchema, null, 2))

  return lines.join("\n")
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function buildPremiumDirectives(
  intake: NormalizedIntake,
  templateName: string,
): string[] {
  const directives: string[] = []
  const searchable = [
    intake.businessIndustry,
    intake.businessProductsServices,
    intake.businessName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const isFinancialServices =
    /financial|finance|funding|capital|loan|lender|merchant cash advance|revenue[- ]based/.test(searchable)
  const isFloridaBusiness =
    /florida|, fl\\b|\\bfl\\b|melbourne beach/.test(searchable + " " + (intake.businessAddress ?? "").toLowerCase())

  // Global quality directives for premium outcomes
  directives.push("Use concise, premium, high-trust copy with strong hierarchy and no fluff.")
  directives.push("Tone must be established, professional, and confident — never hype-driven.")
  directives.push("Avoid generic small-business wording; sound like a sophisticated advisory brand.")
  directives.push("Keep testimonials realistic and restrained; no exaggerated outcomes or unverifiable claims.")

  if (isFinancialServices) {
    directives.push("Position the brand as credible financial services/capital solutions, not aggressive sales.")
    directives.push("Use compliance-safe wording. Do NOT claim guaranteed approval, instant guaranteed funding, or easy money.")
    directives.push("Avoid spammy lender language and avoid crypto-like jargon.")
    directives.push("Emphasize transparent process, secure inquiry handling, and professional communication.")
    directives.push("Include CTA language that supports qualified leads: Apply, Schedule Consultation, Speak With Team.")
  }

  if (isFloridaBusiness) {
    directives.push("Naturally reference Florida presence and local trust context where relevant.")
  }

  if (templateName === "core-default" || templateName === "titan-default") {
    directives.push("For contact-page copy, include a concise communication consent notice suitable for calls/email/SMS.")
    directives.push("Mention message frequency may vary and STOP/HELP guidance in neutral compliance language.")
  }

  return directives
}
