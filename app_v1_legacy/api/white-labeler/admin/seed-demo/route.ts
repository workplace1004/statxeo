import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedPlatformAdmin } from "@/lib/statxeo/platform-admin-server"
import {
  seedDemoWhiteLabeler,
  type SeedDemoWhiteLabelerInput,
} from "@/lib/statxeo/white-labeler-demo-seed"
import { logWhiteLabelerAuditEvent } from "@/lib/statxeo/white-labeler-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SeedPayload = {
  display_name?: unknown
  slug?: unknown
  owner_email?: unknown
  owner_password?: unknown
  create_sample_data?: unknown
  plan_code?: unknown
}

function isDemoSeedEnabled() {
  const raw = process.env.ENABLE_WHITE_LABELER_DEMO_SEED?.trim().toLowerCase()
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on"
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeOptionalBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    return null
  }

  return value
}

function normalizeOwnerEmail(value: unknown) {
  const normalized = normalizeOptionalText(value)?.toLowerCase()
  if (!normalized) return null

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null
  }

  return normalized
}

function normalizeSlug(value: unknown) {
  const text = normalizeOptionalText(value)?.toLowerCase()
  if (!text) return null

  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(text)) {
    return null
  }

  return text
}

function normalizePlanCode(value: unknown) {
  const text = normalizeOptionalText(value)?.toLowerCase()
  if (!text) return null

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(text)) {
    return null
  }

  return text
}

export async function GET() {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  const enabled = isDemoSeedEnabled()

  return NextResponse.json({
    can_seed_demo_white_labeler: enabled,
    seed_demo_enabled: enabled,
    actor_user_id: platformAdmin.user.id,
    reason: enabled ? null : "Demo seeding is disabled for this environment.",
  })
}

export async function POST(request: NextRequest) {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  if (!isDemoSeedEnabled()) {
    return NextResponse.json({ error: "Demo seeding is disabled for this environment." }, { status: 403 })
  }

  const payload = (await request.json().catch(() => null)) as SeedPayload | null

  const displayName = normalizeOptionalText(payload?.display_name)
  const ownerEmail = normalizeOwnerEmail(payload?.owner_email)
  const ownerPassword = normalizeOptionalText(payload?.owner_password)
  const slug = normalizeSlug(payload?.slug)
  const planCode = normalizePlanCode(payload?.plan_code)
  const createSampleData = normalizeOptionalBoolean(payload?.create_sample_data)

  if (!displayName) {
    return NextResponse.json({ error: "display_name is required." }, { status: 400 })
  }

  if (!ownerEmail) {
    return NextResponse.json({ error: "owner_email must be a valid email address." }, { status: 400 })
  }

  if (ownerPassword && ownerPassword.length < 10) {
    return NextResponse.json({ error: "owner_password must be at least 10 characters." }, { status: 400 })
  }

  const seedInput: SeedDemoWhiteLabelerInput = {
    displayName,
    ownerEmail,
    ownerPassword: ownerPassword ?? undefined,
    slug: slug ?? undefined,
    planCode: planCode ?? undefined,
    createSampleData: createSampleData ?? true,
  }

  try {
    const result = await seedDemoWhiteLabeler(seedInput)

    void logWhiteLabelerAuditEvent({
      whiteLabelerId: result.whiteLabelerId,
      actorUserId: platformAdmin.user.id,
      action: "create",
      entityType: "team_member",
      entityId: result.ownerUserId,
      changes: {
        source: "seed_demo",
        slug: result.slug,
        created_owner_user: result.createdOwnerUser,
        created_white_labeler: result.createdWhiteLabeler,
        inserted_sample_clients: result.insertedSampleClients,
        inserted_sample_charges: result.insertedSampleCharges,
        created_payout_batch: result.createdPayoutBatch,
      },
    })

    return NextResponse.json(
      {
        seed: result,
        message: result.createdWhiteLabeler
          ? "Demo white-labeler was created successfully."
          : "Demo white-labeler already existed and has been refreshed safely.",
      },
      { status: result.createdWhiteLabeler ? 201 : 200 },
    )
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to seed demo white-labeler."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
