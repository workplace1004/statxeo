import { NextRequest, NextResponse } from "next/server"

import { evaluateBrandChecklist } from "@/lib/statxeo/white-labeler-brand-checklist"
import { syncWhiteLabelerBrandingCompletedFlag } from "@/lib/statxeo/white-labeler-launch-gates"
import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
  logWhiteLabelerAuditEvent,
} from "@/lib/statxeo/white-labeler-server"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOptionalColor(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed.toLowerCase()
  if (/^[a-z]+$/i.test(trimmed)) return trimmed.toLowerCase()
  return null
}

function normalizeOptionalHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "https:") return null
    return trimmed
  } catch {
    return null
  }
}

function normalizeOptionalEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}

function normalizeDomain(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(trimmed)) return trimmed
  return null
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BrandingRow = {
  brand_name: string | null
  primary_color: string | null
  secondary_color: string | null
  logo_url: string | null
  support_email: string | null
  support_phone: string | null
}

export async function GET() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  const adminClient = createAdminSupabaseClient()
  const [{ data: brandingData, error: brandingError }, { data: domainsData, error: domainsError }] = await Promise.all([
    adminClient
      .from("statxeo_white_labeler_branding_settings")
      .select("brand_name, primary_color, secondary_color, logo_url, support_email, support_phone")
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .maybeSingle(),
    adminClient
      .from("statxeo_white_labeler_domains")
      .select("id, domain, verification_status, is_primary")
      .eq("white_labeler_id", authContext.whiteLabelerId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
  ])

  if (brandingError || domainsError) {
    return NextResponse.json({ error: "Unable to load white-label branding right now." }, { status: 500 })
  }

  const branding = brandingData as BrandingRow | null
  const brandChecklist = evaluateBrandChecklist(branding)

  return NextResponse.json({
    brand_name: branding?.brand_name ?? null,
    primary_color: branding?.primary_color ?? null,
    secondary_color: branding?.secondary_color ?? null,
    logo_url: branding?.logo_url ?? null,
    support_email: branding?.support_email ?? null,
    support_phone: branding?.support_phone ?? null,
    domains: Array.isArray(domainsData) ? domainsData : [],
    brand_checklist: brandChecklist.items,
    brand_score_percent: brandChecklist.scorePercent,
    meets_checkout_brand_minimum: brandChecklist.meetsMinimumForCheckout,
  })
}

export async function PATCH(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "branding.patch",
    limit: 20,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 })
  }

  const upsertPayload: Record<string, unknown> = {
    white_labeler_id: authContext.whiteLabelerId,
  }

  if ("brand_name" in body) upsertPayload.brand_name = normalizeOptionalText(body.brand_name)
  if ("primary_color" in body) upsertPayload.primary_color = normalizeOptionalColor(body.primary_color)
  if ("secondary_color" in body) upsertPayload.secondary_color = normalizeOptionalColor(body.secondary_color)
  if ("logo_url" in body) upsertPayload.logo_url = normalizeOptionalHttpsUrl(body.logo_url)
  if ("support_email" in body) upsertPayload.support_email = normalizeOptionalEmail(body.support_email)
  if ("support_phone" in body) upsertPayload.support_phone = normalizeOptionalText(body.support_phone)

  if (Object.keys(upsertPayload).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_branding_settings")
    .upsert(upsertPayload, { onConflict: "white_labeler_id" })
    .select("brand_name, primary_color, secondary_color, logo_url, support_email, support_phone")
    .single()

  if (error) {
    return NextResponse.json({ error: "Unable to save branding settings." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "update",
    entityType: "branding",
    entityId: authContext.whiteLabelerId,
    changes: upsertPayload,
  })

  await syncWhiteLabelerBrandingCompletedFlag(adminClient, authContext.whiteLabelerId)

  const brandChecklist = evaluateBrandChecklist((data ?? null) as BrandingRow | null)

  return NextResponse.json({
    branding: data,
    brand_checklist: brandChecklist.items,
    brand_score_percent: brandChecklist.scorePercent,
    meets_checkout_brand_minimum: brandChecklist.meetsMinimumForCheckout,
  })
}

export async function POST(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "branding.domain.create",
    limit: 20,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 })
  }

  const domain = normalizeDomain(body.domain)
  if (!domain) {
    return NextResponse.json(
      { error: "A valid domain is required (e.g. example.com). Scheme and path are not allowed." },
      { status: 400 },
    )
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_domains")
    .insert({
      white_labeler_id: authContext.whiteLabelerId,
      domain,
      verification_status: "pending",
      is_primary: false,
    })
    .select("id, domain, verification_status, is_primary")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That domain is already registered." }, { status: 409 })
    }
    return NextResponse.json({ error: "Unable to add domain." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "create",
    entityType: "domain",
    entityId: (data as { id: string }).id,
    changes: { domain },
  })

  return NextResponse.json({ domain: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const rateLimitResponse = await enforceWhiteLabelerWriteRateLimit({
    request,
    whiteLabelerId: authContext.whiteLabelerId,
    userId: authContext.user.id,
    scope: "branding.domain.delete",
    limit: 20,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 })
  }

  const domainId =
    typeof body.domain_id === "string" && body.domain_id.trim() ? body.domain_id.trim() : null
  if (!domainId) {
    return NextResponse.json({ error: "domain_id is required." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  const { data: existing, error: fetchError } = await adminClient
    .from("statxeo_white_labeler_domains")
    .select("id, domain")
    .eq("id", domainId)
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: "Unable to verify domain ownership." }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 })
  }

  const { error: deleteError } = await adminClient
    .from("statxeo_white_labeler_domains")
    .delete()
    .eq("id", domainId)

  if (deleteError) {
    return NextResponse.json({ error: "Unable to remove domain." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "delete",
    entityType: "domain",
    entityId: domainId,
    changes: { domain: (existing as { domain: string }).domain },
  })

  return NextResponse.json({ ok: true })
}
