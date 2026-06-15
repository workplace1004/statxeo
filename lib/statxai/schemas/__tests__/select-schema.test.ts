import { describe, it, expect } from "vitest"
import { selectContentSchema } from "../index"
import { LanderContentSchema } from "../lander-content"
import { CoreContentSchema } from "../core-content"
import { TitanContentSchema } from "../titan-content"

describe("selectContentSchema", () => {
  it("returns LanderContentSchema for lander-default", () => {
    expect(selectContentSchema("lander-default")).toBe(LanderContentSchema)
  })

  it("returns CoreContentSchema for core-default", () => {
    expect(selectContentSchema("core-default")).toBe(CoreContentSchema)
  })

  it("returns TitanContentSchema for titan-default", () => {
    expect(selectContentSchema("titan-default")).toBe(TitanContentSchema)
  })

  it("falls back to LanderContentSchema for unknown template", () => {
    expect(selectContentSchema("unknown-template")).toBe(LanderContentSchema)
  })
})
