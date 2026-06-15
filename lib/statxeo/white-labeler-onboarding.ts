import { evaluateBrandChecklist } from "@/lib/statxeo/white-labeler-brand-checklist"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>

export type WhiteLabelerOnboardingStepKey =
  | "organization"
  | "branding"
  | "stripe"
  | "domain"
  | "workspace"
  | "team"
  | "first_client"

export type WhiteLabelerOnboardingStep = {
  key: WhiteLabelerOnboardingStepKey
  label: string
  description: string
  complete: boolean
}

export type WhiteLabelerOnboardingSnapshot = {
  isComplete: boolean
  currentStep: WhiteLabelerOnboardingStepKey | "completed"
  completedSteps: number
  totalSteps: number
  percentComplete: number
  steps: WhiteLabelerOnboardingStep[]
}

type WhiteLabelerOnboardingRow = {
  org_created_at: string | null
  branding_completed_at: string | null
  stripe_connected_at: string | null
  domain_verified_at: string | null
  workspace_ready_at: string | null
  team_invited_at: string | null
  first_client_created_at: string | null
  onboarding_completed_at: string | null
}

type BrandingRow = {
  brand_name: string | null
  primary_color: string | null
  secondary_color: string | null
  logo_url: string | null
  support_email: string | null
}

export async function getWhiteLabelerOnboardingSnapshot(
  adminClient: AdminSupabaseClient,
  whiteLabelerId: string,
): Promise<WhiteLabelerOnboardingSnapshot> {
  const [
    { data: whiteLabelerData },
    { data: brandingData },
    { count: verifiedDomainCount },
    { count: activeMemberCount },
    { count: clientCount },
  ] = await Promise.all([
    adminClient
      .from("statxeo_white_labelers")
      .select(
        "org_created_at, branding_completed_at, stripe_connected_at, domain_verified_at, workspace_ready_at, team_invited_at, first_client_created_at, onboarding_completed_at",
      )
      .eq("id", whiteLabelerId)
      .maybeSingle(),
    adminClient
      .from("statxeo_white_labeler_branding_settings")
      .select("brand_name, primary_color, secondary_color, logo_url, support_email")
      .eq("white_labeler_id", whiteLabelerId)
      .maybeSingle(),
    adminClient
      .from("statxeo_white_labeler_domains")
      .select("id", { count: "exact", head: true })
      .eq("white_labeler_id", whiteLabelerId)
      .eq("verification_status", "verified"),
    adminClient
      .from("statxeo_white_labeler_members")
      .select("user_id", { count: "exact", head: true })
      .eq("white_labeler_id", whiteLabelerId)
      .eq("is_active", true),
    adminClient
      .from("statxeo_white_labeler_clients")
      .select("id", { count: "exact", head: true })
      .eq("white_labeler_id", whiteLabelerId),
  ])

  const whiteLabeler = (whiteLabelerData ?? null) as WhiteLabelerOnboardingRow | null
  const branding = (brandingData ?? null) as BrandingRow | null

  const brandingComplete =
    Boolean(whiteLabeler?.branding_completed_at) ||
    evaluateBrandChecklist(branding ?? null).meetsMinimumForCheckout

  const steps: WhiteLabelerOnboardingStep[] = [
    {
      key: "organization",
      label: "Organization created",
      description: "Your reseller organization is provisioned and ready for setup.",
      complete: Boolean(whiteLabeler?.org_created_at),
    },
    {
      key: "branding",
      label: "Upload branding",
      description: "Add brand name, primary and secondary colors, HTTPS logo URL, and support email.",
      complete: brandingComplete,
    },
    {
      key: "stripe",
      label: "Connect Stripe",
      description: "Link a Stripe Connect Express account before payouts go live.",
      complete: Boolean(whiteLabeler?.stripe_connected_at),
    },
    {
      key: "domain",
      label: "Verify domain",
      description: "Verify a custom domain or keep using the default platform domain.",
      complete: Boolean(whiteLabeler?.domain_verified_at) || Number(verifiedDomainCount ?? 0) > 0,
    },
    {
      key: "workspace",
      label: "Create reseller workspace",
      description: "Activate the workspace defaults and publishing surface.",
      complete: Boolean(whiteLabeler?.workspace_ready_at),
    },
    {
      key: "team",
      label: "Invite team",
      description: "Add at least one teammate to operate the account with you.",
      complete: Boolean(whiteLabeler?.team_invited_at) || Number(activeMemberCount ?? 0) > 1,
    },
    {
      key: "first_client",
      label: "Create first client",
      description: "Create the first managed client record to finish activation.",
      complete: Boolean(whiteLabeler?.first_client_created_at) || Number(clientCount ?? 0) > 0,
    },
  ]

  const completedSteps = steps.filter((step) => step.complete).length
  const totalSteps = steps.length
  const isComplete = Boolean(whiteLabeler?.onboarding_completed_at) || completedSteps === totalSteps
  const firstIncomplete = steps.find((step) => !step.complete)

  return {
    isComplete,
    currentStep: isComplete ? "completed" : firstIncomplete?.key ?? "completed",
    completedSteps,
    totalSteps,
    percentComplete: Math.round((completedSteps / totalSteps) * 100),
    steps,
  }
}