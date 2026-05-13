import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
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

    const { data: posts, error } = await supabase
      .from("statxeo_white_labeler_social_posts")
      .select("id, content, platforms, status, scheduled_at, published_at, error_message, created_at, media_urls")
      .eq("white_labeler_id", membership.white_labeler_id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts ?? [] })
  } catch (error) {
    console.error("List posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
