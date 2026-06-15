import { describe, it, expect } from "vitest"
import { slugify, dedupeSlugList, labelToSlugMap } from "../slugify"

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("AC Repair")).toBe("ac-repair")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("HVAC  &  Plumbing")).toBe("hvac-plumbing")
  })

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  hello world  ")).toBe("hello-world")
  })

  it("strips multiple leading/trailing hyphens", () => {
    expect(slugify("---hello world---")).toBe("hello-world")
  })

  it("handles special characters", () => {
    expect(slugify("Air-Conditioning (Residential)")).toBe("air-conditioning-residential")
  })

  it("truncates to 60 chars", () => {
    const long = "a".repeat(70)
    expect(slugify(long)).toHaveLength(60)
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles numbers", () => {
    expect(slugify("24/7 Emergency Service")).toBe("24-7-emergency-service")
  })
})

describe("dedupeSlugList", () => {
  it("generates unique slugs for unique labels", () => {
    const result = dedupeSlugList(["AC Repair", "Heating", "Duct Cleaning"])
    expect(result).toEqual(["ac-repair", "heating", "duct-cleaning"])
  })

  it("deduplicates collisions with numeric suffix", () => {
    const result = dedupeSlugList(["AC Repair", "AC Repair", "AC Repair"])
    expect(result[0]).toBe("ac-repair")
    expect(result[1]).toBe("ac-repair-2")
    expect(result[2]).toBe("ac-repair-3")
    expect(new Set(result).size).toBe(3)
  })

  it("deduplicates near-collisions", () => {
    const result = dedupeSlugList(["HVAC Service", "HVAC  Service"])
    expect(new Set(result).size).toBe(2)
    expect(result[0]).toBe("hvac-service")
    expect(result[1]).toBe("hvac-service-2")
  })

  it("preserves insertion order", () => {
    const labels = ["Plumbing", "Electrical", "HVAC"]
    const result = dedupeSlugList(labels)
    expect(result).toEqual(["plumbing", "electrical", "hvac"])
  })
})

describe("labelToSlugMap", () => {
  it("creates a map from label to slug", () => {
    const result = labelToSlugMap(["AC Repair", "Heating", "Duct Cleaning"])
    expect(result.get("AC Repair")).toBe("ac-repair")
    expect(result.get("Heating")).toBe("heating")
    expect(result.get("Duct Cleaning")).toBe("duct-cleaning")
  })

  it("handles near-collision labels", () => {
    const result = labelToSlugMap(["HVAC Service", "HVAC  Service"])
    expect(result.get("HVAC Service")).toBe("hvac-service")
    expect(result.get("HVAC  Service")).toBe("hvac-service-2")
  })
})
