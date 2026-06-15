import type { SupabaseClient, User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

import { createAdminSupabaseClient, getMissingAdminSupabaseEnvVars } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

type LeadIdRow = {
  id: string | null
}

type LeadLinkRow = {
  lead_id: string | null
}

type SystemAdminRow = {
  user_id: string | null
}

type UserRoleRow = {
  role: string | null
}

export type AuthenticatedCustomerContext = {
  user: User
  email: string
  supabase: ServerSupabaseClient
}

const CUSTOMER_AUTH_REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const

const CUSTOMER_PORTAL_REQUIRED_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export function unauthorizedCustomerResponse() {
  return NextResponse.json({ error: "You must be signed in to access customer portal data." }, { status: 401 })
}

export function forbiddenCustomerResponse() {
  return NextResponse.json({ error: "You do not have permission to access customer portal data." }, { status: 403 })
}

export function getMissingCustomerAuthSupabaseEnvVars() {
  return CUSTOMER_AUTH_REQUIRED_SUPABASE_ENV_VARS.filter((key) => !process.env[key])
}

export function hasCustomerAuthSupabaseEnv() {
  return getMissingCustomerAuthSupabaseEnvVars().length === 0
}

export function getMissingCustomerPortalSupabaseEnvVars() {
  return CUSTOMER_PORTAL_REQUIRED_SUPABASE_ENV_VARS.filter((key) => !process.env[key])
}

export function hasCustomerPortalSupabaseEnv() {
  return getMissingCustomerPortalSupabaseEnvVars().length === 0
}

export function customerSupabaseEnvUnavailableResponse(missingEnvVars: string[]) {
  return NextResponse.json(
    {
      error:
        "Customer portal is not configured for this deployment. Add the missing Supabase environment variables and redeploy.",
      missing: missingEnvVars,
    },
    { status: 503 },
  )
}

export function getCustomerAdminSupabaseClientOrResponse(): SupabaseClient | NextResponse {
  const missingAdminEnvVars = getMissingAdminSupabaseEnvVars()
  if (missingAdminEnvVars.length > 0) {
    return customerSupabaseEnvUnavailableResponse(missingAdminEnvVars)
  }

  return createAdminSupabaseClient()
}

export function normalizeEmail(email: string | null | undefined) {
  if (!email) return ""
  return email.trim().toLowerCase()
}

export async function getAuthenticatedCustomer(): Promise<AuthenticatedCustomerContext | NextResponse> {
  const missingAuthEnvVars = getMissingCustomerAuthSupabaseEnvVars()
  if (missingAuthEnvVars.length > 0) {
    return customerSupabaseEnvUnavailableResponse(missingAuthEnvVars)
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const email = normalizeEmail(user?.email)

  if (error || !user || !email) {
    return unauthorizedCustomerResponse()
  }

  return {
    user,
    email,
    supabase,
  }
}

export async function resolveCustomerLeadIds(adminClient: SupabaseClient, email: string, userId?: string) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return []

  if (typeof userId === "string" && userId.length > 0) {
    const { data: linkData, error: linkError } = await adminClient
      .from("statxeo_customer_lead_links")
      .select("lead_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!linkError && Array.isArray(linkData) && linkData.length > 0) {
      const linkedLeadIds: string[] = []
      const seen = new Set<string>()

      for (const row of linkData as LeadLinkRow[]) {
        if (typeof row.lead_id !== "string" || row.lead_id.length === 0 || seen.has(row.lead_id)) continue
        seen.add(row.lead_id)
        linkedLeadIds.push(row.lead_id)
      }

      if (linkedLeadIds.length > 0) {
        return linkedLeadIds
      }
    }
  }

  const { data, error } = await adminClient
    .from("statxeo_leads")
    .select("id")
    .ilike("contact_email", normalizedEmail)
    .order("created_at", { ascending: false })

  if (error || !Array.isArray(data)) {
    return []
  }

  const fallbackLeadIds = (data as LeadIdRow[])
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  if (fallbackLeadIds.length > 0 && typeof userId === "string" && userId.length > 0) {
    await adminClient.from("statxeo_customer_lead_links").upsert(
      fallbackLeadIds.map((leadId) => ({
        user_id: userId,
        lead_id: leadId,
        linked_by: "email_match",
      })),
      {
        onConflict: "user_id,lead_id",
      },
    )
  }

  return fallbackLeadIds
}

export async function isSupportStaff(adminClient: SupabaseClient, userId: string) {
  if (!userId) return false

  const [{ data: systemAdminData, error: systemAdminError }, { data: userData, error: userError }] = await Promise.all([
    adminClient.from("system_admins").select("user_id").eq("user_id", userId).limit(1),
    adminClient.from("users").select("role").eq("id", userId).limit(1),
  ])

  if (systemAdminError || userError) {
    return false
  }

  const isSystemAdmin = Array.isArray(systemAdminData)
    ? (systemAdminData as SystemAdminRow[]).some((row) => row.user_id === userId)
    : false

  if (isSystemAdmin) {
    return true
  }

  if (!Array.isArray(userData) || userData.length === 0) {
    return false
  }

  const role = (userData as UserRoleRow[])
    .map((row) => (typeof row.role === "string" ? row.role.trim().toLowerCase() : ""))
    .find((value) => value.length > 0)

  return role === "owner" || role === "admin" || role === "super_admin"
}

export function derivePackageName(packageTier: string | null | undefined) {
  const tier = (packageTier ?? "").trim().toLowerCase()

  if (tier === "statxeo_lander" || tier === "lander") return "Lander Package"
  if (tier === "statxeo_core" || tier === "core") return "Core Package"
  if (tier === "statxeo_titan" || tier === "titan") return "Titan Package"
  if (tier === "statxeo_boost" || tier === "boost") return "Boost Package"

  if (!tier) return "Website Package"

  return tier
    .replace(/^statxeo_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (segment) => segment.toUpperCase())
}

export function buildOrderStatus(leadStatus: string | null | undefined): "pending" | "active" | "completed" | "cancelled" {
  const status = (leadStatus ?? "").trim().toLowerCase()

  if (status === "completed" || status === "complete" || status === "delivered") {
    return "completed"
  }

  if (status === "paid" || status === "active" || status === "in_progress" || status === "processing") {
    return "active"
  }

  if (status === "failed" || status === "canceled" || status === "cancelled" || status === "expired") {
    return "cancelled"
  }

  return "pending"
}
