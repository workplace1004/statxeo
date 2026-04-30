import { syncWhiteLabelerBrandingCompletedFlag } from "@/lib/statxeo/white-labeler-launch-gates"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>

type AuthListUser = {
  id?: string
  email?: string | null
}

type WhiteLabelerRow = {
  id: string | null
}

type PlanOverrideRow = {
  id: string | null
}

type ClientRow = {
  id: string | null
  external_customer_id: string | null
}

type PayoutBatchRow = {
  id: string | null
}

export type SeedDemoWhiteLabelerInput = {
  displayName: string
  slug?: string
  ownerEmail: string
  ownerPassword?: string
  createSampleData?: boolean
  planCode?: string
}

export type SeedDemoWhiteLabelerResult = {
  ownerUserId: string
  whiteLabelerId: string
  slug: string
  createdOwnerUser: boolean
  createdWhiteLabeler: boolean
  insertedSampleClients: number
  insertedSampleCharges: number
  createdPayoutBatch: boolean
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function deriveSlug(displayName: string, fallback = "demo-white-labeler") {
  const normalized = normalizeSlug(displayName)
  return normalized.length > 1 ? normalized.slice(0, 60) : fallback
}

function getSettlementMonthIso(now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return monthStart.toISOString().slice(0, 10)
}

async function findAuthUserByEmail(adminClient: AdminSupabaseClient, email: string) {
  const target = normalizeEmail(email)

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })

    if (error) {
      throw new Error("Unable to inspect auth users for demo seed.")
    }

    const users = Array.isArray(data?.users) ? (data.users as AuthListUser[]) : []
    const matched = users.find((candidate) => normalizeEmail(candidate.email ?? "") === target)

    if (matched?.id) {
      return matched.id
    }

    if (users.length < 200) {
      break
    }
  }

  return null
}

async function resolveOrCreateOwnerUser(adminClient: AdminSupabaseClient, ownerEmail: string, ownerPassword?: string) {
  const existingUserId = await findAuthUserByEmail(adminClient, ownerEmail)

  if (existingUserId) {
    return {
      userId: existingUserId,
      created: false,
    }
  }

  if (!ownerPassword || ownerPassword.trim().length < 10) {
    throw new Error("owner_password is required (minimum 10 chars) when owner user does not already exist.")
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: normalizeEmail(ownerEmail),
    password: ownerPassword,
    email_confirm: true,
    user_metadata: {
      source: "statxeo_demo_seed",
    },
  })

  if (error || !data?.user?.id) {
    throw new Error("Unable to create demo owner user.")
  }

  return {
    userId: data.user.id,
    created: true,
  }
}

async function resolveOrCreateWhiteLabeler(params: {
  adminClient: AdminSupabaseClient
  ownerUserId: string
  displayName: string
  slug: string
}) {
  const { adminClient, ownerUserId, displayName, slug } = params

  const { data: existingBySlug, error: existingBySlugError } = await adminClient
    .from("statxeo_white_labelers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (existingBySlugError) {
    throw new Error("Unable to check for existing white-labeler account.")
  }

  const existing = existingBySlug as WhiteLabelerRow | null

  if (existing?.id) {
    return {
      whiteLabelerId: existing.id,
      created: false,
    }
  }

  const { data: insertedData, error: insertError } = await adminClient
    .from("statxeo_white_labelers")
    .insert({
      slug,
      owner_user_id: ownerUserId,
      display_name: displayName,
      status: "active",
      default_currency: "usd",
      default_payout_day: 1,
    })
    .select("id")
    .single()

  if (insertError) {
    throw new Error("Unable to create white-labeler account.")
  }

  const inserted = insertedData as WhiteLabelerRow | null
  if (!inserted?.id) {
    throw new Error("White-labeler creation returned an invalid id.")
  }

  return {
    whiteLabelerId: inserted.id,
    created: true,
  }
}

async function ensureOwnerMembership(adminClient: AdminSupabaseClient, whiteLabelerId: string, ownerUserId: string) {
  const { error } = await adminClient.from("statxeo_white_labeler_members").upsert(
    {
      white_labeler_id: whiteLabelerId,
      user_id: ownerUserId,
      role: "owner",
      is_active: true,
    },
    {
      onConflict: "white_labeler_id,user_id",
    },
  )

  if (error) {
    throw new Error("Unable to assign owner membership for demo white-labeler.")
  }
}

async function ensureBrandingSeed(
  adminClient: AdminSupabaseClient,
  whiteLabelerId: string,
  displayName: string,
  ownerEmail: string,
) {
  const { error } = await adminClient.from("statxeo_white_labeler_branding_settings").upsert(
    {
      white_labeler_id: whiteLabelerId,
      brand_name: displayName,
      primary_color: "#0f766e",
      secondary_color: "#ca8a04",
      logo_url: "https://statxeo.com/favicon.ico",
      support_email: ownerEmail,
    },
    {
      onConflict: "white_labeler_id",
    },
  )

  if (error) {
    throw new Error("Unable to initialize branding settings for demo white-labeler.")
  }

  await syncWhiteLabelerBrandingCompletedFlag(adminClient, whiteLabelerId)
}

async function ensureDefaultPricingSeed(params: {
  adminClient: AdminSupabaseClient
  whiteLabelerId: string
  ownerUserId: string
  planCode: string
}) {
  const { adminClient, whiteLabelerId, ownerUserId, planCode } = params

  const { data: existingPlanData, error: existingPlanError } = await adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .select("id")
    .eq("white_labeler_id", whiteLabelerId)
    .eq("plan_code", planCode)
    .eq("is_active", true)
    .limit(1)

  if (existingPlanError) {
    throw new Error("Unable to check plan overrides for demo white-labeler.")
  }

  const existingPlans = Array.isArray(existingPlanData) ? (existingPlanData as PlanOverrideRow[]) : []
  if (existingPlans.length > 0) {
    return
  }

  const { error } = await adminClient.from("statxeo_white_labeler_plan_overrides").insert({
    white_labeler_id: whiteLabelerId,
    plan_code: planCode,
    currency: "usd",
    amount_sold_cents: 99900,
    base_cost_cents: 50000,
    white_label_fee_cents: 10000,
    is_active: true,
    created_by_user_id: ownerUserId,
  })

  if (error) {
    throw new Error("Unable to initialize default pricing for demo white-labeler.")
  }
}

async function seedSampleClientsAndCharges(params: {
  adminClient: AdminSupabaseClient
  whiteLabelerId: string
  ownerUserId: string
  slug: string
  planCode: string
}) {
  const { adminClient, whiteLabelerId, ownerUserId, slug, planCode } = params

  const settlementMonth = getSettlementMonthIso()
  const nowIso = new Date().toISOString()

  const clientSeeds = [
    {
      white_labeler_id: whiteLabelerId,
      external_customer_id: `${slug}-acme`,
      client_name: "Acme Ventures",
      billing_email: "billing@acme.demo",
      status: "active",
      active_site_count: 3,
    },
    {
      white_labeler_id: whiteLabelerId,
      external_customer_id: `${slug}-northstar`,
      client_name: "Northstar Labs",
      billing_email: "ops@northstar.demo",
      status: "active",
      active_site_count: 2,
    },
    {
      white_labeler_id: whiteLabelerId,
      external_customer_id: `${slug}-summit`,
      client_name: "Summit Creative",
      billing_email: "accounts@summit.demo",
      status: "paused",
      active_site_count: 1,
    },
  ]

  const { error: upsertClientsError } = await adminClient.from("statxeo_white_labeler_clients").upsert(clientSeeds, {
    onConflict: "white_labeler_id,external_customer_id",
  })

  if (upsertClientsError) {
    throw new Error("Unable to seed demo clients.")
  }

  const externalIds = clientSeeds.map((client) => client.external_customer_id)
  const { data: seededClientRows, error: seededClientsError } = await adminClient
    .from("statxeo_white_labeler_clients")
    .select("id, external_customer_id")
    .eq("white_labeler_id", whiteLabelerId)
    .in("external_customer_id", externalIds)

  if (seededClientsError) {
    throw new Error("Unable to resolve seeded demo clients.")
  }

  const clients = Array.isArray(seededClientRows) ? (seededClientRows as ClientRow[]) : []

  const chargeSeeds = clients
    .filter((row) => typeof row.id === "string" && row.id.length > 0)
    .map((client, index) => ({
      white_labeler_id: whiteLabelerId,
      client_id: client.id,
      source_event_id: `${slug}-${settlementMonth}-demo-${index + 1}`,
      source_system: "manual",
      source_charge_type: "subscription",
      charge_status: "posted",
      settlement_month: settlementMonth,
      charged_at: nowIso,
      plan_code: planCode,
      currency: "usd",
      amount_sold_cents: 99900,
      base_cost_cents: 50000,
      white_label_fee_cents: 10000,
      metadata: {
        seeded_by: "statxeo_demo_seed",
        owner_user_id: ownerUserId,
      },
    }))

  if (chargeSeeds.length > 0) {
    const { error: upsertChargesError } = await adminClient.from("statxeo_white_labeler_charges").upsert(chargeSeeds, {
      onConflict: "white_labeler_id,source_event_id",
    })

    if (upsertChargesError) {
      throw new Error("Unable to seed demo charges.")
    }
  }

  const grossAmountCents = chargeSeeds.reduce((sum, row) => sum + row.amount_sold_cents, 0)
  const netAmountCents = chargeSeeds.reduce(
    (sum, row) => sum + Math.max(0, row.amount_sold_cents - (row.base_cost_cents + row.white_label_fee_cents)),
    0,
  )

  let createdPayoutBatch = false

  const { data: existingBatchData, error: existingBatchError } = await adminClient
    .from("statxeo_white_labeler_payout_batches")
    .select("id")
    .eq("white_labeler_id", whiteLabelerId)
    .eq("settlement_month", settlementMonth)
    .maybeSingle()

  if (existingBatchError) {
    throw new Error("Unable to check payout batches for demo seed.")
  }

  const existingBatch = existingBatchData as PayoutBatchRow | null

  if (!existingBatch?.id) {
    const { error: insertBatchError } = await adminClient.from("statxeo_white_labeler_payout_batches").insert({
      white_labeler_id: whiteLabelerId,
      settlement_month: settlementMonth,
      status: "draft",
      currency: "usd",
      gross_amount_cents: grossAmountCents,
      adjustment_amount_cents: 0,
      net_amount_cents: netAmountCents,
      locked_by_user_id: ownerUserId,
      notes: "Auto-seeded demo payout batch",
    })

    if (insertBatchError) {
      throw new Error("Unable to create demo payout batch.")
    }

    createdPayoutBatch = true
  }

  return {
    insertedSampleClients: clients.length,
    insertedSampleCharges: chargeSeeds.length,
    createdPayoutBatch,
  }
}

export async function seedDemoWhiteLabeler(input: SeedDemoWhiteLabelerInput): Promise<SeedDemoWhiteLabelerResult> {
  const adminClient = createAdminSupabaseClient()

  const displayName = input.displayName.trim()
  const ownerEmail = normalizeEmail(input.ownerEmail)
  const planCode = normalizeSlug(input.planCode || "statxeo_core") || "statxeo_core"
  const slug = input.slug ? normalizeSlug(input.slug) : deriveSlug(displayName)

  if (!displayName) {
    throw new Error("display_name is required.")
  }

  if (!ownerEmail || !ownerEmail.includes("@")) {
    throw new Error("owner_email must be a valid email address.")
  }

  const owner = await resolveOrCreateOwnerUser(adminClient, ownerEmail, input.ownerPassword)
  const whiteLabeler = await resolveOrCreateWhiteLabeler({
    adminClient,
    ownerUserId: owner.userId,
    displayName,
    slug,
  })

  await ensureOwnerMembership(adminClient, whiteLabeler.whiteLabelerId, owner.userId)
  await ensureBrandingSeed(adminClient, whiteLabeler.whiteLabelerId, displayName, ownerEmail)
  await ensureDefaultPricingSeed({
    adminClient,
    whiteLabelerId: whiteLabeler.whiteLabelerId,
    ownerUserId: owner.userId,
    planCode,
  })

  let sampleDataSummary = {
    insertedSampleClients: 0,
    insertedSampleCharges: 0,
    createdPayoutBatch: false,
  }

  if (input.createSampleData !== false) {
    sampleDataSummary = await seedSampleClientsAndCharges({
      adminClient,
      whiteLabelerId: whiteLabeler.whiteLabelerId,
      ownerUserId: owner.userId,
      slug,
      planCode,
    })
  }

  return {
    ownerUserId: owner.userId,
    whiteLabelerId: whiteLabeler.whiteLabelerId,
    slug,
    createdOwnerUser: owner.created,
    createdWhiteLabeler: whiteLabeler.created,
    insertedSampleClients: sampleDataSummary.insertedSampleClients,
    insertedSampleCharges: sampleDataSummary.insertedSampleCharges,
    createdPayoutBatch: sampleDataSummary.createdPayoutBatch,
  }
}
