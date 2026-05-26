import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedPlatformAdmin } from "@/lib/statxeo/platform-admin-server"
import { approveWhiteLabelerApplication } from "@/lib/statxeo/white-labeler-application-admin"
import { logWhiteLabelerAuditEvent } from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseLimit(rawLimit: string | null) {
  const parsed = Number(rawLimit)
  if (!Number.isFinite(parsed)) return 50
  return Math.max(1, Math.min(200, Math.floor(parsed)))
}

function normalizeStatus(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (
    normalized === "pending_review" ||
    normalized === "approved" ||
    normalized === "invited" ||
    normalized === "rejected"
  ) {
    return normalized
  }

  return null
}

type ReviewPayload = {
  application_id?: unknown
  decision?: unknown
  review_notes?: unknown
  display_name?: unknown
  slug?: unknown
  owner_password?: unknown
  plan_code?: unknown
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(request: NextRequest) {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  const status = normalizeStatus(request.nextUrl.searchParams.get("status"))
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
  const adminClient = createAdminSupabaseClient()

  let query = adminClient
    .from("statxeo_white_labeler_applications")
    .select(
      "id, status, contact_full_name, contact_email, company_name, company_website, desired_slug, referred_by, notes, review_notes, reviewed_by_user_id, reviewed_at, approved_white_labeler_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: "Unable to load partner applications right now." }, { status: 500 })
  }

  return NextResponse.json({ applications: Array.isArray(data) ? data : [] })
}

export async function PATCH(request: NextRequest) {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  const payload = (await request.json().catch(() => null)) as ReviewPayload | null
  const applicationId = normalizeOptionalText(payload?.application_id)
  const decision = normalizeOptionalText(payload?.decision)?.toLowerCase()
  const reviewNotes = normalizeOptionalText(payload?.review_notes)
  const displayName = normalizeOptionalText(payload?.display_name)
  const slug = normalizeOptionalText(payload?.slug)
  const ownerPassword = normalizeOptionalText(payload?.owner_password)
  const planCode = normalizeOptionalText(payload?.plan_code)

  if (!applicationId) {
    return NextResponse.json({ error: "application_id is required." }, { status: 400 })
  }

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "decision must be approve or reject." }, { status: 400 })
  }

  if (ownerPassword && ownerPassword.length < 10) {
    return NextResponse.json({ error: "owner_password must be at least 10 characters." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  if (decision === "reject") {
    const { data: existingData, error: existingError } = await adminClient
      .from("statxeo_white_labeler_applications")
      .select("id, status")
      .eq("id", applicationId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: "Unable to load partner application." }, { status: 500 })
    }

    const existing = existingData as { id: string | null; status: string | null } | null
    if (!existing?.id) {
      return NextResponse.json({ error: "Partner application not found." }, { status: 404 })
    }

    const existingStatus = (existing.status ?? "").trim().toLowerCase()
    if (existingStatus === "approved" || existingStatus === "invited") {
      return NextResponse.json(
        { error: "Approved or invited applications cannot be rejected from this endpoint." },
        { status: 409 },
      )
    }

    if (existingStatus === "rejected") {
      return NextResponse.json({ error: "Application is already rejected." }, { status: 409 })
    }

    const { error } = await adminClient
      .from("statxeo_white_labeler_applications")
      .update({
        status: "rejected",
        review_notes: reviewNotes ?? null,
        reviewed_by_user_id: platformAdmin.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (error) {
      return NextResponse.json({ error: "Unable to reject partner application." }, { status: 500 })
    }

    return NextResponse.json({
      application: {
        id: applicationId,
        status: "rejected",
      },
      message: "Partner application rejected.",
    })
  }

  try {
    const result = await approveWhiteLabelerApplication({
      applicationId,
      reviewerUserId: platformAdmin.user.id,
      displayName: displayName ?? undefined,
      slug: slug ?? undefined,
      ownerPassword: ownerPassword ?? undefined,
      planCode: planCode ?? undefined,
      reviewNotes,
    })

    void logWhiteLabelerAuditEvent({
      whiteLabelerId: result.whiteLabelerId,
      actorUserId: platformAdmin.user.id,
      action: "create",
      entityType: "team_member",
      entityId: result.ownerUserId,
      changes: {
        source: "partner_application_approval",
        application_id: result.applicationId,
        created_owner_user: result.createdOwnerUser,
        created_white_labeler: result.createdWhiteLabeler,
        owner_email: result.ownerEmail,
        slug: result.slug,
      },
    })

    return NextResponse.json({
      application: {
        id: result.applicationId,
        status: "approved",
      },
      approval: result,
      message: result.createdWhiteLabeler
        ? "Partner application approved and workspace provisioned."
        : "Partner application approved using the existing workspace.",
    })
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Unable to approve partner application."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}