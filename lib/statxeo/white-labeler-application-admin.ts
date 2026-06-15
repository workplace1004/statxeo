import { syncWhiteLabelerBrandingCompletedFlag } from "@/lib/statxeo/white-labeler-launch-gates"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>

type AuthListUser = {
  id?: string
  email?: string | null
}

type ApplicationRow = {
  id: string
  status: string | null
  contact_full_name: string | null
  contact_email: string | null
  company_name: string | null
  desired_slug: string | null
  created_at: string | null
  approved_white_labeler_id: string | null
}

type WhiteLabelerRow = {
  id: string | null
  slug?: string | null
}

type PlanOverrideRow = {
  id: string | null
}

export type ApproveWhiteLabelerApplicationInput = {
  applicationId: string
  reviewerUserId: string
  displayName?: string
  slug?: string
  ownerPassword?: string
  planCode?: string
  reviewNotes?: string | null
}

export type ApproveWhiteLabelerApplicationResult = {
  applicationId: string
  ownerUserId: string
  ownerEmail: string
  temporaryPassword: string | null
  whiteLabelerId: string
  slug: string
  createdOwnerUser: boolean
  createdWhiteLabeler: boolean
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

function deriveSlug(displayName: string, fallback = "white-label-partner") {
  const normalized = normalizeSlug(displayName)
  return normalized.length > 1 ? normalized.slice(0, 60) : fallback
}

function normalizePlanCode(value: string | undefined) {
  const normalized = normalizeSlug(value || "statxeo_core").replace(/-/g, "_")
  return normalized.length > 0 ? normalized : "statxeo_core"
}

function generateTemporaryPassword(length = 18) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
  let result = ""

  for (let index = 0; index < length; index += 1) {
    const charIndex = Math.floor(Math.random() * alphabet.length)
    result += alphabet[charIndex] ?? "A"
  }

  return result
}

async function findAuthUserByEmail(adminClient: AdminSupabaseClient, email: string) {
  const target = normalizeEmail(email)

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })

    if (error) {
      throw new Error("Unable to inspect auth users for partner approval.")
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
      temporaryPassword: null,
    }
  }

  const password = ownerPassword && ownerPassword.trim().length >= 10 ? ownerPassword.trim() : generateTemporaryPassword()

  const { data, error } = await adminClient.auth.admin.createUser({
    email: normalizeEmail(ownerEmail),
    password,
    email_confirm: true,
    user_metadata: {
      source: "statxeo_partner_application_approval",
    },
  })

  if (error || !data?.user?.id) {
    throw new Error("Unable to create owner user for approved partner application.")
  }

  return {
    userId: data.user.id,
    created: true,
    temporaryPassword: password,
  }
}

async function findAvailableSlug(adminClient: AdminSupabaseClient, preferredSlug: string, existingWhiteLabelerId?: string | null) {
  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? preferredSlug : `${preferredSlug}-${index + 1}`
    const { data, error } = await adminClient
      .from("statxeo_white_labelers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (error) {
      throw new Error("Unable to validate the requested partner workspace slug.")
    }

    const existing = data as WhiteLabelerRow | null

    if (!existing?.id || existing.id === existingWhiteLabelerId) {
      return candidate
    }
  }

  throw new Error("Unable to find an available workspace slug for this partner application.")
}

async function resolveOrCreateWhiteLabeler(params: {
  adminClient: AdminSupabaseClient
  ownerUserId: string
  displayName: string
  preferredSlug: string
  applicationCreatedAt: string | null
  existingWhiteLabelerId?: string | null
}) {
  const { adminClient, ownerUserId, displayName, preferredSlug, applicationCreatedAt, existingWhiteLabelerId } = params

  if (existingWhiteLabelerId) {
    const { data: existingData, error: existingError } = await adminClient
      .from("statxeo_white_labelers")
      .select("id, slug")
      .eq("id", existingWhiteLabelerId)
      .maybeSingle()

    if (existingError) {
      throw new Error("Unable to load the approved partner workspace.")
    }

    const existing = existingData as WhiteLabelerRow | null
    if (existing?.id) {
      return {
        whiteLabelerId: existing.id,
        slug: existing.slug ?? preferredSlug,
        created: false,
      }
    }
  }

  const slug = await findAvailableSlug(adminClient, preferredSlug, existingWhiteLabelerId)

  const { data: insertedData, error: insertError } = await adminClient
    .from("statxeo_white_labelers")
    .insert({
      slug,
      owner_user_id: ownerUserId,
      display_name: displayName,
      status: "active",
      default_currency: "usd",
      default_payout_day: 1,
      signup_submitted_at: applicationCreatedAt ?? new Date().toISOString(),
      onboarding_started_at: new Date().toISOString(),
      org_created_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single()

  if (insertError) {
    throw new Error("Unable to create white-labeler account for approved application.")
  }

  const inserted = insertedData as WhiteLabelerRow | null
  if (!inserted?.id) {
    throw new Error("Approved white-labeler creation returned an invalid id.")
  }

  return {
    whiteLabelerId: inserted.id,
    slug: inserted.slug ?? slug,
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
    throw new Error("Unable to assign owner membership for approved partner application.")
  }
}

async function ensureBrandingSeed(adminClient: AdminSupabaseClient, whiteLabelerId: string, displayName: string, ownerEmail: string) {
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
    throw new Error("Unable to initialize branding for approved partner application.")
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
    throw new Error("Unable to check pricing defaults for approved partner application.")
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
    throw new Error("Unable to initialize pricing defaults for approved partner application.")
  }
}

export async function approveWhiteLabelerApplication(
  input: ApproveWhiteLabelerApplicationInput,
): Promise<ApproveWhiteLabelerApplicationResult> {
  const adminClient = createAdminSupabaseClient()

  const { data: applicationData, error: applicationError } = await adminClient
    .from("statxeo_white_labeler_applications")
    .select("id, status, contact_full_name, contact_email, company_name, desired_slug, created_at, approved_white_labeler_id")
    .eq("id", input.applicationId)
    .maybeSingle()

  if (applicationError) {
    throw new Error("Unable to load partner application.")
  }

  const application = applicationData as ApplicationRow | null
  if (!application?.id || !application.contact_email || !application.company_name) {
    throw new Error("Partner application not found.")
  }

  const applicationStatus = (application.status ?? "").trim().toLowerCase()
  if (applicationStatus !== "pending_review") {
    throw new Error(
      `Partner application cannot be approved from status "${application.status ?? "unknown"}". Only pending_review applications can be approved.`,
    )
  }

  const displayName = (input.displayName || application.company_name).trim()
  const preferredSlug = deriveSlug(input.slug || application.desired_slug || application.company_name)
  const ownerEmail = normalizeEmail(application.contact_email)
  const planCode = normalizePlanCode(input.planCode)

  const owner = await resolveOrCreateOwnerUser(adminClient, ownerEmail, input.ownerPassword)
  const whiteLabeler = await resolveOrCreateWhiteLabeler({
    adminClient,
    ownerUserId: owner.userId,
    displayName,
    preferredSlug,
    applicationCreatedAt: application.created_at,
    existingWhiteLabelerId: application.approved_white_labeler_id,
  })

  await ensureOwnerMembership(adminClient, whiteLabeler.whiteLabelerId, owner.userId)
  await ensureBrandingSeed(adminClient, whiteLabeler.whiteLabelerId, displayName, ownerEmail)
  await ensureDefaultPricingSeed({
    adminClient,
    whiteLabelerId: whiteLabeler.whiteLabelerId,
    ownerUserId: owner.userId,
    planCode,
  })

  const { error: updateError } = await adminClient
    .from("statxeo_white_labeler_applications")
    .update({
      status: "approved",
      review_notes: input.reviewNotes ?? null,
      reviewed_by_user_id: input.reviewerUserId,
      reviewed_at: new Date().toISOString(),
      approved_white_labeler_id: whiteLabeler.whiteLabelerId,
    })
    .eq("id", application.id)

  if (updateError) {
    throw new Error("Unable to finalize partner application approval.")
  }

  return {
    applicationId: application.id,
    ownerUserId: owner.userId,
    ownerEmail,
    temporaryPassword: owner.temporaryPassword,
    whiteLabelerId: whiteLabeler.whiteLabelerId,
    slug: whiteLabeler.slug,
    createdOwnerUser: owner.created,
    createdWhiteLabeler: whiteLabeler.created,
  }
}