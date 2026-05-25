import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { runGenerationJob } from "@/lib/statxai/orchestrator"

/**
 * POST /api/ai/approve
 *
 * Customer approves their preview and triggers production deployment.
 *
 * Body: { projectId: string }
 *
 * Allowed when project status is: preview_ready
 *
 * Flow:
 *   1. Validate auth + ownership
 *   2. Verify status === 'preview_ready'
 *   3. Transition project → 'production_deploying'
 *   4. Create a deploy_production job
 *   5. Fire-and-forget production deploy
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: { projectId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { projectId } = body
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // Fetch project
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Verify ownership
  const { data: link } = await admin
    .from("statxeo_customer_lead_links")
    .select("id")
    .eq("lead_id", project.lead_id)
    .eq("user_id", user.id)
    .single()

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

  if (project.status !== "preview_ready") {
    return NextResponse.json(
      { error: `Cannot approve when project is in '${project.status}' status` },
      { status: 409 },
    )
  }

  // Transition project to production_deploying
  await admin
    .from("statxeo_site_projects")
    .update({ status: "production_deploying" })
    .eq("id", projectId)

  // Create deploy_production job
  const idempotencyKey = `${projectId}_deploy_production_${Date.now()}`

  const { data: job, error: jobError } = await admin
    .from("statxeo_site_generation_jobs")
    .insert({
      project_id: projectId,
      job_type: "deploy_production",
      status: "queued",
      stage: "queued",
      trigger_type: "manual",
      idempotency_key: idempotencyKey,
    })
    .select("id, job_type, status, stage, created_at")
    .single()

  if (jobError || !job) {
    // Roll back status
    await admin
      .from("statxeo_site_projects")
      .update({ status: "preview_ready" })
      .eq("id", projectId)
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job" }, { status: 500 })
  }

  // Fire-and-forget production deploy
  runGenerationJob({ jobId: job.id, projectId, jobType: "deploy_production" }).catch(() => {
    // Errors written to job row by failJob() — revert project to preview_ready so user can retry
    admin
      .from("statxeo_site_projects")
      .update({ status: "preview_ready" })
      .eq("id", projectId)
      .then(() => {})
  })

  return NextResponse.json({ job })
}
