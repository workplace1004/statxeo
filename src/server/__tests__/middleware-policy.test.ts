import {describe, expect, it} from "vitest";

import {resolveApiRateLimitBucket} from "@/lib/rate-limit";
import {isInternalApiPath, isPublicApiPath} from "@/middleware";

describe("middleware API policy", () => {
  it("marks oauth entrypoints as public", () => {
    expect(isPublicApiPath("/api/integrations/google")).toBe(true);
    expect(isPublicApiPath("/api/integrations/google/callback")).toBe(true);
    expect(isPublicApiPath("/api/site-projects")).toBe(false);
  });

  it("marks internal routes including admin timeline as internal-only", () => {
    expect(isInternalApiPath("/api/admin/ensure-indexes")).toBe(true);
    expect(isInternalApiPath("/api/admin/site-projects/jobs/job_123/timeline")).toBe(true);
    expect(isInternalApiPath("/api/site-projects/reconcile")).toBe(true);
    expect(isInternalApiPath("/api/site-projects/abc/trigger")).toBe(false);
  });

  it("classifies rate limit buckets by route", () => {
    expect(resolveApiRateLimitBucket("/api/integrations/google")).toBe("auth");
    expect(resolveApiRateLimitBucket("/api/social/callback")).toBe("auth");
    expect(resolveApiRateLimitBucket("/api/health/db")).toBe("health");
    expect(resolveApiRateLimitBucket("/api/ai/generate")).toBe("internal");
    expect(resolveApiRateLimitBucket("/api/site-projects/abc/trigger")).toBe("ai");
  });
});