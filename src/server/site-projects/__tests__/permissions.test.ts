import {describe, expect, it} from "vitest";

import {assertPermission, canPerform} from "../permissions";

describe("permissions matrix", () => {
  it("customer can read and enqueue but not publish", () => {
    expect(canPerform("customer", "project.read")).toBe(true);
    expect(canPerform("customer", "generation.enqueue")).toBe(true);
    expect(canPerform("customer", "publish.execute")).toBe(false);
  });

  it("affiliate has no site-project actions", () => {
    expect(canPerform("affiliate", "project.read")).toBe(false);
  });

  it("agency can publish", () => {
    expect(canPerform("agency", "publish.execute")).toBe(true);
  });
});

describe("assertPermission scope enforcement", () => {
  const apiKeyCtx = (scopes: string[]) => ({
    principal: "api_key" as const,
    apiKeyScopes: scopes,
  });

  it("wildcard scope allows any action in the matrix", () => {
    expect(() => assertPermission(apiKeyCtx(["*"]), "generation.enqueue")).not.toThrow();
    expect(() => assertPermission(apiKeyCtx(["*"]), "reconcile.run")).not.toThrow();
  });

  it("specific scope only allows matching action", () => {
    expect(() => assertPermission(apiKeyCtx(["generation.enqueue"]), "generation.enqueue")).not.toThrow();
    expect(() => assertPermission(apiKeyCtx(["generation.enqueue"]), "reconcile.run")).toThrow();
  });

  it("missing scope throws forbidden even if action is in matrix", () => {
    expect(() => assertPermission(apiKeyCtx(["reconcile.run"]), "generation.enqueue")).toThrow();
  });

  it("principal without action in matrix throws regardless of scopes", () => {
    const sessionCtx = {principal: "customer" as const, apiKeyScopes: [] as string[]};
    // customer cannot publish even with scopes
    expect(() => assertPermission(sessionCtx, "publish.execute")).toThrow();
  });

  it("session user principals ignore scope checks entirely", () => {
    const agencyCtx = {principal: "agency" as const, apiKeyScopes: [] as string[]};
    expect(() => assertPermission(agencyCtx, "publish.execute")).not.toThrow();
  });
});
