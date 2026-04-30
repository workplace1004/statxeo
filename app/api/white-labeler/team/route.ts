import { NextRequest, NextResponse } from "next/server"

import {
  forbiddenWhiteLabelerResponse,
  getAuthenticatedWhiteLabeler,
  isWhiteLabelerAdminRole,
  logWhiteLabelerAuditEvent,
  normalizeRole,
} from "@/lib/statxeo/white-labeler-server"
import { enforceWhiteLabelerWriteRateLimit } from "@/lib/statxeo/white-labeler-rate-limit"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authContext = await getAuthenticatedWhiteLabeler()
  if (authContext instanceof NextResponse) {
    return authContext
  }

  if (!isWhiteLabelerAdminRole(authContext.role)) {
    return forbiddenWhiteLabelerResponse()
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_members")
    .select("user_id, role, is_active, created_at")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Unable to load white-label team right now." }, { status: 500 })
  }

  return NextResponse.json({ members: Array.isArray(data) ? data : [] })
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
    scope: "team.create",
    limit: 12,
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

  const userId =
    typeof body.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : null
  if (!userId) {
    return NextResponse.json({ error: "user_id is required." }, { status: 400 })
  }

  const role = normalizeRole(typeof body.role === "string" ? body.role : "member")

  if (role === "owner" && authContext.role !== "owner") {
    return NextResponse.json({ error: "Only owners can add another owner." }, { status: 403 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_members")
    .insert({
      white_labeler_id: authContext.whiteLabelerId,
      user_id: userId,
      role,
      is_active: true,
    })
    .select("user_id, role, is_active, created_at")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That user is already a team member." }, { status: 409 })
    }
    return NextResponse.json({ error: "Unable to add team member." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "create",
    entityType: "team_member",
    entityId: userId,
    changes: { user_id: userId, role },
  })

  return NextResponse.json({ member: data }, { status: 201 })
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
    scope: "team.patch",
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

  const userId =
    typeof body.user_id === "string" && body.user_id.trim() ? body.user_id.trim() : null
  if (!userId) {
    return NextResponse.json({ error: "user_id is required." }, { status: 400 })
  }

  if (userId === authContext.user.id) {
    return NextResponse.json({ error: "You cannot modify your own membership." }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if ("role" in body && typeof body.role === "string") {
    const role = normalizeRole(body.role)
    if (role === "owner" && authContext.role !== "owner") {
      return NextResponse.json({ error: "Only owners can promote a member to owner role." }, { status: 403 })
    }
    updates.role = role
  }

  if ("is_active" in body && typeof body.is_active === "boolean") {
    updates.is_active = body.is_active
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update (role, is_active)." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()

  const { data: existing, error: fetchError } = await adminClient
    .from("statxeo_white_labeler_members")
    .select("user_id, role")
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: "Unable to verify membership." }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 })
  }

  const { data, error } = await adminClient
    .from("statxeo_white_labeler_members")
    .update(updates)
    .eq("white_labeler_id", authContext.whiteLabelerId)
    .eq("user_id", userId)
    .select("user_id, role, is_active, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: "Unable to update team member." }, { status: 500 })
  }

  void logWhiteLabelerAuditEvent({
    whiteLabelerId: authContext.whiteLabelerId,
    actorUserId: authContext.user.id,
    action: "update",
    entityType: "team_member",
    entityId: userId,
    changes: updates,
  })

  return NextResponse.json({ member: data })
}
