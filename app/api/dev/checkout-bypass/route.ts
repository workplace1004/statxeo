import { NextRequest, NextResponse } from "next/server"

import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isWebsitePackageId } from "@/lib/statxeo/catalog"

/**
 * POST /api/dev/checkout-bypass
 *
 * Development-only endpoint.
 * Simulates a completed checkout by directly creating a lead + site project
 * from the intake form data — skipping Stripe entirely.
 *
 * After success, the client redirects to /customer/website.
 *
 * Body mirrors the intake form payload:
 *   websitePackageId, ownerFullName, businessName, businessAddressFull,
 *   ein, businessIndustry, businessProductsServices, email, phone, notes?
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const {
    websitePackageId,
    ownerFullName,
    businessName,
    businessAddressFull,
    ein,
    businessIndustry,
    businessProductsServices,
    email,
    phone,
    notes,
  } = body as Record<string, string>

  // Validate required fields
  if (!websitePackageId || !isWebsitePackageId(websitePackageId)) {
    return NextResponse.json({ error: "Invalid or missing websitePackageId" }, { status: 400 })
  }
  if (!ownerFullName || !businessName || !businessAddressFull || !ein || !businessIndustry || !businessProductsServices) {
    return NextResponse.json({ error: "Missing required business fields" }, { status: 400 })
  }
  if (!email || !phone) {
    return NextResponse.json({ error: "email and phone are required" }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // ── 1. Find or create lead by email ─────────────────────────────────────

  let leadId: string

  const { data: existingLead } = await admin
    .from("statxeo_leads")
    .select("id")
    .ilike("contact_email", email.trim())
    .maybeSingle()

  if (existingLead) {
    leadId = existingLead.id
  } else {
    const { data: newLead, error: leadErr } = await admin
      .from("statxeo_leads")
      .insert({
        contact_email: email.trim(),
        contact_name: ownerFullName.trim(),
        contact_phone: phone.trim(),
        business_name: businessName.trim(),
        package_tier: websitePackageId,
        status: "paid",
        intake_json: {
          ownerFullName: ownerFullName.trim(),
          businessName: businessName.trim(),
          businessAddress: businessAddressFull.trim(),
          ein: ein.trim(),
          businessIndustry: businessIndustry.trim(),
          businessProductsServices: businessProductsServices.trim(),
          phone: phone.trim(),
          email: email.trim(),
          notes: notes?.trim() ?? "",
        },
      })
      .select("id")
      .single()

    if (leadErr || !newLead) {
      return NextResponse.json({ error: `Failed to create lead: ${leadErr?.message}` }, { status: 500 })
    }
    leadId = newLead.id
  }

  // ── 2. Check if a site project already exists for this lead ─────────────

  const { data: existingProject } = await admin
    .from("statxeo_site_projects")
    .select("id, status")
    .eq("lead_id", leadId)
    .maybeSingle()

  if (existingProject) {
    // Reset to awaiting_preferences so the setup form shows
    await admin
      .from("statxeo_site_projects")
      .update({ status: "awaiting_preferences" })
      .eq("id", existingProject.id)

    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Existing project reset to awaiting_preferences",
      redirectUrl: "/customer/website",
    })
  }

  // ── 3. Create the site project ───────────────────────────────────────────

  const { data: project, error: projErr } = await admin
    .from("statxeo_site_projects")
    .insert({
      lead_id: leadId,
      package_tier: websitePackageId,
      business_name: businessName.trim(),
      owner_full_name: ownerFullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      business_industry: businessIndustry.trim(),
      business_address: businessAddressFull.trim(),
      business_products_services: businessProductsServices.trim(),
      status: "awaiting_preferences",
    })
    .select("id, status")
    .single()

  if (projErr || !project) {
    return NextResponse.json({ error: `Failed to create project: ${projErr?.message}` }, { status: 500 })
  }

  // ── 4. Find the auth user by email and link them to the lead ─────────────

  try {
    const { data: { users } } = await admin.auth.admin.listUsers()
    const authUser = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase())

    if (authUser) {
      await admin
        .from("statxeo_customer_lead_links")
        .upsert(
          { user_id: authUser.id, lead_id: leadId, linked_by: "dev_checkout_bypass" },
          { onConflict: "user_id,lead_id" },
        )
    }
  } catch {
    // Non-fatal — user can still log in and see the project via email match
  }

  return NextResponse.json({
    ok: true,
    skipped: false,
    message: "Dev checkout bypass: project created successfully",
    projectId: project.id,
    redirectUrl: "/customer/website",
  })
}
