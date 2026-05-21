import type {GenerationStage} from "./schemas/project";

import {loadProjectData} from "./agents/load-project";
import {normalizeIntake} from "./agents/normalize-intake";
import {resolveTemplate} from "./agents/resolve-template";
import {assemblePrompt} from "./agents/assemble-prompt";
import {generateContent} from "./agents/generate-content";
import {validateOutput} from "./agents/validate-output";
import {mapSlots} from "./agents/map-slots";
import {generateSeo} from "./agents/generate-seo";
import {buildManifest} from "./agents/build-manifest";
import {deployPreview} from "./agents/deploy-preview";
import {deployProduction} from "./agents/deploy-production";
import {
  getJobOrgId,
  getJobProjectId,
  insertArtifact,
  markArtifactsNotCurrent,
  readArtifactPayload,
  resolvePendingChangeRequestsForProject,
  updateJob,
  updateProjectFields,
} from "@/server/site-projects/statxai-store";

export type JobContext = {
  jobId: string;
  projectId: string;
  jobType: string;
};

export async function runGenerationJob(ctx: JobContext): Promise<void> {
  const startedAt = new Date().toISOString();

  await updateJob(ctx.jobId, {status: "running", started_at: startedAt});

  const pipeline: Array<{stage: GenerationStage; fn: (ctx: JobContext) => Promise<void>}> = [
    {stage: "loading_project", fn: loadProjectData},
    {stage: "normalizing_intake", fn: normalizeIntake},
    {stage: "resolving_template", fn: resolveTemplate},
    {stage: "assembling_prompt", fn: assemblePrompt},
    {stage: "llm_calling", fn: generateContent},
    {stage: "validating_output", fn: validateOutput},
    {stage: "mapping_slots", fn: mapSlots},
    {stage: "generating_seo", fn: generateSeo},
    {stage: "building_manifest", fn: buildManifest},
    {stage: "deploying_preview", fn: deployPreview},
  ];

  const productionPipeline: Array<{stage: GenerationStage; fn: (ctx: JobContext) => Promise<void>}> =
    [{stage: "deploying_production", fn: deployProduction}];

  const activePipeline = ctx.jobType === "deploy_production" ? productionPipeline : pipeline;
  const t0 = Date.now();

  for (const step of activePipeline) {
    await setStage(ctx.jobId, step.stage);
    try {
      await step.fn(ctx);
    } catch (err) {
      await failJob(ctx.jobId, step.stage, err, Date.now() - t0);
      throw err;
    }
  }

  const durationMs = Date.now() - t0;
  const completedAt = new Date().toISOString();

  await updateJob(ctx.jobId, {
    status: "completed",
    stage: "complete",
    completed_at: completedAt,
    duration_ms: durationMs,
  });

  if (ctx.jobType !== "deploy_production") {
    await updateProjectFields(ctx.projectId, {status: "preview_ready"});
    await resolvePendingChangeRequestsForProject(ctx.projectId, ctx.jobId);
  }
}

async function setStage(jobId: string, stage: GenerationStage) {
  await updateJob(jobId, {stage});
}

async function failJob(
  jobId: string,
  _stage: GenerationStage,
  err: unknown,
  durationMs: number,
) {
  const message = err instanceof Error ? err.message : String(err);

  await updateJob(jobId, {
    status: "failed",
    stage: "failed",
    error_message: message,
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  });

  const projectId = await getJobProjectId(jobId);
  if (projectId) {
    await updateProjectFields(projectId, {status: "failed"});
  }
}

export async function writeArtifact(
  jobId: string,
  projectId: string,
  artifactType: string,
  payload: unknown,
  schemaVersion = "1.0",
) {
  const orgId = await getJobOrgId(jobId);
  await markArtifactsNotCurrent(projectId, artifactType);
  await insertArtifact({jobId, projectId, orgId, artifactType, payload, schemaVersion});
}

export async function readArtifact<T = unknown>(
  projectId: string,
  artifactType: string,
): Promise<T> {
  return readArtifactPayload<T>(projectId, artifactType);
}

export async function updateTokenUsage(
  jobId: string,
  inputTokens: number,
  outputTokens: number,
  modelUsed: string,
) {
  await updateJob(jobId, {
    token_usage_input: inputTokens,
    token_usage_output: outputTokens,
    model_used: modelUsed,
  });
}
