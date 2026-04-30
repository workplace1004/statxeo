import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { CreateChangeRequestSchema } from "@/lib/statxai/schemas/change-request"

/**
 * GET /api/site-projects/[projectId]/change-requests
 *
 * List change requests for a project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  const { data: requests, error } = await admin
    .from("statxeo_site_change_requests")
    .select("id, scope_type, page_key, section_key, description, status, created_at, resolved_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ changeRequests: requests ?? [] })
}

/**
 * POST /api/site-projects/[projectId]/change-requests
 *
 * Create a change request for a project.
 * Only allowed when project is in 'preview_ready' or 'changes_requested' status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // Verify project exists and is in a reviewable state
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const reviewableStatuses = ["preview_ready", "changes_requested"]
  if (!reviewableStatuses.includes(project.status)) {
    return NextResponse.json(
      { error: `Cannot request changes when project is in '${project.status}' status` },
      { status: 409 },
    )
  }

  const body = await request.json()
  const parsed = CreateChangeRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid change request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { data: changeRequest, error } = await admin
    .from("statxeo_site_change_requests")
    .insert({
      project_id: projectId,
      requested_by_user_id: user.id,
      source: "customer",
      scope_type: parsed.data.scopeType,
      page_key: parsed.data.pageKey,
      section_key: parsed.data.sectionKey,
      description: parsed.data.description,
      status: "pending",
    })
    .select("id, scope_type, description, status, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transition project to 'changes_requested' if it was in 'preview_ready'
  if (project.status === "preview_ready") {
    await admin
      .from("statxeo_site_projects")
      .update({ status: "changes_requested" })
      .eq("id", projectId)
  }

  return NextResponse.json({ changeRequest })
}
