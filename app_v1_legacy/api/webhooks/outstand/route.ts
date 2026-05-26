import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createHmac } from "crypto"

export const dynamic = "force-dynamic"

// Verify the webhook actually came from Outstand using HMAC-SHA256
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.OUTSTAND_WEBHOOK_SECRET
  if (!secret) {
    console.warn("⚠️  OUTSTAND_WEBHOOK_SECRET not set — skipping verification in dev mode")
    return true
  }
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`
  return expected === signature
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-outstand-signature") ?? ""

    if (!verifySignature(rawBody, signature)) {
      console.error("❌ Invalid Outstand webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const { event, data } = JSON.parse(rawBody)

    if (!event || !data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // ── post.published ───────────────────────────────────────────────────────
    if (event === "post.published" && data.id) {
      await supabase
        .from("statxeo_white_labeler_social_posts")
        .update({ 
          status: "published", 
          published_at: new Date().toISOString(), 
          error_message: null 
        })
        .eq("outstand_post_id", data.id)
    }

    // ── post.error (or post.failed) ──────────────────────────────────────────
    if ((event === "post.error" || event === "post.failed") && data.id) {
      const reason = data.error ?? data.reason ?? data.message ?? "Unknown platform error"
      await supabase
        .from("statxeo_white_labeler_social_posts")
        .update({ status: "failed", error_message: reason })
        .eq("outstand_post_id", data.id)
    }

    // ── post.scheduled ───────────────────────────────────────────────────────
    if (event === "post.scheduled" && data.id) {
      await supabase
        .from("statxeo_white_labeler_social_posts")
        .update({ status: "scheduled" })
        .eq("outstand_post_id", data.id)
    }

    // ── account.disconnected / token.expired ────────────────────────────────
    if ((event === "account.disconnected" || event === "token.expired") && data.id) {
      await supabase
        .from("statxeo_white_labeler_social_accounts")
        .update({ is_active: false })
        .eq("outstand_account_id", data.id)
      
      // Future: Trigger an email notification to the Agency Owner here
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Outstand webhook error:", error)
    // Always return 200 so Outstand doesn't keep retrying
    return NextResponse.json({ received: true, warning: "Processing error" })
  }
}
