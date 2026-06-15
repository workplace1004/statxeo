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
 * Stage: deploying_preview
 *
 * 1. Reads the render_manifest artifact
 * 2. Reads the project's site_token (or generates one if missing)
 * 3. Renders all template files via selectRenderer()
 * 4. Deploys all files to Vercel as a preview deployment
 * 5. Stores preview_url + vercel_deployment_id on the project row
 * 6. Writes a preview_deployment artifact with renderedFiles, previewPages, sitemapRoutes
 *
 * If VERCEL_TOKEN is not configured, stores the rendered files as a
 * local artifact only (preview_url stays null). This lets the pipeline
 * complete in dev/test without Vercel credentials.
 */
export async function deployPreview(ctx: JobContext): Promise<void> {
  const manifest = await readArtifact<RenderManifest>(ctx.projectId, "render_manifest")

  // Get or generate site_token for contact form auth
  const siteToken = await getOrCreateSiteToken(ctx.projectId)

  // Render all files
  const renderResult = selectRenderer(manifest, siteToken)

  const files: VercelDeploymentFile[] = Object.entries(renderResult.files).map(
    ([filePath, content]) => ({ file: filePath, content }),
  )

  let previewUrl: string | null = null
  let vercelDeploymentId: string | null = null

  try {
    const projectName = vercelProjectName(ctx.projectId)
    const deployment = await deployToVercel(projectName, files, "preview")
    previewUrl = `https://${deployment.url}`
    vercelDeploymentId = deployment.id
  } catch (err) {
    if (err instanceof VercelNotConfiguredError) {
      console.warn("[deploy-preview] VERCEL_TOKEN not set — skipping live deployment")
    } else {
      throw err
    }
  }

  const supabase = getStatxaiSupabase()
  await supabase
    .from("statxeo_site_projects")
    .update({
      preview_url: previewUrl,
      vercel_deployment_id: vercelDeploymentId,
    })
    .eq("id", ctx.projectId)

  await writeArtifact(ctx.jobId, ctx.projectId, "preview_deployment", {
    previewUrl,
    vercelDeploymentId,
    projectName: vercelProjectName(ctx.projectId),
    deployedAt: new Date().toISOString(),
    // Multi-file support
    renderedFiles: renderResult.files,
    previewPages: renderResult.previewPages,
    sitemapRoutes: renderResult.sitemapRoutes,
    pageCount: renderResult.previewPages.length,
    // Backward compat: keep renderedHtml for legacy production deploy fallback
    renderedHtml: renderResult.files["index.html"] ?? "",
  })
}

async function getOrCreateSiteToken(projectId: string): Promise<string> {
  const supabase = getStatxaiSupabase()

  const { data: project } = await supabase
    .from("statxeo_site_projects")
    .select("site_token")
    .eq("id", projectId)
    .single()

  if (project?.site_token) {
    return project.site_token
  }

  // Generate a new opaque token
  const token = generateSiteToken()
  await supabase
    .from("statxeo_site_projects")
    .update({ site_token: token })
    .eq("id", projectId)

  return token
}

function generateSiteToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
