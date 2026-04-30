import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { reconcileResolvedChangeRequests } from "@/lib/statxeo/reconcile-change-requests"

/**
 * GET /api/site-projects/[projectId]
 *
 * Fetch a single site project with latest generation job and change requests.
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

  const { data: project, error } = await admin
    .from("statxeo_site_projects")
    .select(`
      *,
      statxeo_site_generation_jobs (
        id, job_type, status, stage, error_message, started_at, completed_at, created_at
      ),
      statxeo_site_change_requests (
        id, scope_type, page_key, section_key, description, status, created_at, resolved_at
      ),
      statxeo_site_media_assets (
        id, asset_type, storage_path, original_filename, mime_type, placement_hint, sort_order
      )
    `)
    .eq("id", projectId)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Ownership check: verify project belongs to this user
  const isOwner = await verifyProjectOwnership(admin, project.lead_id, user.id, user.email ?? "")
  if (!isOwner) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  // Nested `statxeo_site_generation_jobs` comes back in insertion order (oldest first).
  // UI expects newest first — same ordering as GET /api/ai/status/[projectId].
  const jobs = (project as { statxeo_site_generation_jobs?: { created_at: string }[] }).statxeo_site_generation_jobs
  if (Array.isArray(jobs) && jobs.length > 1) {
    jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  await reconcileResolvedChangeRequests(admin, projectId)

  const { data: changeRows } = await admin
    .from("statxeo_site_change_requests")
    .select("id, scope_type, page_key, section_key, description, status, created_at, resolved_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (changeRows) {
    ;(project as { statxeo_site_change_requests: typeof changeRows }).statxeo_site_change_requests = changeRows
  }

  // Enrich with preview_pages and page_count from the latest preview_deployment artifact
  let previewPages: string[] | null = null
  let pageCount: number | null = null
  let sitemapRoutes: string[] | null = null

  const { data: previewArtifact } = await admin
    .from("statxeo_site_generation_artifacts")
    .select("payload")
    .eq("project_id", projectId)
    .eq("artifact_type", "preview_deployment")
    .eq("is_current", true)
    .maybeSingle()

  if (previewArtifact?.payload) {
    const payload = previewArtifact.payload as Record<string, unknown>
    previewPages = Array.isArray(payload.previewPages) ? (payload.previewPages as string[]) : null
    pageCount = typeof payload.pageCount === "number" ? payload.pageCount : null
    sitemapRoutes = Array.isArray(payload.sitemapRoutes) ? (payload.sitemapRoutes as string[]) : null
  }

  return NextResponse.json({ project, previewPages, pageCount, sitemapRoutes })
}

/**
 * PATCH /api/site-projects/[projectId]
 *
 * Update website preferences on a site project.
 * Only allowed when status is 'awaiting_preferences' or 'assets_pending'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // Fetch project and verify ownership
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const isOwner = await verifyProjectOwnership(admin, project.lead_id, user.id, user.email ?? "")
  if (!isOwner) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const editableStatuses = ["awaiting_preferences", "assets_pending", "changes_requested", "failed"]
  if (!editableStatuses.includes(project.status)) {
    return NextResponse.json(
      { error: `Cannot edit project in '${project.status}' status` },
      { status: 409 },
    )
  }

  const body = await request.json()

  // Only allow updating preference fields, not system fields
  const allowedFields = [
    "brand_tone",
    "primary_color",
    "secondary_color",
    "target_audience",
    "unique_selling_points",
    "offered_services",
    "service_areas",
    "cta_preference",
    "business_hours",
    "social_links",
    "domain_name",
  ] as const

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const { data: updated, error } = await admin
    .from("statxeo_site_projects")
    .update(updates)
    .eq("id", projectId)
    .select("id, status, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project: updated })
}

async function verifyProjectOwnership(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  leadId: string,
  userId: string,
  email: string,
): Promise<boolean> {
  // Check explicit link
  const { data: link } = await admin
    .from("statxeo_customer_lead_links")
    .select("id")
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle()

  if (link) return true

  // Check email match
  if (email) {
    const { data: lead } = await admin
      .from("statxeo_leads")
      .select("id")
      .eq("id", leadId)
      .ilike("contact_email", email)
      .maybeSingle()

    if (lead) return true
  }

  return false
}
