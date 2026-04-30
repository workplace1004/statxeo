import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

type WhiteLabelerMembershipRow = {
  white_labeler_id: string | null
  role: string | null
  is_active: boolean | null
}

const WHITE_LABELER_REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export type AuthenticatedWhiteLabelerContext = {
  user: User
  supabase: ServerSupabaseClient
  whiteLabelerId: string
  role: "owner" | "admin" | "member"
}

export function unauthorizedWhiteLabelerResponse() {
  return NextResponse.json({ error: "You must be signed in to access white-labeler data." }, { status: 401 })
}

export function forbiddenWhiteLabelerResponse() {
  return NextResponse.json({ error: "You do not have permission to access white-labeler data." }, { status: 403 })
}

export function getMissingWhiteLabelerSupabaseEnvVars() {
  return WHITE_LABELER_REQUIRED_SUPABASE_ENV_VARS.filter((key) => !process.env[key])
}

export function hasWhiteLabelerSupabaseEnv() {
  return getMissingWhiteLabelerSupabaseEnvVars().length === 0
}

export function whiteLabelerEnvUnavailableResponse() {
  const missing = getMissingWhiteLabelerSupabaseEnvVars()

  return NextResponse.json(
    {
      error:
        "White-labeler portal is not configured for this deployment. Add the missing Supabase environment variables and redeploy.",
      missing,
    },
    { status: 503 },
  )
}

export function normalizeRole(value: string | null | undefined): "owner" | "admin" | "member" {
  const role = (value ?? "").trim().toLowerCase()
  if (role === "owner" || role === "admin") return role
  return "member"
}

type AuditAction = "create" | "update" | "delete" | "transition"
type AuditEntityType = "plan_override" | "branding" | "domain" | "team_member" | "payout_batch" | "stripe_connect"

export async function logWhiteLabelerAuditEvent(params: {
  whiteLabelerId: string
  actorUserId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  changes?: Record<string, unknown>
}) {
  try {
    const adminClient = createAdminSupabaseClient()
    await adminClient.from("statxeo_white_labeler_audit_log").insert({
      white_labeler_id: params.whiteLabelerId,
      actor_user_id: params.actorUserId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      changes: params.changes ?? {},
    })
  } catch {
    // Audit log failures must never break main operations
  }
}

export function isWhiteLabelerAdminRole(role: string | null | undefined) {
  const normalized = normalizeRole(role)
  return normalized === "owner" || normalized === "admin"
}

export async function getAuthenticatedWhiteLabeler(): Promise<AuthenticatedWhiteLabelerContext | NextResponse> {
  if (!hasWhiteLabelerSupabaseEnv()) {
    return whiteLabelerEnvUnavailableResponse()
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return unauthorizedWhiteLabelerResponse()
  }

  const adminClient = createAdminSupabaseClient()
  const { data: membershipData, error: membershipError } = await adminClient
    .from("statxeo_white_labeler_members")
    .select("white_labeler_id, role, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)

  if (membershipError || !Array.isArray(membershipData) || membershipData.length === 0) {
    return forbiddenWhiteLabelerResponse()
  }

  const membership = membershipData[0] as WhiteLabelerMembershipRow
  if (!membership.white_labeler_id) {
    return forbiddenWhiteLabelerResponse()
  }

  return {
    user,
    supabase,
    whiteLabelerId: membership.white_labeler_id,
    role: normalizeRole(membership.role),
  }
}
