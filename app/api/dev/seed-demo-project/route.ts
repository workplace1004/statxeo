import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * POST /api/dev/seed-demo-project
 *
 * Development-only endpoint.
 * Creates a demo lead + site project linked to the authenticated user,
 * so the /customer/website page has data to display.
 *
 * Safe to call multiple times — skips creation if a project already exists.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // ── 1. Check if user already has a project ───────────────────────────────

  const { data: existingLinks } = await admin
    .from("statxeo_customer_lead_links")
    .select("lead_id")
    .eq("user_id", user.id)

  if (existingLinks && existingLinks.length > 0) {
    const leadIds = existingLinks.map((l) => l.lead_id)
    const { data: existingProjects } = await admin
      .from("statxeo_site_projects")
      .select("id, status, business_name")
      .in("lead_id", leadIds)
      .limit(1)

    if (existingProjects && existingProjects.length > 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Project already exists",
        project: existingProjects[0],
      })
    }
  }

  // ── 2. Create a demo lead ────────────────────────────────────────────────

  const email = user.email ?? "demo@example.com"
  const displayName = email.split("@")[0] ?? "Demo User"

  const { data: lead, error: leadError } = await admin
    .from("statxeo_leads")
    .insert({
      contact_email: email,
      contact_name: displayName,
      contact_phone: "(555) 000-0000",
      business_name: "Demo Business",
      package_tier: "statxeo_lander",
      status: "paid",
      intake_json: {
        businessName: "Demo Business",
        businessIndustry: "Local Services",
        businessAddress: "123 Main St, Dallas, TX 75201",
        businessProductsServices: "Professional services for local customers",
        phone: "(555) 000-0000",
        email,
      },
    })
    .select("id")
    .single()

  if (leadError || !lead) {
    // If lead already exists for this email, look it up
    const { data: existingLead } = await admin
      .from("statxeo_leads")
      .select("id")
      .ilike("contact_email", email)
      .limit(1)
      .maybeSingle()

    if (!existingLead) {
      return NextResponse.json(
        { error: `Failed to create lead: ${leadError?.message}` },
        { status: 500 },
      )
    }

    // Use existing lead
    const leadId = existingLead.id

    // Link user to lead
    await admin.from("statxeo_customer_lead_links").upsert(
      { user_id: user.id, lead_id: leadId, linked_by: "dev_seed" },
      { onConflict: "user_id,lead_id" },
    )

    // Create project on existing lead
    return createProject(admin, leadId, user.id)
  }

  // ── 3. Link user → lead ──────────────────────────────────────────────────

  await admin.from("statxeo_customer_lead_links").upsert(
    { user_id: user.id, lead_id: lead.id, linked_by: "dev_seed" },
    { onConflict: "user_id,lead_id" },
  )

  // ── 4. Create the site project ───────────────────────────────────────────

  return createProject(admin, lead.id, user.id)
}

async function createProject(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  leadId: string,
  userId: string,
) {
  const { data: project, error: projectError } = await admin
    .from("statxeo_site_projects")
    .insert({
      lead_id: leadId,
      package_tier: "statxeo_lander",
      business_name: "Demo Business",
      business_industry: "Local Services",
      business_address: "123 Main St, Dallas, TX 75201",
      business_products_services: "Professional services for local customers",
      owner_full_name: "Demo Owner",
      email: "demo@example.com",
      phone: "(555) 000-0000",
      status: "awaiting_preferences",
    })
    .select("id, status, business_name")
    .single()

  if (projectError || !project) {
    return NextResponse.json(
      { error: `Failed to create project: ${projectError?.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    skipped: false,
    message: "Demo project created successfully",
    project,
    userId,
    leadId,
  })
}
