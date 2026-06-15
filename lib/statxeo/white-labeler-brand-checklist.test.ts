import { describe, expect, it } from "vitest"

import { evaluateBrandChecklist } from "@/lib/statxeo/white-labeler-brand-checklist"

describe("evaluateBrandChecklist", () => {
  it("returns incomplete when branding is null", () => {
    const result = evaluateBrandChecklist(null)
    expect(result.meetsMinimumForCheckout).toBe(false)
    expect(result.scorePercent).toBe(0)
    expect(result.items.every((i) => !i.complete)).toBe(true)
  })

  it("returns complete when all required fields are valid", () => {
    const result = evaluateBrandChecklist({
      brand_name: "Acme Co",
      primary_color: "#0f766e",
      secondary_color: "#ca8a04",
      logo_url: "https://example.com/logo.png",
      support_email: "support@acme.com",
    })
    expect(result.meetsMinimumForCheckout).toBe(true)
    expect(result.scorePercent).toBe(100)
    expect(result.items.every((i) => i.complete)).toBe(true)
  })

  it("rejects http logo URLs", () => {
    const result = evaluateBrandChecklist({
      brand_name: "Acme Co",
      primary_color: "#0f766e",
      secondary_color: "#ca8a04",
      logo_url: "http://example.com/logo.png",
      support_email: "support@acme.com",
    })
    expect(result.meetsMinimumForCheckout).toBe(false)
    const logo = result.items.find((i) => i.key === "logo_url")
    expect(logo?.complete).toBe(false)
  })

  it("rejects invalid support email", () => {
    const result = evaluateBrandChecklist({
      brand_name: "Acme Co",
      primary_color: "#0f766e",
      secondary_color: "#ca8a04",
      logo_url: "https://example.com/logo.png",
      support_email: "not-an-email",
    })
    expect(result.meetsMinimumForCheckout).toBe(false)
  })
})
