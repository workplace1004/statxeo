import {describe, expect, it} from "vitest";

import {SiteProjectsError} from "../errors";
import {assertJobTransition, assertRevisionTransition} from "../state-machine";

describe("state-machine", () => {
  it("allows queued → running", () => {
    expect(() => assertJobTransition("queued", "running")).not.toThrow();
  });

  it("rejects failed → published style illegal job transition", () => {
    expect(() => assertJobTransition("failed", "completed")).toThrow(SiteProjectsError);
  });

  it("allows generated_draft → preview_snapshot", () => {
    expect(() => assertRevisionTransition("generated_draft", "preview_snapshot")).not.toThrow();
  });

  it("rejects generated_draft → published_revision", () => {
    expect(() =>
      assertRevisionTransition("generated_draft", "published_revision"),
    ).toThrow(SiteProjectsError);
  });
});
