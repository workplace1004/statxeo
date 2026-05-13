import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Max 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
const BUCKET = "social-media"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("white_labeler_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse the multipart form
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not supported` }, { status: 400 })
    }

    // Build a unique storage path: agency_id/userId/timestamp_filename
    const ext = file.name.split(".").pop() ?? "jpg"
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${membership.white_labeler_id}/${user.id}/${timestamp}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Use admin client to upload (bypasses RLS on storage)
    const adminSupabase = createAdminSupabaseClient()

    // Ensure bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === BUCKET)
    if (!bucketExists) {
      await adminSupabase.storage.createBucket(BUCKET, { public: true })
    }

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = adminSupabase.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: storagePath,
      type: file.type,
      size: file.size,
      name: file.name,
    })
  } catch (error) {
    console.error("Media upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove an uploaded file
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { path } = await request.json()
    if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 })

    // Security: ensure the path belongs to this user's agency
    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("white_labeler_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!membership || !path.startsWith(membership.white_labeler_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminSupabase = createAdminSupabaseClient()
    await adminSupabase.storage.from(BUCKET).remove([path])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
