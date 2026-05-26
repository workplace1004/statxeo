import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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

    const body = await request.json()
    const { content = "", mediaUrls = [], accountIds = [], scheduledAt } = body

    // Validation: Need at least content OR media
    if (!content?.trim() && mediaUrls.length === 0) {
      return NextResponse.json({ error: "Post must have either text content or media" }, { status: 400 })
    }
    if (!accountIds.length) {
      return NextResponse.json({ error: "Select at least one social account" }, { status: 400 })
    }

    // Get the outstand_account_ids for the selected local account IDs
    const { data: accounts } = await supabase
      .from("statxeo_white_labeler_social_accounts")
      .select("id, outstand_account_id, provider")
      .eq("white_labeler_id", membership.white_labeler_id)
      .in("id", accountIds)
      .eq("is_active", true)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No valid connected accounts found" }, { status: 400 })
    }

    const outstandAccountIds = accounts.map((a) => a.outstand_account_id)
    const apiKey = process.env.OUSTAND_API_KEY

    // Build the Outstand post payload
    // Note: Outstand uses 'containers' to group content and media
    const outstandPayload: Record<string, unknown> = {
      socialAccountIds: outstandAccountIds,
      containers: [
        {
          content: content.trim(),
          mediaUrls: mediaUrls, // Array of public URLs from our Supabase Storage
        }
      ],
    }

    if (scheduledAt) {
      outstandPayload.scheduledAt = scheduledAt
    }

    // Send to Outstand
    const outstandRes = await fetch("https://api.outstand.so/v1/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(outstandPayload),
    })

    const outstandData = await outstandRes.json()

    if (!outstandRes.ok) {
      console.error("Outstand API Error:", outstandData)
      // Save as failed in DB for audit trail
      await supabase.from("statxeo_white_labeler_social_posts").insert({
        white_labeler_id: membership.white_labeler_id,
        content: content.trim(),
        media_urls: mediaUrls,
        platforms: accounts.map((a) => a.provider), // Store providers for UI display
        status: "failed",
        error_message: outstandData?.message || "Outstand API error",
        created_by_user_id: user.id,
      })
      return NextResponse.json({ error: outstandData?.message || "Failed to publish post" }, { status: 500 })
    }

    const outstandPost = outstandData.data

    // Save as pending/scheduled/published in DB
    const status = scheduledAt ? "scheduled" : "pending"
    const { data: savedPost, error: dbError } = await supabase
      .from("statxeo_white_labeler_social_posts")
      .insert({
        white_labeler_id: membership.white_labeler_id,
        outstand_post_id: outstandPost?.id,
        content: content.trim(),
        media_urls: mediaUrls,
        platforms: accounts.map((a) => a.provider), // Store providers like 'facebook', 'instagram'
        status,
        scheduled_at: scheduledAt || null,
        created_by_user_id: user.id,
        metadata: outstandPost ?? {},
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database save error:", dbError)
    }

    return NextResponse.json({ success: true, post: savedPost })
  } catch (error) {
    console.error("Publish post exception:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
