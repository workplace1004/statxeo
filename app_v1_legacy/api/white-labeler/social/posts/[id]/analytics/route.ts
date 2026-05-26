import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get the post and verify ownership
    const { data: post, error: postError } = await supabase
      .from("statxeo_white_labeler_social_posts")
      .select("id, outstand_post_id, white_labeler_id")
      .eq("id", id)
      .single()

    if (postError || !post || !post.outstand_post_id) {
      return NextResponse.json({ error: "Post not found or not published through Outstand" }, { status: 404 })
    }

    // 2. Verify the user belongs to this white labeler
    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("white_labeler_id", post.white_labeler_id)
      .eq("is_active", true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Fetch analytics from Outstand
    const apiKey = process.env.OUSTAND_API_KEY
    const outstandRes = await fetch(`https://api.outstand.so/v1/posts/${post.outstand_post_id}/analytics`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    })

    if (!outstandRes.ok) {
      const errorData = await outstandRes.json()
      return NextResponse.json({ error: errorData.message || "Failed to fetch analytics from Outstand" }, { status: outstandRes.status })
    }

    const analyticsData = await outstandRes.json()
    const stats = analyticsData.data || {}

    // 4. Cache the results in our DB for faster subsequent loads
    await supabase
      .from("statxeo_white_labeler_social_posts")
      .update({
        metadata: {
          ...(typeof post.metadata === 'object' ? post.metadata : {}),
          last_analytics: stats,
          analytics_updated_at: new Date().toISOString()
        }
      })
      .eq("id", id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Fetch analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
