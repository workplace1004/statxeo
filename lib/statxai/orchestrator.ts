import { getStatxaiSupabase } from "./supabase"
import type { GenerationStage } from "./schemas/project"

/**
 * Job orchestrator — runs the generation pipeline as a sequential state
 * machine. Each stage updates generation_jobs.stage before executing, so
 * the job is always observable and retryable from the last failed stage.
 *
 * Stages map exactly to the CHECK constraint in the migration:
 *   queued → loading_project → normalizing_intake → resolving_template
 *   → assembling_prompt → llm_calling → validating_output → mapping_slots
 *   → generating_seo → building_manifest → complete
 *   (or → failed at any point)
 */

import { loadProjectData } from "./agents/load-project"
import { normalizeIntake } from "./agents/normalize-intake"
import { resolveTemplate } from "./agents/resolve-template"
import { assemblePrompt } from "./agents/assemble-prompt"
import { generateContent } from "./agents/generate-content"
import { validateOutput } from "./agents/validate-output"
import { mapSlots } from "./agents/map-slots"
import { generateSeo } from "./agents/generate-seo"
import { buildManifest } from "./agents/build-manifest"
import { deployPreview } from "./agents/deploy-preview"
import { deployProduction } from "./agents/deploy-production"

export type JobContext = {
  jobId: string
  projectId: string
  jobType: string
}

export async function runGenerationJob(ctx: JobContext): Promise<void> {
  const supabase = getStatxaiSupabase()

  const startedAt = new Date().toISOString()

  await supabase
    .from("statxeo_site_generation_jobs")
    .update({ status: "running", started_at: startedAt })
    .eq("id", ctx.jobId)

  const pipeline: Array<{ stage: GenerationStage; fn: (ctx: JobContext) => Promise<void> }> = [
    { stage: "loading_project",    fn: loadProjectData },
    { stage: "normalizing_intake", fn: normalizeIntake },
    { stage: "resolving_template", fn: resolveTemplate },
    { stage: "assembling_prompt",  fn: assemblePrompt },
    { stage: "llm_calling",        fn: generateContent },
    { stage: "validating_output",  fn: validateOutput },
    { stage: "mapping_slots",      fn: mapSlots },
    { stage: "generating_seo",     fn: generateSeo },
    { stage: "building_manifest",    fn: buildManifest },
    { stage: "deploying_preview",    fn: deployPreview },
  ]

  // Production-only pipeline: triggered separately via approve endpoint
  const productionPipeline: Array<{ stage: GenerationStage; fn: (ctx: JobContext) => Promise<void> }> = [
    { stage: "deploying_production", fn: deployProduction },
  ]

  const activePipeline = ctx.jobType === "deploy_production" ? productionPipeline : pipeline

  const t0 = Date.now()

  for (const step of activePipeline) {
    await setStage(ctx.jobId, step.stage)
    try {
      await step.fn(ctx)
    } catch (err) {
      await failJob(ctx.jobId, step.stage, err, Date.now() - t0)
      // Propagate so the API route knows it failed
      throw err
    }
  }

  // All stages complete
  const durationMs = Date.now() - t0
  const completedAt = new Date().toISOString()

  await supabase
    .from("statxeo_site_generation_jobs")
    .update({
      status: "completed",
      stage: "complete",
      completed_at: completedAt,
      duration_ms: durationMs,
    })
    .eq("id", ctx.jobId)

  // Preview pipelines end in preview_ready. Production deploy sets status to `live`
  // inside deployProduction — do not overwrite that here.
  if (ctx.jobType !== "deploy_production") {
    await supabase
      .from("statxeo_site_projects")
      .update({ status: "preview_ready" })
      .eq("id", ctx.projectId)

    // After any successful preview pipeline (initial / revision / regenerate), close the
    // customer's open change-request queue. Revision jobs are the common path; initial
    // also runs here and resolving zero rows is harmless.
    await resolvePendingChangeRequests(ctx.projectId, ctx.jobId)
  }
}

async function setStage(jobId: string, stage: GenerationStage) {
  const supabase = getStatxaiSupabase()
  await supabase
    .from("statxeo_site_generation_jobs")
    .update({ stage })
    .eq("id", jobId)
}

async function failJob(jobId: string, _stage: GenerationStage, err: unknown, durationMs: number) {
  const supabase = getStatxaiSupabase()
  const message = err instanceof Error ? err.message : String(err)

  await supabase
    .from("statxeo_site_generation_jobs")
    .update({
      status: "failed",
      stage: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
    })
    .eq("id", jobId)

  // Transition project to failed
  await supabase
    .from("statxeo_site_generation_jobs")
    .select("project_id")
    .eq("id", jobId)
    .single()
    .then(({ data }) => {
      if (data?.project_id) {
        return supabase
          .from("statxeo_site_projects")
          .update({ status: "failed" })
          .eq("id", data.project_id)
      }
    })
}

/**
 * Helper used by agents to write an artifact to the DB.
 * Sets is_current=false on all previous artifacts of the same type
 * before inserting the new one.
 */
export async function writeArtifact(
  jobId: string,
  projectId: string,
  artifactType: string,
  payload: unknown,
  schemaVersion = "1.0",
) {
  const supabase = getStatxaiSupabase()

  // Mark previous artifacts of this type as not current
  await supabase
    .from("statxeo_site_generation_artifacts")
    .update({ is_current: false })
    .eq("project_id", projectId)
    .eq("artifact_type", artifactType)
    .eq("is_current", true)

  await supabase.from("statxeo_site_generation_artifacts").insert({
    job_id: jobId,
    project_id: projectId,
    artifact_type: artifactType,
    schema_version: schemaVersion,
    payload,
    is_current: true,
  })
}

/**
 * Helper used by agents to read the latest artifact of a given type.
 */
export async function readArtifact<T = unknown>(
  projectId: string,
  artifactType: string,
): Promise<T> {
  const supabase = getStatxaiSupabase()

  const { data, error } = await supabase
    .from("statxeo_site_generation_artifacts")
    .select("payload")
    .eq("project_id", projectId)
    .eq("artifact_type", artifactType)
    .eq("is_current", true)
    .single()

  if (error || !data) {
    throw new Error(`Artifact '${artifactType}' not found for project ${projectId}`)
  }

  return data.payload as T
}

/**
 * Update token usage on a job (called from generate-content agent).
 */
export async function updateTokenUsage(
  jobId: string,
  inputTokens: number,
  outputTokens: number,
  modelUsed: string,
) {
  const supabase = getStatxaiSupabase()
  await supabase
    .from("statxeo_site_generation_jobs")
    .update({
      token_usage_input: inputTokens,
      token_usage_output: outputTokens,
      model_used: modelUsed,
    })
    .eq("id", jobId)
}

async function resolvePendingChangeRequests(projectId: string, fulfilledByJobId: string) {
  const supabase = getStatxaiSupabase()
  const resolvedAt = new Date().toISOString()
  const base = supabase
    .from("statxeo_site_change_requests")
    .update({
      status: "resolved",
      resolved_at: resolvedAt,
      generation_job_id: fulfilledByJobId,
    })
    .eq("project_id", projectId)
    .in("status", ["pending", "in_progress"])

  const { error } = await base

  if (error) {
    console.error("[statxai] resolvePendingChangeRequests failed:", error.message)
    const { error: err2 } = await supabase
      .from("statxeo_site_change_requests")
      .update({ status: "resolved", resolved_at: resolvedAt })
      .eq("project_id", projectId)
      .in("status", ["pending", "in_progress"])
    if (err2) {
      console.error("[statxai] resolvePendingChangeRequests fallback failed:", err2.message)
    }
  }
}
