import {describe, expect, it} from "vitest";

import {canPerform} from "../permissions";

describe("tenant isolation (authorization matrix)", () => {
  it("affiliate cannot read or mutate site projects", () => {
    expect(canPerform("affiliate", "project.read")).toBe(false);
    expect(canPerform("affiliate", "project.update")).toBe(false);
    expect(canPerform("affiliate", "publish.execute")).toBe(false);
  });

  it("customer cannot use operator tools", () => {
    expect(canPerform("customer", "operator.retry")).toBe(false);
    expect(canPerform("customer", "operator.releaseLease")).toBe(false);
  });

  it("api_key cannot publish without scope", () => {
    expect(canPerform("api_key", "publish.execute")).toBe(false);
    expect(canPerform("api_key", "reconcile.run")).toBe(true);
  });
});
