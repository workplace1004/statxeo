import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { getAuthenticatedPlatformAdmin } from "@/lib/statxeo/platform-admin-server"
import { logWhiteLabelerAuditEvent } from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type InvitePayload = {
  application_id?: unknown
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(request: NextRequest) {
  const platformAdmin = await getAuthenticatedPlatformAdmin()
  if (platformAdmin instanceof NextResponse) {
    return platformAdmin
  }

  const payload = (await request.json().catch(() => null)) as InvitePayload | null
  const applicationId = normalizeOptionalText(payload?.application_id)

  if (!applicationId) {
    return NextResponse.json({ error: "application_id is required." }, { status: 400 })
  }

  const adminClient = createAdminSupabaseClient()
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_applications")
    .select("id, status, contact_email, company_name, approved_white_labeler_id")
    .eq("id", applicationId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Unable to load partner application." }, { status: 500 })
  }

  const application = data as {
    id: string | null
    status: string | null
    contact_email: string | null
    company_name: string | null
    approved_white_labeler_id: string | null
  } | null

  if (!application?.id) {
    return NextResponse.json({ error: "Partner application not found." }, { status: 404 })
  }

  const inviteStatus = (application.status ?? "").trim().toLowerCase()
  if (inviteStatus !== "approved" && inviteStatus !== "invited") {
    return NextResponse.json(
      { error: "Invite email can only be sent after the application is approved." },
      { status: 409 },
    )
  }

  const email = normalizeOptionalText(application.contact_email)?.toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Partner contact email is missing for this application." }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        error: "Invite email is not configured for this deployment. Add missing Supabase environment variables and redeploy.",
      },
      { status: 503 },
    )
  }

  const publicSupabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const redirectTo = `${request.nextUrl.origin}/white-labeler/reset-password`
  const { error: resetError } = await publicSupabaseClient.auth.resetPasswordForEmail(email, { redirectTo })

  if (resetError) {
    return NextResponse.json({ error: "Unable to send invite email right now." }, { status: 500 })
  }

  const { error: statusError } = await adminClient
    .from("statxeo_white_labeler_applications")
    .update({
      status: "invited",
    })
    .eq("id", applicationId)
    .in("status", ["approved", "invited"])

  if (statusError) {
    return NextResponse.json({ error: "Invite email was sent but the application status could not be updated." }, { status: 500 })
  }

  if (application.approved_white_labeler_id) {
    void logWhiteLabelerAuditEvent({
      whiteLabelerId: application.approved_white_labeler_id,
      actorUserId: platformAdmin.user.id,
      action: "update",
      entityType: "team_member",
      changes: {
        source: "admin_send_invite",
        application_id: application.id,
        email,
      },
    })
  }

  return NextResponse.json({
    message: `Password setup email sent to ${email}.`,
  })
}
