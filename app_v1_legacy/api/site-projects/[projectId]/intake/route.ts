import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { WebsitePreferencesSchema } from "@/lib/statxai/schemas/intake"

/**
 * POST /api/site-projects/[projectId]/intake
 *
 * Save website preferences as a versioned intake submission.
 * Updates summary fields on the site project and transitions status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // Fetch project
  const { data: project } = await admin
    .from("statxeo_site_projects")
    .select("id, lead_id, status")
    .eq("id", projectId)
    .single()

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Ownership check
  const { data: link } = await admin
    .from("statxeo_customer_lead_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("lead_id", project.lead_id)
    .limit(1)
    .maybeSingle()

  if (!link) {
    // Fallback: email match
    const { data: lead } = await admin
      .from("statxeo_leads")
      .select("id")
      .eq("id", project.lead_id)
      .ilike("contact_email", user.email ?? "")
      .maybeSingle()

    if (!lead) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
  }

  // Parse and validate preferences
  const body = await request.json()
  const parsed = WebsitePreferencesSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preferences", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const prefs = parsed.data

  // Get the latest version number
  const { data: latestSubmission } = await admin
    .from("statxeo_site_intake_submissions")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latestSubmission?.version ?? 0) + 1

  // Insert versioned intake submission
  const { error: submissionError } = await admin
    .from("statxeo_site_intake_submissions")
    .insert({
      project_id: projectId,
      version: nextVersion,
      source: "customer_portal",
      raw_payload: body,
      normalized_payload: prefs,
      submitted_by_user_id: user.id,
    })

  if (submissionError) {
    return NextResponse.json({ error: submissionError.message }, { status: 500 })
  }

  // Update project summary fields from preferences
  const projectUpdates: Record<string, unknown> = {}

  if (prefs.brandTone) projectUpdates.brand_tone = prefs.brandTone
  if (prefs.primaryColor) projectUpdates.primary_color = prefs.primaryColor
  if (prefs.secondaryColor) projectUpdates.secondary_color = prefs.secondaryColor
  if (prefs.targetAudience) projectUpdates.target_audience = prefs.targetAudience
  if (prefs.uniqueSellingPoints) projectUpdates.unique_selling_points = prefs.uniqueSellingPoints
  if (prefs.offeredServices) projectUpdates.offered_services = prefs.offeredServices
  if (prefs.serviceAreas) projectUpdates.service_areas = prefs.serviceAreas
  if (prefs.ctaPreference) projectUpdates.cta_preference = prefs.ctaPreference
  if (prefs.businessHours) projectUpdates.business_hours = prefs.businessHours
  if (prefs.socialLinks) projectUpdates.social_links = prefs.socialLinks
  if (prefs.domainPreference) projectUpdates.domain_name = prefs.domainPreference

  // Transition status if currently awaiting preferences
  if (project.status === "awaiting_preferences") {
    projectUpdates.status = "assets_pending"
  }

  if (Object.keys(projectUpdates).length > 0) {
    await admin
      .from("statxeo_site_projects")
      .update(projectUpdates)
      .eq("id", projectId)
  }

  return NextResponse.json({
    ok: true,
    version: nextVersion,
    status: projectUpdates.status ?? project.status,
  })
}
