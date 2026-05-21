import {describe, expect, it} from "vitest";

import {hasApiKeyProjectAccess} from "../access";

describe("api key project org access", () => {
  it("allows access when api key org matches project org", () => {
    expect(hasApiKeyProjectAccess("org_123", "org_123")).toBe(true);
  });

  it("denies access when api key org differs", () => {
    expect(hasApiKeyProjectAccess("org_123", "org_456")).toBe(false);
  });

  it("denies access when api key org is missing", () => {
    expect(hasApiKeyProjectAccess(null, "org_456")).toBe(false);
  });
});