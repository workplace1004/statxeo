import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const BUCKET = "statxeo-site-assets"

/**
 * POST /api/site-projects/[projectId]/media/sign-upload
 *
 * Returns a signed upload URL for Supabase Storage.
 * Client uploads directly to storage, then registers the asset via /media POST.
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

  // Verify project ownership
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const { data: link } = await admin
    .from("statxeo_customer_lead_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("lead_id", project.lead_id)
    .limit(1)
    .maybeSingle()

  if (!link) {
    const { data: lead } = await admin
      .from("statxeo_leads")
      .select("id")
      .eq("id", project.lead_id)
      .ilike("contact_email", user.email ?? "")
      .maybeSingle()

    if (!lead) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
  }

  const body = await request.json()
  const { filename, mimeType, assetType, sizeBytes } = body as {
    filename: string
    mimeType: string
    assetType: "logo" | "photo" | "favicon"
    sizeBytes: number
  }

  if (!filename || !mimeType || !assetType) {
    return NextResponse.json({ error: "filename, mimeType, and assetType are required" }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 })
  }

  if (sizeBytes && sizeBytes > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
  }

  // Build storage path: {assetType}s/{projectId}/{timestamp}_{filename}
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  const storagePath = `${assetType}s/${projectId}/${Date.now()}_${sanitizedFilename}`

  // Create signed upload URL (valid for 5 minutes)
  const { data: signedUrl, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)

  if (signError || !signedUrl) {
    return NextResponse.json(
      { error: signError?.message ?? "Failed to create upload URL" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    signedUrl: signedUrl.signedUrl,
    token: signedUrl.token,
    storagePath,
    bucket: BUCKET,
  })
}
