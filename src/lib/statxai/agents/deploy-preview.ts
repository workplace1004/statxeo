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

export async function deployPreview(ctx: JobContext): Promise<void> {
  const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest");
  const siteToken = await getOrCreateSiteToken(ctx.projectId);
  const renderResult = selectRenderer(manifest, siteToken);

  const files: VercelDeploymentFile[] = Object.entries(renderResult.files).map(
    ([filePath, content]) => ({file: filePath, content}),
  );

  let previewUrl: string | null = null;
  let vercelDeploymentId: string | null = null;

  try {
    const projectName = vercelProjectName(ctx.projectId);
    const deployment = await deployToVercel(projectName, files, "preview");
    previewUrl = `https://${deployment.url}`;
    vercelDeploymentId = deployment.id;
  } catch (err) {
    if (err instanceof VercelNotConfiguredError) {
      console.warn("[deploy-preview] VERCEL_TOKEN not set — skipping live deployment");
    } else {
      throw err;
    }
  }

  await updateProjectFields(ctx.projectId, {
    preview_url: previewUrl,
    vercel_deployment_id: vercelDeploymentId,
  });

  await writeArtifact(ctx.jobId, ctx.projectId, "preview_deployment", {
    previewUrl,
    vercelDeploymentId,
    projectName: vercelProjectName(ctx.projectId),
    deployedAt: new Date().toISOString(),
    renderedFiles: renderResult.files,
    previewPages: renderResult.previewPages,
    sitemapRoutes: renderResult.sitemapRoutes,
    pageCount: renderResult.previewPages.length,
    renderedHtml: renderResult.files["index.html"] ?? "",
  });
}

async function getOrCreateSiteToken(projectId: string): Promise<string> {
  const project = await getPipelineProject(projectId);
  if (project?.site_token && typeof project.site_token === "string") {
    return project.site_token;
  }

  const token = generateSiteToken();
  await updateProjectFields(projectId, {site_token: token});
  return token;
}

function generateSiteToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
