import { WhiteLabelerApiError } from "@/lib/statxeo/white-labeler-client"

export function isErrorPayloadRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function describePortalError(error: unknown, fallback: string) {
  if (error instanceof WhiteLabelerApiError) {
    const payload = error.payload
    if (isErrorPayloadRecord(payload) && payload.code === "LAUNCH_BLOCKED" && Array.isArray(payload.blockers)) {
      return (payload.blockers as { message?: string }[])
        .map((row) => (typeof row?.message === "string" ? row.message : ""))
        .filter(Boolean)
        .join(" ")
    }

    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function formatCents(value: number, currency = "usd") {
  const normalizedCurrency = /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : "USD"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
  }).format((Number(value || 0) || 0) / 100)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleDateString()
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleString()
}

export function parseDollarsInputToCents(value: string) {
  const parsed = Number(value.trim())
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

export function formatCentsForInput(value: number) {
  return ((Number.isFinite(value) ? value : 0) / 100).toFixed(2)
}

/** Active portal route segment for refresh + nav highlighting */
export type PortalSegment =
  | "home"
  | "clients"
  | "pricing"
  | "billing"
  | "payouts"
  | "branding"
  | "team"
  | "account"

export function pathnameToSegment(pathname: string): PortalSegment {
  if (pathname.endsWith("/account")) return "account"
  if (pathname.endsWith("/clients")) return "clients"
  if (pathname.endsWith("/pricing")) return "pricing"
  if (pathname.endsWith("/billing")) return "billing"
  if (pathname.endsWith("/payouts")) return "payouts"
  if (pathname.endsWith("/branding")) return "branding"
  if (pathname.endsWith("/team")) return "team"
  return "home"
}
