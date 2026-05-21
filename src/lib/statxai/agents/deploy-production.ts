import {readArtifact, writeArtifact, type JobContext} from "../orchestrator";
import {selectRenderer} from "../renderer";
import type {RenderManifest} from "../renderer";
import {
  deployToVercel,
  vercelProjectName,
  VercelNotConfiguredError,
  type VercelDeploymentFile,
} from "../vercel-client";
import {getPipelineProject, updateProjectFields} from "@/server/site-projects/statxai-store";

export async function deployProduction(ctx: JobContext): Promise<void> {
  const project = await getPipelineProject(ctx.projectId);
  const siteToken =
    typeof project?.site_token === "string" ? project.site_token : "";

  let files: VercelDeploymentFile[];

  try {
    const previewArtifact = await readArtifact<{
      renderedFiles?: Record<string, string>;
      renderedHtml?: string;
    }>(ctx.projectId, "preview_deployment");

    if (previewArtifact.renderedFiles && Object.keys(previewArtifact.renderedFiles).length > 0) {
      files = Object.entries(previewArtifact.renderedFiles).map(([filePath, content]) => ({
        file: filePath,
        content,
      }));
    } else if (previewArtifact.renderedHtml) {
      files = [{file: "index.html", content: previewArtifact.renderedHtml}];
    } else {
      throw new Error("No rendered content in preview artifact");
    }
  } catch {
    const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest");
    const renderResult = selectRenderer(manifest, siteToken);
    files = Object.entries(renderResult.files).map(([filePath, content]) => ({
      file: filePath,
      content,
    }));
  }

  let productionUrl: string | null = null;

  try {
    const projectName = vercelProjectName(ctx.projectId);
    const deployment = await deployToVercel(projectName, files, "production");
    productionUrl = `https://${deployment.url}`;
  } catch (err) {
    if (err instanceof VercelNotConfiguredError) {
      console.warn("[deploy-production] VERCEL_TOKEN not set — skipping live deployment");
    } else {
      throw err;
    }
  }

  await updateProjectFields(ctx.projectId, {
    production_url: productionUrl,
    status: "live",
  });

  await writeArtifact(ctx.jobId, ctx.projectId, "production_deployment", {
    productionUrl,
    deployedAt: new Date().toISOString(),
  });
}
