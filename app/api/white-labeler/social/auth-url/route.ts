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

    // Verify user belongs to a white-labeler
    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("white_labeler_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: Not a member of any white-label agency" }, { status: 403 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    const apiKey = process.env.OUSTAND_API_KEY

    // Call Outstand to get the auth URL
    const response = await fetch("https://api.outstand.so/v1/social-accounts/auth-url", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        provider,
        // We can pass a redirectUrl here if Outstand supports it in the body
        // redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/white-labeler/social?status=success`
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Outstand API error" }))
      return NextResponse.json({ error: error.message || "Failed to generate auth URL" }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({ 
      authUrl: data.authUrl,
      // We return the Outstand response which usually contains a url
    })

  } catch (error) {
    console.error("Social auth-url error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
