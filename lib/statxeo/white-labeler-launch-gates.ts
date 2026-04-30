import "server-only"

import {
  evaluateBrandChecklist,
  type BrandChecklistItem,
  type BrandingFieldsForLaunch,
} from "@/lib/statxeo/white-labeler-brand-checklist"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>

export type WhiteLabelerLaunchBlocker = {
  code: string
  message: string
}

export type { BrandChecklistItem, BrandingFieldsForLaunch }
export { evaluateBrandChecklist }

export type WhiteLabelerLaunchReadiness = {
  canSell: boolean
  blockers: WhiteLabelerLaunchBlocker[]
  brandChecklist: BrandChecklistItem[]
  brandScorePercent: number
  stripeChargesEnabled: boolean
  accountStatus: string | null
}

type WhiteLabelerStatusRow = {
  status: string | null
  stripe_connect_charges_enabled: boolean | null
}

export class WhiteLabelerCheckoutBlockedError extends Error {
  readonly readiness: WhiteLabelerLaunchReadiness

  constructor(readiness: WhiteLabelerLaunchReadiness) {
    const message =
      readiness.blockers.length > 0
        ? readiness.blockers.map((b) => b.message).join(" ")
        : "Checkout is blocked until launch requirements are met."
    super(message)
    this.name = "WhiteLabelerCheckoutBlockedError"
    this.readiness = readiness
  }
}

export async function getWhiteLabelerLaunchReadiness(
  adminClient: AdminSupabaseClient,
  whiteLabelerId: string,
): Promise<WhiteLabelerLaunchReadiness> {
  const [{ data: wlData, error: wlError }, { data: brandingData, error: brandingError }] = await Promise.all([
    adminClient
      .from("statxeo_white_labelers")
      .select("status, stripe_connect_charges_enabled")
      .eq("id", whiteLabelerId)
      .maybeSingle(),
    adminClient
      .from("statxeo_white_labeler_branding_settings")
      .select("brand_name, primary_color, secondary_color, logo_url, support_email")
      .eq("white_labeler_id", whiteLabelerId)
      .maybeSingle(),
  ])

  if (wlError || brandingError) {
    return {
      canSell: false,
      blockers: [{ code: "load_failed", message: "Unable to verify launch readiness. Try again shortly." }],
      brandChecklist: evaluateBrandChecklist(null).items,
      brandScorePercent: 0,
      stripeChargesEnabled: false,
      accountStatus: null,
    }
  }

  const wl = (wlData ?? null) as WhiteLabelerStatusRow | null
  const accountStatus = (wl?.status ?? "active").trim().toLowerCase()
  const stripeChargesEnabled = Boolean(wl?.stripe_connect_charges_enabled)

  const brandEval = evaluateBrandChecklist((brandingData ?? null) as BrandingFieldsForLaunch | null)

  const blockers: WhiteLabelerLaunchBlocker[] = []

  if (accountStatus !== "active") {
    blockers.push({
      code: "account_status",
      message: `Partner account status is "${accountStatus}". Only active accounts can create checkout links.`,
    })
  }

  if (!stripeChargesEnabled) {
    blockers.push({
      code: "stripe_charges",
      message: "Finish Stripe Connect onboarding until charges are enabled before selling.",
    })
  }

  if (!brandEval.meetsMinimumForCheckout) {
    blockers.push({
      code: "branding_incomplete",
      message: "Complete branding (name, colors, HTTPS logo URL, support email) before creating checkout links.",
    })
  }

  return {
    canSell: blockers.length === 0,
    blockers,
    brandChecklist: brandEval.items,
    brandScorePercent: brandEval.scorePercent,
    stripeChargesEnabled,
    accountStatus: wl?.status ?? null,
  }
}

/**
 * Sets branding_completed_at when the branding row satisfies launch minimum.
 */
export async function syncWhiteLabelerBrandingCompletedFlag(
  adminClient: AdminSupabaseClient,
  whiteLabelerId: string,
): Promise<void> {
  const { data, error } = await adminClient
    .from("statxeo_white_labeler_branding_settings")
    .select("brand_name, primary_color, secondary_color, logo_url, support_email")
    .eq("white_labeler_id", whiteLabelerId)
    .maybeSingle()

  if (error) return

  const meets = evaluateBrandChecklist((data ?? null) as BrandingFieldsForLaunch | null).meetsMinimumForCheckout
  const now = new Date().toISOString()

  await adminClient
    .from("statxeo_white_labelers")
    .update({
      branding_completed_at: meets ? now : null,
    })
    .eq("id", whiteLabelerId)
}

export function isCheckoutBlockedError(error: unknown): error is WhiteLabelerCheckoutBlockedError {
  return error instanceof WhiteLabelerCheckoutBlockedError
}
