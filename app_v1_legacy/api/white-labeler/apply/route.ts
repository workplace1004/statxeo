import { NextRequest, NextResponse } from "next/server"

import { enforcePublicRateLimit } from "@/lib/statxeo/public-rate-limit"
import { WhiteLabelerApplicationPayloadSchema } from "@/lib/statxeo/white-labeler-onboarding-schemas"
import { createAdminSupabaseClient, getMissingAdminSupabaseEnvVars } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeOptionalSlug(value: string | undefined) {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized.length > 0 ? normalized : null
}

function normalizeOptionalWebsite(value: string | undefined) {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return null

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    return url.toString()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const missingAdminSupabaseEnvVars = getMissingAdminSupabaseEnvVars()
  if (missingAdminSupabaseEnvVars.length > 0) {
    return NextResponse.json(
      {
        error:
          "White-label applications are not configured for this deployment. Add missing Supabase environment variables and redeploy.",
        missing: missingAdminSupabaseEnvVars,
      },
      { status: 503 },
    )
  }

  const rateLimitResponse = await enforcePublicRateLimit({
    request,
    scope: "white-labeler.apply",
    limit: 5,
    windowMs: 3_600_000,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const body = await request.json().catch(() => null)
  const parsed = WhiteLabelerApplicationPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_applications")
    .insert({
      contact_full_name: parsed.data.contactFullName,
      contact_email: parsed.data.contactEmail.toLowerCase(),
      company_name: parsed.data.companyName,
      company_website: normalizeOptionalWebsite(parsed.data.companyWebsite),
      desired_slug: normalizeOptionalSlug(parsed.data.desiredSlug),
      referred_by: parsed.data.referredBy?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      status: "pending_review",
    })
    .select("id, status, created_at, company_name")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An application from this email is already pending review." },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: "Unable to submit partner application right now." }, { status: 500 })
  }

  return NextResponse.json({ application: data }, { status: 201 })
}