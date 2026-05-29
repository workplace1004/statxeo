import {timingSafeEqual} from "node:crypto";
import {NextRequest, NextResponse} from "next/server";

import {getSession} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {optimizeActiveCampaigns} from "@/lib/marketing/campaign-optimizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Runs the optimization cycle across active Google and Meta ad campaigns.
 * Can be triggered via dashboard or cron (authenticating via secret token).
 *
 * AI Safety: session-authenticated callers must have `modify_billing` permission
 * (agency_owner, billing_manager, or platform_admin) — enforced via assertCanModifyBilling.
 */
export async function POST(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const token = searchParams.get("token");

    // Authenticate: either via cron token or session auth.
    // Use timingSafeEqual to prevent timing-attack on the secret comparison.
    const cronSecret = process.env.AUTH_SESSION_SECRET;
    let isCronAuthorized = false;
    if (token && cronSecret) {
      try {
        const a = Buffer.from(token);
        const b = Buffer.from(cronSecret);
        isCronAuthorized = a.length === b.length && timingSafeEqual(a, b);
      } catch {
        isCronAuthorized = false;
      }
    }

    if (!isCronAuthorized) {
      const session = await getSession();
      if (!session || session.persona !== "white-label") {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
      }

      const users = await collections.users();
      const user = await users.findOne({email: session.email.toLowerCase()});
      const agencyOrgId = user?.organizationId;
      if (!agencyOrgId) {
        return NextResponse.json({error: "Forbidden: No agency organization found."}, {status: 403});
      }

      // ── AI Safety Guard ────────────────────────────────────────────────────
      // Only roles with modify_billing may trigger budget reallocation.
      // This prevents agency_staff, content_reviewer, or members from
      // triggering spend changes on live ad campaigns.
      const {assertCanModifyBilling} = await import("@/server/ai/safety");
      await assertCanModifyBilling({
        role: user.role,
        actorEmail: session.email,
      });
    }

    console.log("[CampaignOptimizer] Running automated campaign optimization cycle...");
    const results = await optimizeActiveCampaigns();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      optimizedCount: results.length,
      results,
    });
  } catch (error: any) {
    // Surface AI safety and permission errors cleanly
    if (error?.status === 403) {
      return NextResponse.json(
        {ok: false, error: {code: error.code ?? "FORBIDDEN", message: error.message}},
        {status: 403},
      );
    }
    console.error("Optimization trigger route error:", error);
    return NextResponse.json({error: error.message || "Internal Server Error"}, {status: 500});
  }
}
