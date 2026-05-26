import { NextRequest, NextResponse } from "next/server"

import { getApiUser } from "@/lib/supabase/api-auth"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * GET /api/site-projects
 *
 * Fetch the current customer's site project(s).
 * Returns projects linked to the authenticated user via customer_lead_links or email match.
 */
export async function GET(request: NextRequest) {
  const user = await getApiUser(request)

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // Resolve lead IDs for this user (same pattern as customer-server.ts)
  const leadIds = await resolveLeadIds(admin, user.id, user.email ?? "")

  if (leadIds.length === 0) {
    return NextResponse.json({ projects: [] })
  }

  const { data: projects, error } = await admin
    .from("statxeo_site_projects")
    .select(`
      id,
      lead_id,
      package_tier,
      business_name,
      owner_full_name,
      status,
      preview_url,
      production_url,
      domain_name,
      template_id,
      brand_tone,
      primary_color,
      secondary_color,
      target_audience,
      cta_preference,
      created_at,
      updated_at
    `)
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects: projects ?? [] })
}

async function resolveLeadIds(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userId: string,
  email: string,
): Promise<string[]> {
  const ids = new Set<string>()

  // 1. Explicit links via statxeo_customer_lead_links
  const { data: links } = await admin
    .from("statxeo_customer_lead_links")
    .select("lead_id")
    .eq("user_id", userId)

  if (links) {
    for (const link of links) {
      ids.add(link.lead_id)
    }
  }

  // 2. Email match fallback on statxeo_leads.contact_email
  if (email) {
    const { data: emailLeads } = await admin
      .from("statxeo_leads")
      .select("id")
      .ilike("contact_email", email)

    if (emailLeads) {
      for (const lead of emailLeads) {
        ids.add(lead.id)
      }
    }
  }

  return Array.from(ids)
}
