import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET: List all connected social accounts for the current agency
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

    // Fetch from our DB first (fast, no Outstand call needed)
    const { data: localAccounts, error } = await supabase
      .from("statxeo_white_labeler_social_accounts")
      .select("*")
      .eq("white_labeler_id", membership.white_labeler_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ accounts: localAccounts ?? [] })
  } catch (error) {
    console.error("List social accounts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Disconnect a social account
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { accountId } = await request.json()
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 })
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

    const apiKey = process.env.OUSTAND_API_KEY

    // Get the outstand_account_id first
    const { data: account } = await supabase
      .from("statxeo_white_labeler_social_accounts")
      .select("outstand_account_id")
      .eq("id", accountId)
      .eq("white_labeler_id", membership.white_labeler_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Disconnect from Outstand
    await fetch(`https://api.outstand.so/v1/social-accounts/${account.outstand_account_id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${apiKey}` }
    })

    // Mark as inactive in our DB
    await supabase
      .from("statxeo_white_labeler_social_accounts")
      .update({ is_active: false })
      .eq("id", accountId)
      .eq("white_labeler_id", membership.white_labeler_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Disconnect social account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
