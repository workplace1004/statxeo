import "server-only"

import Stripe from "stripe"

import { calculateWhiteLabelerNetPayout } from "@/lib/statxeo/white-labeler-pricing"
import {
  getWhiteLabelerLaunchReadiness,
  WhiteLabelerCheckoutBlockedError,
} from "@/lib/statxeo/white-labeler-launch-gates"
import { logWhiteLabelerAuditEvent } from "@/lib/statxeo/white-labeler-server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>

export type WhiteLabelerStripeStatus = "not_started" | "pending" | "restricted" | "active"

type WhiteLabelerStripeRequirementError = {
  code: string | null
  reason: string | null
  requirement: string | null
}

export type WhiteLabelerStripeRequirements = {
  currentlyDue: string[]
  eventuallyDue: string[]
  pastDue: string[]
  pendingVerification: string[]
  disabledReason: string | null
  errors: WhiteLabelerStripeRequirementError[]
}

export type WhiteLabelerStripeOverview = {
  isConfigured: boolean
  accountId: string | null
  status: WhiteLabelerStripeStatus
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  country: string | null
  email: string | null
  requirements: WhiteLabelerStripeRequirements
  connectedAt: string | null
  lastSyncedAt: string | null
  needsAttention: boolean
}

export type WhiteLabelerCheckoutSessionResult = {
  sessionId: string
  url: string
  clientId: string
  clientName: string
  planOverrideId: string
  planCode: string
  currency: string
  amountSoldCents: number
  applicationFeeAmountCents: number
  netPayoutCents: number
}

export type WhiteLabelerStripeDatabaseRow = {
  stripe_connect_account_id: string | null
  stripe_connect_status: string | null
  stripe_connect_charges_enabled: boolean | null
  stripe_connect_payouts_enabled: boolean | null
  stripe_connect_details_submitted: boolean | null
  stripe_connect_country: string | null
  stripe_connect_email: string | null
  stripe_connect_requirements: unknown
  stripe_connected_at: string | null
  stripe_connect_last_synced_at: string | null
}

type WhiteLabelerStripeSyncRow = WhiteLabelerStripeDatabaseRow & {
  id: string
  display_name: string | null
  stripe_connect_onboarded_at: string | null
  stripe_connect_last_event_id: string | null
}

type WhiteLabelerLookupRow = WhiteLabelerStripeSyncRow & {
  owner_user_id: string | null
}

type WhiteLabelerClientCheckoutRow = {
  id: string | null
  client_name: string | null
  billing_email: string | null
  status: string | null
}

type WhiteLabelerPlanCheckoutRow = {
  id: string | null
  plan_code: string | null
  currency: string | null
  amount_sold_cents: number | null
  base_cost_cents: number | null
  white_label_fee_cents: number | null
  is_active: boolean | null
  effective_to: string | null
}

const WHITE_LABELER_STRIPE_SELECT =
  "id, display_name, owner_user_id, stripe_connect_account_id, stripe_connect_status, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_country, stripe_connect_email, stripe_connect_requirements, stripe_connect_onboarded_at, stripe_connect_last_event_id, stripe_connected_at, stripe_connect_last_synced_at"

const WHITE_LABELER_STRIPE_STATUSES = new Set<WhiteLabelerStripeStatus>([
  "not_started",
  "pending",
  "restricted",
  "active",
])

let stripeClient: Stripe | null = null

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const normalized = typeof value === "string" ? value.trim() : ""
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    output.push(normalized)
  }

  return output
}

function parseStripeInteger(raw: string | null | undefined) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.round(parsed))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeStatus(value: unknown): WhiteLabelerStripeStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (WHITE_LABELER_STRIPE_STATUSES.has(normalized as WhiteLabelerStripeStatus)) {
    return normalized as WhiteLabelerStripeStatus
  }

  return "not_started"
}

function normalizeTextArray(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0)
}

function parseStoredRequirements(value: unknown): WhiteLabelerStripeRequirements {
  if (!isRecord(value)) {
    return {
      currentlyDue: [],
      eventuallyDue: [],
      pastDue: [],
      pendingVerification: [],
      disabledReason: null,
      errors: [],
    }
  }

  const rawErrors = Array.isArray(value.errors) ? value.errors : []

  return {
    currentlyDue: normalizeTextArray(value.currentlyDue),
    eventuallyDue: normalizeTextArray(value.eventuallyDue),
    pastDue: normalizeTextArray(value.pastDue),
    pendingVerification: normalizeTextArray(value.pendingVerification),
    disabledReason: typeof value.disabledReason === "string" && value.disabledReason.trim() ? value.disabledReason.trim() : null,
    errors: rawErrors.map((entry) => {
      if (!isRecord(entry)) {
        return {
          code: null,
          reason: null,
          requirement: null,
        }
      }

      return {
        code: typeof entry.code === "string" && entry.code.trim() ? entry.code.trim() : null,
        reason: typeof entry.reason === "string" && entry.reason.trim() ? entry.reason.trim() : null,
        requirement: typeof entry.requirement === "string" && entry.requirement.trim() ? entry.requirement.trim() : null,
      }
    }),
  }
}

function extractStripeRequirements(account: Stripe.Account): WhiteLabelerStripeRequirements {
  const requirements = account.requirements

  return {
    currentlyDue: normalizeTextArray(requirements?.currently_due),
    eventuallyDue: normalizeTextArray(requirements?.eventually_due),
    pastDue: normalizeTextArray(requirements?.past_due),
    pendingVerification: normalizeTextArray(requirements?.pending_verification),
    disabledReason: requirements?.disabled_reason ?? null,
    errors: (requirements?.errors ?? []).map((entry) => ({
      code: entry.code ?? null,
      reason: entry.reason ?? null,
      requirement: entry.requirement ?? null,
    })),
  }
}

function deriveStripeStatus(account: Stripe.Account): WhiteLabelerStripeStatus {
  if (account.charges_enabled && account.payouts_enabled) {
    return "active"
  }

  const requirements = extractStripeRequirements(account)

  if (requirements.disabledReason || requirements.pastDue.length > 0) {
    return "restricted"
  }

  if (
    account.details_submitted ||
    requirements.currentlyDue.length > 0 ||
    requirements.pendingVerification.length > 0 ||
    requirements.eventuallyDue.length > 0
  ) {
    return "pending"
  }

  return "pending"
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY_LIVE?.trim() || process.env.STRIPE_SECRET_KEY?.trim() || ""
}

export function isStripeConnectConfigured() {
  return Boolean(getStripeSecretKey())
}

export function getStripeConnectWebhookSecrets() {
  return uniqueStrings([
    process.env.CONNECT_WEBHOOK_SECRET_THIN,
    process.env.CONNECT_WEBHOOK_SECRET_SNAPSHOT,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET_LIVE,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ])
}

export function getWhiteLabelerPaymentWebhookSecrets() {
  return uniqueStrings([
    process.env.SIGNING_SECRET_WHITE_LABEL_THIN,
    process.env.SIGNING_SECRET_WHITE_LABEL_SNAPSHOT,
    process.env.WHITE_LABEL_STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WHITE_LABEL_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_WHITE_LABEL,
  ])
}

export function getStripeConnect() {
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    throw new Error("Stripe Connect is not configured. Set STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE.")
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }

  return stripeClient
}

function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/+$/, "")
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`
  }

  return "https://statxeo.com"
}

function buildStripeOverviewFromAccount(account: Stripe.Account): WhiteLabelerStripeOverview {
  const requirements = extractStripeRequirements(account)
  const status = deriveStripeStatus(account)

  return {
    isConfigured: isStripeConnectConfigured(),
    accountId: account.id,
    status,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    country: account.country ?? null,
    email: account.email ?? null,
    requirements,
    connectedAt: status === "active" ? new Date().toISOString() : null,
    lastSyncedAt: new Date().toISOString(),
    needsAttention:
      status === "restricted" ||
      requirements.pastDue.length > 0 ||
      requirements.currentlyDue.length > 0 ||
      requirements.errors.length > 0,
  }
}

export function buildWhiteLabelerStripeOverview(row: WhiteLabelerStripeDatabaseRow | null): WhiteLabelerStripeOverview {
  const requirements = parseStoredRequirements(row?.stripe_connect_requirements)
  const status = row ? normalizeStatus(row.stripe_connect_status) : "not_started"

  return {
    isConfigured: isStripeConnectConfigured(),
    accountId: row?.stripe_connect_account_id ?? null,
    status,
    chargesEnabled: Boolean(row?.stripe_connect_charges_enabled),
    payoutsEnabled: Boolean(row?.stripe_connect_payouts_enabled),
    detailsSubmitted: Boolean(row?.stripe_connect_details_submitted),
    country: row?.stripe_connect_country ?? null,
    email: row?.stripe_connect_email ?? null,
    requirements,
    connectedAt: row?.stripe_connected_at ?? null,
    lastSyncedAt: row?.stripe_connect_last_synced_at ?? null,
    needsAttention:
      status === "restricted" ||
      requirements.pastDue.length > 0 ||
      requirements.currentlyDue.length > 0 ||
      requirements.errors.length > 0,
  }
}

async function getWhiteLabelerRowById(adminClient: AdminSupabaseClient, whiteLabelerId: string) {
  const { data, error } = await adminClient
    .from("statxeo_white_labelers")
    .select(WHITE_LABELER_STRIPE_SELECT)
    .eq("id", whiteLabelerId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to load the white-label Stripe account state.")
  }

  return (data ?? null) as WhiteLabelerLookupRow | null
}

async function getWhiteLabelerRowByStripeAccountId(adminClient: AdminSupabaseClient, accountId: string) {
  const { data, error } = await adminClient
    .from("statxeo_white_labelers")
    .select(WHITE_LABELER_STRIPE_SELECT)
    .eq("stripe_connect_account_id", accountId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to match the connected Stripe account to a white-label account.")
  }

  return (data ?? null) as WhiteLabelerLookupRow | null
}

async function getWhiteLabelerClientRow(params: {
  adminClient: AdminSupabaseClient
  whiteLabelerId: string
  clientId: string
}) {
  const { data, error } = await params.adminClient
    .from("statxeo_white_labeler_clients")
    .select("id, client_name, billing_email, status")
    .eq("white_labeler_id", params.whiteLabelerId)
    .eq("id", params.clientId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to load the selected client for checkout.")
  }

  return (data ?? null) as WhiteLabelerClientCheckoutRow | null
}

async function getWhiteLabelerPlanRow(params: {
  adminClient: AdminSupabaseClient
  whiteLabelerId: string
  planOverrideId: string
}) {
  const { data, error } = await params.adminClient
    .from("statxeo_white_labeler_plan_overrides")
    .select("id, plan_code, currency, amount_sold_cents, base_cost_cents, white_label_fee_cents, is_active, effective_to")
    .eq("white_labeler_id", params.whiteLabelerId)
    .eq("id", params.planOverrideId)
    .maybeSingle()

  if (error) {
    throw new Error("Unable to load the selected pricing override for checkout.")
  }

  return (data ?? null) as WhiteLabelerPlanCheckoutRow | null
}

function isMissingStripeAccountError(error: unknown) {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing"
}

async function ensureStripeAccount(params: {
  whiteLabelerId: string
  ownerEmail?: string | null
}): Promise<Stripe.Account> {
  const adminClient = createAdminSupabaseClient()
  const stripe = getStripeConnect()
  const whiteLabeler = await getWhiteLabelerRowById(adminClient, params.whiteLabelerId)

  if (!whiteLabeler?.id) {
    throw new Error("White-label account not found.")
  }

  const existingAccountId = whiteLabeler.stripe_connect_account_id?.trim() || ""
  if (existingAccountId) {
    try {
      const existing = await stripe.accounts.retrieve(existingAccountId)
      if (!("deleted" in existing && existing.deleted)) {
        return existing
      }
    } catch (error) {
      if (!isMissingStripeAccountError(error)) {
        throw new Error("Unable to load the existing Stripe Connect account right now.")
      }
    }
  }

  const account = await stripe.accounts.create({
    type: "express",
    email: params.ownerEmail || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      white_labeler_id: whiteLabeler.id,
      source: "statxeo_white_labeler",
    },
  })

  await syncWhiteLabelerStripeAccountFromAccount({
    account,
    whiteLabelerId: whiteLabeler.id,
  })

  return account
}

export async function createWhiteLabelerStripeAccountLink(params: {
  whiteLabelerId: string
  ownerEmail?: string | null
}) {
  const stripe = getStripeConnect()
  const account = await ensureStripeAccount(params)
  const siteUrl = getSiteUrl()

  await syncWhiteLabelerStripeAccountFromAccount({
    account,
    whiteLabelerId: params.whiteLabelerId,
  })

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${siteUrl}/api/white-labeler/stripe/account-link`,
    return_url: `${siteUrl}/api/white-labeler/stripe/return`,
    type: "account_onboarding",
  })

  return {
    accountId: account.id,
    status: deriveStripeStatus(account),
    url: link.url,
  }
}

export async function createWhiteLabelerStripeDashboardLoginLink(whiteLabelerId: string) {
  const adminClient = createAdminSupabaseClient()
  const whiteLabeler = await getWhiteLabelerRowById(adminClient, whiteLabelerId)

  if (!whiteLabeler?.id || !whiteLabeler.stripe_connect_account_id) {
    throw new Error("No Stripe Connect account exists for this white-label account yet.")
  }

  const stripe = getStripeConnect()
  const account = await stripe.accounts.retrieve(whiteLabeler.stripe_connect_account_id)

  if ("deleted" in account && account.deleted) {
    throw new Error("The connected Stripe account is no longer available.")
  }

  await syncWhiteLabelerStripeAccountFromAccount({
    account,
    whiteLabelerId,
  })

  const loginLink = await stripe.accounts.createLoginLink(account.id)

  return {
    accountId: account.id,
    url: loginLink.url,
  }
}

export async function createWhiteLabelerDestinationCheckoutSession(params: {
  whiteLabelerId: string
  clientId: string
  planOverrideId: string
}): Promise<WhiteLabelerCheckoutSessionResult> {
  const adminClient = createAdminSupabaseClient()
  const stripe = getStripeConnect()
  const whiteLabeler = await getWhiteLabelerRowById(adminClient, params.whiteLabelerId)

  if (!whiteLabeler?.id) {
    throw new Error("White-label account not found.")
  }

  const launchReadiness = await getWhiteLabelerLaunchReadiness(adminClient, whiteLabeler.id)
  if (!launchReadiness.canSell) {
    throw new WhiteLabelerCheckoutBlockedError(launchReadiness)
  }

  if (!whiteLabeler.stripe_connect_account_id) {
    throw new Error("Connect Stripe first before generating checkout links.")
  }

  const [client, plan] = await Promise.all([
    getWhiteLabelerClientRow({
      adminClient,
      whiteLabelerId: whiteLabeler.id,
      clientId: params.clientId,
    }),
    getWhiteLabelerPlanRow({
      adminClient,
      whiteLabelerId: whiteLabeler.id,
      planOverrideId: params.planOverrideId,
    }),
  ])

  if (!client?.id || !client.client_name) {
    throw new Error("The selected client was not found.")
  }

  if ((client.status ?? "").trim().toLowerCase() !== "active") {
    throw new Error("Only active clients can receive a checkout link.")
  }

  if (!plan?.id || !plan.plan_code) {
    throw new Error("The selected pricing override was not found.")
  }

  if (!plan.is_active || plan.effective_to) {
    throw new Error("Choose an active pricing override before creating checkout.")
  }

  const pricing = calculateWhiteLabelerNetPayout({
    amountSoldCents: plan.amount_sold_cents ?? 0,
    baseCostCents: plan.base_cost_cents ?? 0,
    whiteLabelFeeCents: plan.white_label_fee_cents ?? 0,
  })
  const applicationFeeAmountCents = pricing.baseCostCents + pricing.whiteLabelFeeCents

  if (pricing.amountSoldCents <= 0) {
    throw new Error("The selected pricing override must have an amount sold greater than zero.")
  }

  if (applicationFeeAmountCents > pricing.amountSoldCents) {
    throw new Error("The platform fee exceeds the amount sold for this pricing override.")
  }

  const siteUrl = getSiteUrl()
  const metadata: Record<string, string> = {
    source: "statxeo_white_label_checkout",
    white_labeler_id: whiteLabeler.id,
    client_id: client.id,
    plan_override_id: plan.id,
    plan_code: plan.plan_code,
    source_charge_type: "one_time",
    destination_account_id: whiteLabeler.stripe_connect_account_id,
    amount_sold_cents: String(pricing.amountSoldCents),
    base_cost_cents: String(pricing.baseCostCents),
    white_label_fee_cents: String(pricing.whiteLabelFeeCents),
    net_payout_cents: String(pricing.netPayoutCents),
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: client.id,
    customer_email: client.billing_email ?? undefined,
    success_url: `${siteUrl}/white-labeler?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/white-labeler?checkout=cancelled`,
    metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (plan.currency ?? "usd").toLowerCase(),
          unit_amount: pricing.amountSoldCents,
          product_data: {
            name: `${whiteLabeler.display_name ?? "Statxeo"} ${plan.plan_code}`,
            description: `Managed service for ${client.client_name}`,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: applicationFeeAmountCents > 0 ? applicationFeeAmountCents : undefined,
      transfer_data: {
        destination: whiteLabeler.stripe_connect_account_id,
      },
      metadata,
    },
  })

  if (!session.url) {
    throw new Error("Stripe did not return a hosted checkout URL.")
  }

  return {
    sessionId: session.id,
    url: session.url,
    clientId: client.id,
    clientName: client.client_name,
    planOverrideId: plan.id,
    planCode: plan.plan_code,
    currency: (plan.currency ?? "usd").toLowerCase(),
    amountSoldCents: pricing.amountSoldCents,
    applicationFeeAmountCents,
    netPayoutCents: pricing.netPayoutCents,
  }
}

export async function reconcileWhiteLabelerCheckoutSession(params: {
  session: Stripe.Checkout.Session
  eventId: string
}) {
  const metadata = params.session.metadata ?? {}
  if (metadata.source !== "statxeo_white_label_checkout") {
    return null
  }

  const whiteLabelerId = metadata.white_labeler_id?.trim()
  const clientId = metadata.client_id?.trim() || null
  const planCode = metadata.plan_code?.trim() || "custom"

  if (!whiteLabelerId) {
    return null
  }

  const chargedAt = new Date((params.session.created || Math.floor(Date.now() / 1000)) * 1000)
  const settlementMonth = new Date(Date.UTC(chargedAt.getUTCFullYear(), chargedAt.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)

  const adminClient = createAdminSupabaseClient()
  const baseCostCents = parseStripeInteger(metadata.base_cost_cents)
  const whiteLabelFeeCents = parseStripeInteger(metadata.white_label_fee_cents)
  const applicationFeeAmountCents = baseCostCents + whiteLabelFeeCents

  const { error } = await adminClient.from("statxeo_white_labeler_charges").upsert(
    {
      white_labeler_id: whiteLabelerId,
      client_id: clientId,
      source_event_id: params.session.id,
      source_system: "stripe_checkout",
      source_charge_type: "one_time",
      charge_status: "posted",
      settlement_month: settlementMonth,
      charged_at: chargedAt.toISOString(),
      plan_code: planCode,
      currency: (params.session.currency ?? "usd").toLowerCase(),
      amount_sold_cents: parseStripeInteger(metadata.amount_sold_cents) || Math.max(0, params.session.amount_total ?? 0),
      base_cost_cents: baseCostCents,
      white_label_fee_cents: whiteLabelFeeCents,
      metadata: {
        source: "statxeo_white_label_checkout",
        stripe_event_id: params.eventId,
        stripe_checkout_session_id: params.session.id,
        stripe_payment_intent_id:
          typeof params.session.payment_intent === "string"
            ? params.session.payment_intent
            : params.session.payment_intent?.id ?? null,
        stripe_customer_id:
          typeof params.session.customer === "string"
            ? params.session.customer
            : params.session.customer?.id ?? null,
        stripe_customer_email: params.session.customer_details?.email ?? params.session.customer_email ?? null,
        destination_account_id: metadata.destination_account_id?.trim() || null,
        application_fee_amount_cents: applicationFeeAmountCents,
        net_payout_cents: parseStripeInteger(metadata.net_payout_cents),
      },
    },
    {
      onConflict: "white_labeler_id,source_event_id",
    },
  )

  if (error) {
    throw new Error("Unable to persist the white-label checkout charge in the ledger.")
  }

  return {
    whiteLabelerId,
    sessionId: params.session.id,
  }
}

export async function syncWhiteLabelerStripeAccountByWhiteLabelerId(whiteLabelerId: string) {
  const adminClient = createAdminSupabaseClient()
  const whiteLabeler = await getWhiteLabelerRowById(adminClient, whiteLabelerId)
  if (!whiteLabeler?.id || !whiteLabeler.stripe_connect_account_id) {
    return null
  }

  const stripe = getStripeConnect()
  const account = await stripe.accounts.retrieve(whiteLabeler.stripe_connect_account_id)
  if ("deleted" in account && account.deleted) {
    return null
  }

  return syncWhiteLabelerStripeAccountFromAccount({
    account,
    whiteLabelerId,
  })
}

export async function syncWhiteLabelerStripeAccountFromAccount(params: {
  account: Stripe.Account
  whiteLabelerId?: string
  eventId?: string
}) {
  const adminClient = createAdminSupabaseClient()

  let whiteLabeler = params.whiteLabelerId
    ? await getWhiteLabelerRowById(adminClient, params.whiteLabelerId)
    : await getWhiteLabelerRowByStripeAccountId(adminClient, params.account.id)

  if (!whiteLabeler?.id) {
    const metadataWhiteLabelerId = params.account.metadata?.white_labeler_id?.trim()
    if (metadataWhiteLabelerId) {
      whiteLabeler = await getWhiteLabelerRowById(adminClient, metadataWhiteLabelerId)
    }
  }

  if (!whiteLabeler?.id) {
    return null
  }

  const previousOverview = buildWhiteLabelerStripeOverview(whiteLabeler)
  const nextOverview = buildStripeOverviewFromAccount(params.account)
  const now = new Date().toISOString()
  const nextConnectedAt = nextOverview.status === "active" ? whiteLabeler.stripe_connected_at ?? now : null
  const nextOnboardedAt = nextOverview.status === "active" ? whiteLabeler.stripe_connect_onboarded_at ?? now : whiteLabeler.stripe_connect_onboarded_at

  const updatePayload: Record<string, unknown> = {
    stripe_connect_account_id: params.account.id,
    stripe_connect_status: nextOverview.status,
    stripe_connect_charges_enabled: nextOverview.chargesEnabled,
    stripe_connect_payouts_enabled: nextOverview.payoutsEnabled,
    stripe_connect_details_submitted: nextOverview.detailsSubmitted,
    stripe_connect_country: nextOverview.country,
    stripe_connect_email: nextOverview.email,
    stripe_connect_requirements: nextOverview.requirements,
    stripe_connect_onboarded_at: nextOnboardedAt,
    stripe_connect_last_error: nextOverview.requirements.disabledReason,
    stripe_connect_last_synced_at: now,
    stripe_connected_at: nextConnectedAt,
  }

  if (params.eventId) {
    updatePayload.stripe_connect_last_event_id = params.eventId
  }

  const { error } = await adminClient
    .from("statxeo_white_labelers")
    .update(updatePayload)
    .eq("id", whiteLabeler.id)

  if (error) {
    throw new Error("Unable to persist Stripe Connect status for this white-label account.")
  }

  if (
    previousOverview.status !== nextOverview.status ||
    previousOverview.accountId !== nextOverview.accountId ||
    previousOverview.chargesEnabled !== nextOverview.chargesEnabled ||
    previousOverview.payoutsEnabled !== nextOverview.payoutsEnabled
  ) {
    void logWhiteLabelerAuditEvent({
      whiteLabelerId: whiteLabeler.id,
      actorUserId: whiteLabeler.owner_user_id ?? "00000000-0000-0000-0000-000000000000",
      action: previousOverview.accountId ? "transition" : "create",
      entityType: "stripe_connect",
      entityId: params.account.id,
      changes: {
        previous_status: previousOverview.status,
        next_status: nextOverview.status,
        charges_enabled: nextOverview.chargesEnabled,
        payouts_enabled: nextOverview.payoutsEnabled,
        event_id: params.eventId ?? null,
      },
    })
  }

  return {
    whiteLabelerId: whiteLabeler.id,
    overview: {
      ...nextOverview,
      connectedAt: nextConnectedAt,
      lastSyncedAt: now,
    },
  }
}