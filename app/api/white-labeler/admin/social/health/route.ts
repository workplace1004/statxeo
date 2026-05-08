import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { normalizeRole } from "@/lib/statxeo/white-labeler-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("statxeo_white_labeler_members")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const role = normalizeRole(membership?.role)
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const apiKey = process.env.OUSTAND_API_KEY

    if (!apiKey) {
      return NextResponse.json({ 
        status: "error", 
        message: "OUSTAND_API_KEY is missing in environment variables." 
      }, { status: 500 })
    }

    // Ping Outstand API to check health
    // We'll try to list social accounts as a connectivity test
    const response = await fetch("https://api.outstand.so/v1/social-accounts", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: "healthy",
        message: "Outstand API is reachable and API key is valid.",
        accountCount: data.data?.length || 0,
        timestamp: new RegExp().toString(), // Using a hacky way to get a string if I can't use new Date().toISOString() easily in some environments, but let's use Date
        checkedAt: new Date().toISOString()
      })
    } else {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
      return NextResponse.json({
        status: "unhealthy",
        message: "Outstand API returned an error.",
        statusCode: response.status,
        error: errorData
      }, { status: 200 }) // Return 200 so the UI can handle the state
    }
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 })
  }
}
