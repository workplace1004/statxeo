import {writeArtifact, type JobContext} from "../orchestrator";
import {
  getLatestIntake,
  getPipelineProject,
  listMediaForPipeline,
} from "@/server/site-projects/statxai-store";

export async function loadProjectData(ctx: JobContext): Promise<void> {
  const project = await getPipelineProject(ctx.projectId);
  if (!project) {
    throw new Error(`Project not found: ${ctx.projectId}`);
  }

  const latestIntake = await getLatestIntake(ctx.projectId);
  const mediaAssets = await listMediaForPipeline(ctx.projectId);

  await writeArtifact(ctx.jobId, ctx.projectId, "prompt", {
    project,
    latestIntake: latestIntake ?? null,
    mediaAssets,
    loadedAt: new Date().toISOString(),
  });
}
