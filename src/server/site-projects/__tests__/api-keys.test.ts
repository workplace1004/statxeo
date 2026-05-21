import {describe, expect, it} from "vitest";

import {createApiKeyInputSchema, updateApiKeyInputSchema} from "../api-key-schemas";

describe("api key write validation", () => {
  it("requires orgId when creating an api key", () => {
    const parsed = createApiKeyInputSchema.safeParse({scopes: ["generation.enqueue"]});
    expect(parsed.success).toBe(false);
  });

  it("accepts valid create payloads", () => {
    const parsed = createApiKeyInputSchema.safeParse({
      orgId: "org_123",
      scopes: ["generation.enqueue"],
    });
    expect(parsed.success).toBe(true);
  });

  it("allows patch payloads to revoke or update org-scoped keys", () => {
    expect(updateApiKeyInputSchema.safeParse({revoke: true}).success).toBe(true);
    expect(
      updateApiKeyInputSchema.safeParse({orgId: "org_123", scopes: ["reconcile.run"]}).success,
    ).toBe(true);
  });
});