import { describe, it, expect } from "vitest"
import { WebsitePreferencesSchema, NormalizedIntakeSchema } from "../intake"

describe("WebsitePreferencesSchema", () => {
  it("accepts valid offeredServices", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: ["AC Repair", "Duct Cleaning", "Furnace Install"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices).toEqual(["AC Repair", "Duct Cleaning", "Furnace Install"])
    }
  })

  it("rejects offeredServices exceeding max 12", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: Array.from({ length: 13 }, (_, i) => `Service ${i}`),
    })
    expect(result.success).toBe(false)
  })

  it("trims offeredServices entries", () => {
    const result = WebsitePreferencesSchema.safeParse({
      offeredServices: ["  AC Repair  "],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices![0]).toBe("AC Repair")
    }
  })

  it("keeps uniqueSellingPoints and offeredServices independent", () => {
    const result = WebsitePreferencesSchema.safeParse({
      uniqueSellingPoints: ["Licensed & Insured"],
      offeredServices: ["AC Repair"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.uniqueSellingPoints).toEqual(["Licensed & Insured"])
      expect(result.data.offeredServices).toEqual(["AC Repair"])
    }
  })
})

describe("NormalizedIntakeSchema", () => {
  const baseIntake = {
    businessName: "Smith HVAC",
    ownerFullName: "John Smith",
    packageTier: "statxeo_core",
  }

  it("accepts offeredServices in normalized intake", () => {
    const result = NormalizedIntakeSchema.safeParse({
      ...baseIntake,
      offeredServices: ["AC Repair", "Heating"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.offeredServices).toEqual(["AC Repair", "Heating"])
    }
  })

  it("accepts normalized intake without offeredServices", () => {
    const result = NormalizedIntakeSchema.safeParse(baseIntake)
    expect(result.success).toBe(true)
  })
})
