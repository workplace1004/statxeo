import { getStatxaiSupabase } from "./supabase"

/**
 * Reconcile paid website purchases into site projects.
 *
 * Detects statxeo_leads with status='paid' + a purchase with purchased_at set,
 * where no statxeo_site_projects row exists yet. Creates the project row and
 * seeds it from the lead's intake_json + existing lead images.
 *
 * Query logic derived from STATXT webhook handler:
 *   - checkout.session.completed sets leads.status='paid'
 *   - checkout.session.completed sets purchases.purchased_at=now()
 *   - package_tier IN ('statxeo_lander', 'statxeo_core', 'statxeo_titan')
 *
 * Designed to be called from a cron route or on-demand.
 * Idempotent: will not create duplicates (unique index on lead_id).
 */

const WEBSITE_PACKAGE_TIERS = ["statxeo_lander", "statxeo_core", "statxeo_titan"] as const

interface ReconciliationResult {
  processed: number
  created: number
  errors: Array<{ leadId: string; error: string }>
}

export async function reconcilePaidOrders(): Promise<ReconciliationResult> {
  const supabase = getStatxaiSupabase()

  const result: ReconciliationResult = { processed: 0, created: 0, errors: [] }

  // Find paid website leads that don't have a site project yet.
  // Uses a LEFT JOIN anti-pattern: select leads where no site_projects row exists.
  const { data: unreconciled, error: queryError } = await supabase
    .from("statxeo_leads")
    .select(`
      id,
      status,
      package_tier,
      business_name,
      contact_name,
      contact_email,
      contact_phone,
      intake_json,
      created_at,
      statxeo_purchases!inner (
        id,
        package_tier,
        purchased_at,
        total_cents
      )
    `)
    .eq("status", "paid")
    .in("package_tier", [...WEBSITE_PACKAGE_TIERS])
    .not("statxeo_purchases.purchased_at", "is", null)
    .order("created_at", { ascending: true })
    .limit(50)

  if (queryError) {
    result.errors.push({ leadId: "query", error: queryError.message })
    return result
  }

  if (!unreconciled || unreconciled.length === 0) {
    return result
  }

  // Filter out leads that already have a site project
  const leadIds = unreconciled.map((lead) => lead.id)
  const { data: existingProjects } = await supabase
    .from("statxeo_site_projects")
    .select("lead_id")
    .in("lead_id", leadIds)

  const existingLeadIds = new Set((existingProjects ?? []).map((p) => p.lead_id))
  const leadsToProcess = unreconciled.filter((lead) => !existingLeadIds.has(lead.id))

  result.processed = leadsToProcess.length

  for (const lead of leadsToProcess) {
    try {
      await createProjectFromLead(supabase, lead)
      result.created++
    } catch (err) {
      result.errors.push({
        leadId: lead.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return result
}

async function createProjectFromLead(
  supabase: ReturnType<typeof getStatxaiSupabase>,
  lead: {
    id: string
    package_tier: string | null
    business_name: string | null
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
    intake_json: Record<string, unknown>
    statxeo_purchases: Array<{
      id: string
      package_tier: string | null
      purchased_at: string | null
      total_cents: number | null
    }>
  },
) {
  const intake = (lead.intake_json ?? {}) as Record<string, unknown>
  const purchase = lead.statxeo_purchases[0]

  if (!purchase) {
    throw new Error("No purchase found for lead")
  }

  // Create the site project seeded from checkout data.
  // Status = 'awaiting_preferences' because checkout doesn't collect
  // brand tone, colors, audience etc. Customer needs to fill those in.
  const { data: project, error: insertError } = await supabase
    .from("statxeo_site_projects")
    .insert({
      lead_id: lead.id,
      purchase_id: purchase.id,
      package_tier: lead.package_tier ?? "statxeo_lander",

      // Denormalize from intake_json, fallback to lead columns
      business_name: stringOrNull(intake.businessName) ?? lead.business_name,
      business_industry: stringOrNull(intake.businessIndustry),
      business_address: stringOrNull(intake.businessAddressFull),
      business_products_services: stringOrNull(intake.businessProductsServices),
      owner_full_name: stringOrNull(intake.ownerFullName) ?? lead.contact_name,
      email: stringOrNull(intake.email) ?? lead.contact_email,
      phone: stringOrNull(intake.phone) ?? lead.contact_phone,

      status: "awaiting_preferences",
    })
    .select("id")
    .single()

  if (insertError) {
    // Unique constraint violation means project already exists — not an error
    if (insertError.code === "23505") {
      return
    }
    throw new Error(`Failed to create site project: ${insertError.message}`)
  }

  if (!project) {
    throw new Error("No project returned after insert")
  }

  // Seed the initial intake submission from checkout data
  await supabase.from("statxeo_site_intake_submissions").insert({
    project_id: project.id,
    version: 1,
    source: "checkout_seed",
    raw_payload: intake,
    normalized_payload: {
      businessName: stringOrNull(intake.businessName) ?? lead.business_name,
      businessIndustry: stringOrNull(intake.businessIndustry),
      businessAddress: stringOrNull(intake.businessAddressFull),
      businessProductsServices: stringOrNull(intake.businessProductsServices),
      ownerFullName: stringOrNull(intake.ownerFullName) ?? lead.contact_name,
      email: stringOrNull(intake.email) ?? lead.contact_email,
      phone: stringOrNull(intake.phone) ?? lead.contact_phone,
      packageTier: lead.package_tier,
    },
  })

  // Copy any existing lead images into site media assets
  const { data: leadImages } = await supabase
    .from("statxeo_lead_images")
    .select("storage_bucket, storage_path, public_url, sort_order")
    .eq("lead_id", lead.id)
    .order("sort_order", { ascending: true })

  if (leadImages && leadImages.length > 0) {
    const mediaInserts = leadImages.map((img, idx) => ({
      project_id: project.id,
      asset_type: "photo" as const,
      storage_bucket: img.storage_bucket ?? "statxeo-site-assets",
      storage_path: img.storage_path ?? "",
      sort_order: img.sort_order ?? idx,
    }))

    // Filter out entries without a storage path
    const validInserts = mediaInserts.filter((m) => m.storage_path.length > 0)

    if (validInserts.length > 0) {
      await supabase.from("statxeo_site_media_assets").insert(validInserts)
    }
  }
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim()
  }
  return null
}
