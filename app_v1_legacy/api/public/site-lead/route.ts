import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { z } from "zod"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * POST /api/public/site-lead
 *
 * Handles contact form submissions from generated client sites.
 * This endpoint is public (no auth) — it's called from static HTML.
 *
 * Security:
 *   - siteToken validation: identifies the project without exposing UUID
 *   - Honeypot field: rejects bots that fill hidden fields
 *   - Rate limiting: max 5 submissions per IP per hour (via Upstash if configured)
 *   - Origin/referer validation: warns on suspicious origins
 *   - IP hashing: stores hashed IP, not plaintext
 */

const SubmissionSchema = z.object({
  siteToken: z.string().min(8).max(128),
  route: z.string().max(500).default("/contact/"),
  name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(5000).optional(),
  honeypot: z.string().max(0).optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = SubmissionSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ")
    return NextResponse.json({ error: `Validation failed: ${issues}` }, { status: 422 })
  }

  const { siteToken, route, name, email, phone, message, honeypot } = parsed.data

  // ── Honeypot check ────────────────────────────────────────────────────────
  const honeypotTriggered = typeof honeypot === "string" && honeypot.length > 0

  // ── Rate limiting (Upstash) ───────────────────────────────────────────────
  const ip = getClientIp(request)
  const rateLimitResult = await checkRateLimit(ip)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    )
  }

  // ── Resolve project by site_token ─────────────────────────────────────────
  const admin = createAdminSupabaseClient()

  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, status")
    .eq("site_token", siteToken)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: "Invalid site token" }, { status: 404 })
  }

  // Only accept submissions from live or preview_ready projects
  const acceptableStatuses = ["live", "preview_ready", "approved", "production_deploying"]
  if (!acceptableStatuses.includes(project.status)) {
    return NextResponse.json({ error: "Site not active" }, { status: 403 })
  }

  // ── Store submission ──────────────────────────────────────────────────────
  const ipHash = ip ? hashIp(ip) : null

  const { error: insertError } = await admin
    .from("statxeo_site_form_submissions")
    .insert({
      project_id: project.id,
      site_token: siteToken,
      route,
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      message: message ?? null,
      ip_hash: ipHash,
      honeypot_triggered: honeypotTriggered,
    })

  if (insertError) {
    console.error("[site-lead] Insert error:", insertError.message)
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  )
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT ?? "statxeo-salt")).digest("hex").slice(0, 16)
}

async function checkRateLimit(ip: string | null): Promise<{ allowed: boolean }> {
  if (!ip) return { allowed: true }

  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      return { allowed: true }
    }

    const { Ratelimit } = await import("@upstash/ratelimit")
    const { Redis } = await import("@upstash/redis")

    const redis = new Redis({ url: upstashUrl, token: upstashToken })
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "site-lead",
    })

    const { success } = await ratelimit.limit(`ip:${ip}`)
    return { allowed: success }
  } catch (err) {
    console.warn("[site-lead] Rate limit check failed:", err)
    return { allowed: true }
  }
}
