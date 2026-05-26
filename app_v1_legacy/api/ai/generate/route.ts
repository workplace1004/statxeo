import { NextRequest, NextResponse } from "next/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { runGenerationJob } from "@/lib/statxai/orchestrator"

/**
 * POST /api/ai/generate
 *
 * Internal endpoint that runs the generation pipeline for a queued job.
 * Called by the trigger route after creating the job row.
 *
 * Auth: x-statxai-api-key header or service role Bearer token.
 * Runs the pipeline synchronously — caller should treat this as fire-and-observe
 * (the trigger route calls this without awaiting the full response in production,
 * but for simplicity in this implementation it runs inline).
 *
 * Body: { jobId: string, projectId: string, jobType: string }
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-statxai-api-key")
  const bearerToken = request.headers.get("authorization")?.replace("Bearer ", "")

  const validKey = process.env.STATXAI_API_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isAuthorized =
    (validKey && apiKey === validKey) || (serviceRoleKey && bearerToken === serviceRoleKey)

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { jobId: string; projectId: string; jobType: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { jobId, projectId, jobType } = body
  if (!jobId || !projectId || !jobType) {
    return NextResponse.json({ error: "jobId, projectId, and jobType are required" }, { status: 400 })
  }

  // Verify job exists and is in queued/running state
  const admin = createAdminSupabaseClient()
  const { data: job } = await admin
    .from("statxeo_site_generation_jobs")
    .select("id, status, project_id")
    .eq("id", jobId)
    .single()

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  if (!["queued", "running"].includes(job.status)) {
    return NextResponse.json(
      { error: `Job is in '${job.status}' status — cannot re-run` },
      { status: 409 },
    )
  }

  try {
    await runGenerationJob({ jobId, projectId, jobType })
    return NextResponse.json({ success: true, jobId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Job failure is already recorded by the orchestrator — return 200 so
    // the caller knows the request was processed (failure is in the job row).
    return NextResponse.json({ success: false, jobId, error: message }, { status: 200 })
  }
}
