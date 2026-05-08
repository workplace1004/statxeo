import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")
  
  // You can also pass a 'state' parameter to know which agency this belongs to
  // For now, we'll assume the current logged-in user's agency
  
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
  }

  try {
    const apiKey = process.env.OUSTAND_API_KEY
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return redirectWithError("Unauthorized")
    }

    // 1. Get Pending Connection Details from Outstand
    const detailsRes = await fetch(`https://api.outstand.so/v1/social-accounts/pending?sessionId=${sessionId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    })

    if (!detailsRes.ok) {
      return redirectWithError("Failed to get pending connection details")
    }

    const { data: pendingData } = await detailsRes.json()

    // 2. Finalize the Connection
    const finalizeRes = await fetch("https://api.outstand.so/v1/social-accounts/finalize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    })

    if (!finalizeRes.ok) {
      return redirectWithError("Failed to finalize social connection")
    }

    const { data: finalizedAccount } = await finalizeRes.json()

    // 3. Save to our Supabase Database
    // First, find the user's white-labeler_id (for admin, it might be a master ID)
    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("white_labeler_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (membership) {
      await supabase.from("statxeo_white_labeler_social_accounts").upsert({
        white_labeler_id: membership.white_labeler_id,
        outstand_account_id: finalizedAccount.id,
        provider: finalizedAccount.provider,
        display_name: finalizedAccount.name || `${finalizedAccount.provider} Account`,
        is_active: true,
        metadata: finalizedAccount
      }, { onConflict: "white_labeler_id, outstand_account_id" })
    }

    // 4. Redirect back to the dashboard with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/white-labeler/social?status=success`)

  } catch (error) {
    console.error("Social callback error:", error)
    return redirectWithError("Internal server error")
  }
}

function redirectWithError(message: string) {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/white-labeler/social?status=error&message=${encodeURIComponent(message)}`)
}
