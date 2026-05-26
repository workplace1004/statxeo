import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * GET /api/ai/status/[projectId]
 *
 * Returns the latest generation job status and current artifacts for a project.
 * Used by the customer portal to poll progress during generation.
 *
 * Auth: authenticated user session — ownership verified via customer_lead_links.
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

  // Verify ownership: user must have a lead link to the project's lead_id
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const { data: link } = await admin
    .from("statxeo_customer_lead_links")
    .select("id")
    .eq("lead_id", project.lead_id)
    .eq("user_id", user.id)
    .single()

  // Fallback: check email match
  if (!link) {
    const { data: lead } = await admin
      .from("statxeo_leads")
      .select("email")
      .eq("id", project.lead_id)
      .single()

    if (!lead || lead.email !== user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // Latest generation job
  const { data: latestJob } = await admin
    .from("statxeo_site_generation_jobs")
    .select(
      "id, job_type, status, stage, error_message, started_at, completed_at, duration_ms, token_usage_input, token_usage_output, model_used, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Current artifacts (is_current = true)
  const { data: artifacts } = await admin
    .from("statxeo_site_generation_artifacts")
    .select("artifact_type, schema_version, created_at")
    .eq("project_id", projectId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })

  return NextResponse.json({
    projectId,
    projectStatus: project.status,
    latestJob: latestJob ?? null,
    artifacts: artifacts ?? [],
  })
}
