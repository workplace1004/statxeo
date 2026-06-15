export type BrandChecklistItem = {
  key: "brand_name" | "primary_color" | "secondary_color" | "logo_url" | "support_email"
  label: string
  complete: boolean
}

export type BrandingFieldsForLaunch = {
  brand_name: string | null
  primary_color: string | null
  secondary_color: string | null
  logo_url: string | null
  support_email: string | null
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function isHttpsLogo(value: string | null | undefined) {
  if (!hasText(value)) return false
  try {
    const url = new URL(value!.trim())
    return url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidSupportEmail(value: string | null | undefined) {
  if (!hasText(value)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value!.trim().toLowerCase())
}

function isValidHexOrNamedColor(value: string | null | undefined) {
  if (!hasText(value)) return false
  const trimmed = value!.trim()
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return true
  return /^[a-z]+$/i.test(trimmed)
}

/**
 * Required brand fields before creating live checkout (go-live gate).
 */
export function evaluateBrandChecklist(branding: BrandingFieldsForLaunch | null | undefined): {
  items: BrandChecklistItem[]
  scorePercent: number
  meetsMinimumForCheckout: boolean
} {
  const b = branding ?? null
  const items: BrandChecklistItem[] = [
    {
      key: "brand_name",
      label: "Brand name",
      complete: hasText(b?.brand_name),
    },
    {
      key: "primary_color",
      label: "Primary color",
      complete: isValidHexOrNamedColor(b?.primary_color ?? null),
    },
    {
      key: "secondary_color",
      label: "Secondary color",
      complete: isValidHexOrNamedColor(b?.secondary_color ?? null),
    },
    {
      key: "logo_url",
      label: "Logo (HTTPS URL)",
      complete: isHttpsLogo(b?.logo_url ?? null),
    },
    {
      key: "support_email",
      label: "Support email",
      complete: isValidSupportEmail(b?.support_email ?? null),
    },
  ]

  const completeCount = items.filter((i) => i.complete).length
  const scorePercent = Math.round((completeCount / items.length) * 100)

  return {
    items,
    scorePercent,
    meetsMinimumForCheckout: completeCount === items.length,
  }
}
