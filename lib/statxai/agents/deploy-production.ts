import { readArtifact, writeArtifact, type JobContext } from "../orchestrator"
import { selectRenderer } from "../renderer"
import type { RenderManifest } from "../renderer"
import {
  deployToVercel,
  vercelProjectName,
  VercelNotConfiguredError,
  type VercelDeploymentFile,
} from "../vercel-client"
import { getStatxaiSupabase } from "../supabase"

/**
 * Stage: deploying_production
 *
 * Promotes the preview build to production on Vercel.
 *
 * 3-tier fallback for rendered files:
 *   1. Use renderedFiles from preview_deployment artifact (preferred — multi-file)
 *   2. Re-render from render_manifest artifact (if preview artifact missing)
 *   3. Wrap old renderedHtml as single-file (backward compat for legacy lander jobs)
 *
 * Called by a separate deploy_production job triggered via /api/ai/approve.
 */
export async function deployProduction(ctx: JobContext): Promise<void> {
  const supabase = getStatxaiSupabase()

  // Get site_token for contact form auth
  const { data: project } = await supabase
    .from("statxeo_site_projects")
    .select("site_token")
    .eq("id", ctx.projectId)
    .single()
  const siteToken = project?.site_token ?? ""

  let files: VercelDeploymentFile[]

  try {
    // Tier 1: Use pre-rendered files from preview artifact
    const previewArtifact = await readArtifact<{
      renderedFiles?: Record<string, string>
      renderedHtml?: string
    }>(ctx.projectId, "preview_deployment")

    if (previewArtifact.renderedFiles && Object.keys(previewArtifact.renderedFiles).length > 0) {
      files = Object.entries(previewArtifact.renderedFiles).map(([filePath, content]) => ({
        file: filePath,
        content,
      }))
    } else if (previewArtifact.renderedHtml) {
      // Tier 3: Legacy single-file fallback
      files = [{ file: "index.html", content: previewArtifact.renderedHtml }]
    } else {
      throw new Error("No rendered content in preview artifact")
    }
  } catch {
    // Tier 2: Re-render from manifest
    const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest")
    const renderResult = selectRenderer(manifest, siteToken)
    files = Object.entries(renderResult.files).map(([filePath, content]) => ({
      file: filePath,
      content,
    }))
  }

  let productionUrl: string | null = null

  try {
    const projectName = vercelProjectName(ctx.projectId)
    const deployment = await deployToVercel(projectName, files, "production")
    productionUrl = `https://${deployment.url}`
  } catch (err) {
    if (err instanceof VercelNotConfiguredError) {
      console.warn("[deploy-production] VERCEL_TOKEN not set — skipping live deployment")
    } else {
      throw err
    }
  }

  await supabase
    .from("statxeo_site_projects")
    .update({
      production_url: productionUrl,
      status: "live",
    })
    .eq("id", ctx.projectId)

  await writeArtifact(ctx.jobId, ctx.projectId, "production_deployment", {
    productionUrl,
    deployedAt: new Date().toISOString(),
  })
}
