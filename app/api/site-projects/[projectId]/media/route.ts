import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * GET /api/site-projects/[projectId]/media
 *
 * List all media assets for a project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  const { data: assets, error } = await admin
    .from("statxeo_site_media_assets")
    .select("id, asset_type, storage_path, original_filename, mime_type, size_bytes, placement_hint, sort_order, created_at")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ assets: assets ?? [] })
}

/**
 * POST /api/site-projects/[projectId]/media
 *
 * Register a media asset after upload to storage.
 * Called by the client after a successful signed upload.
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

  // Verify project exists and user owns it
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const body = await request.json()
  const { storageBucket, storagePath, assetType, originalFilename, mimeType, sizeBytes, placementHint } = body as {
    storageBucket: string
    storagePath: string
    assetType: "logo" | "photo" | "favicon"
    originalFilename?: string
    mimeType?: string
    sizeBytes?: number
    placementHint?: string
  }

  if (!storageBucket || !storagePath || !assetType) {
    return NextResponse.json({ error: "storageBucket, storagePath, and assetType are required" }, { status: 400 })
  }

  // Get the next sort order
  const { count } = await admin
    .from("statxeo_site_media_assets")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)

  const { data: asset, error } = await admin
    .from("statxeo_site_media_assets")
    .insert({
      project_id: projectId,
      asset_type: assetType,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      placement_hint: placementHint,
      sort_order: (count ?? 0),
    })
    .select("id, asset_type, storage_path, sort_order, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ asset })
}
