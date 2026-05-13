import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createWhiteLabelerSocialAuthState,
  parseWhiteLabelerSocialAuthState,
} from "../white-labeler-social-auth"

describe("white-labeler social auth state", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("round-trips a valid signed state payload", () => {
    vi.stubEnv("WHITE_LABELER_SOCIAL_STATE_SECRET", "test-secret")

    const token = createWhiteLabelerSocialAuthState({
      whiteLabelerId: "wl_123",
      userId: "user_456",
      provider: "linkedin",
      issuedAt: 1_700_000_000_000,
    })

    expect(
      parseWhiteLabelerSocialAuthState(token, {
        now: 1_700_000_000_000 + 60_000,
      }),
    ).toEqual({
      whiteLabelerId: "wl_123",
      userId: "user_456",
      provider: "linkedin",
      issuedAt: 1_700_000_000_000,
    })
  })

  it("rejects tampered state payloads", () => {
    vi.stubEnv("WHITE_LABELER_SOCIAL_STATE_SECRET", "test-secret")

    const token = createWhiteLabelerSocialAuthState({
      whiteLabelerId: "wl_123",
      userId: "user_456",
      provider: "facebook",
      issuedAt: 1_700_000_000_000,
    })

    const [payload, signature] = token.split(".")
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        whiteLabelerId: "wl_other",
        userId: "user_456",
        provider: "facebook",
        issuedAt: 1_700_000_000_000,
      }),
      "utf8",
    ).toString("base64url")

    expect(parseWhiteLabelerSocialAuthState(`${tamperedPayload}.${signature}`)).toBeNull()
    expect(parseWhiteLabelerSocialAuthState(`${payload}.invalid-signature`)).toBeNull()
  })

  it("rejects expired state payloads", () => {
    vi.stubEnv("WHITE_LABELER_SOCIAL_STATE_SECRET", "test-secret")

    const token = createWhiteLabelerSocialAuthState({
      whiteLabelerId: "wl_123",
      userId: "user_456",
      provider: "youtube",
      issuedAt: 1_700_000_000_000,
    })

    expect(
      parseWhiteLabelerSocialAuthState(token, {
        now: 1_700_000_000_000 + 11 * 60 * 1000,
      }),
    ).toBeNull()
  })
})