import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { runGenerationJob } from "@/lib/statxai/orchestrator"

/**
 * POST /api/site-projects/[projectId]/trigger
 *
 * Trigger AI generation for a site project.
 * Creates a generation job and kicks off the orchestrator.
 *
 * Allowed when project status is:
 *   - ready_for_generation (initial generation)
 *   - changes_requested (revision generation)
 *   - failed (retry)
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

  // Fetch project
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Determine job type from current status
  const statusToJobType: Record<string, string> = {
    ready_for_generation: "initial",
    assets_pending: "initial",
    changes_requested: "revision",
    failed: "regenerate",
  }

  const jobType = statusToJobType[project.status]
  if (!jobType) {
    return NextResponse.json(
      { error: `Cannot trigger generation when project is in '${project.status}' status` },
      { status: 409 },
    )
  }

  // Check for existing running jobs
  const { data: activeJobs } = await admin
    .from("statxeo_site_generation_jobs")
    .select("id")
    .eq("project_id", projectId)
    .in("status", ["queued", "running"])
    .limit(1)

  if (activeJobs && activeJobs.length > 0) {
    return NextResponse.json(
      { error: "A generation job is already in progress" },
      { status: 409 },
    )
  }

  // Create the generation job
  const idempotencyKey = `${projectId}_${jobType}_${Date.now()}`

  const { data: job, error: jobError } = await admin
    .from("statxeo_site_generation_jobs")
    .insert({
      project_id: projectId,
      job_type: jobType,
      status: "queued",
      stage: "queued",
      trigger_type: "manual",
      idempotency_key: idempotencyKey,
    })
    .select("id, job_type, status, stage, created_at")
    .single()

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 })
  }

  // Update project status to 'generating'
  await admin
    .from("statxeo_site_projects")
    .update({ status: "generating" })
    .eq("id", projectId)

  // Run the generation pipeline. We fire-and-forget so the HTTP response
  // returns immediately while generation continues in the background.
  // Job/project status is tracked in the DB via the orchestrator.
  runGenerationJob({ jobId: job.id, projectId, jobType }).catch(() => {
    // Errors are already written to the job row by failJob() — nothing to do here.
  })

  return NextResponse.json({ job })
}
