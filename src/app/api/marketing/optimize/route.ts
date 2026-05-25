import {NextRequest, NextResponse} from "next/server";

import {getSession} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {optimizeActiveCampaigns} from "@/lib/marketing/campaign-optimizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Runs the optimization cycle across active Google and Meta ad campaigns.
 * Can be triggered via dashboard or cron (authenticating via secret token).
 */
export async function POST(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const token = searchParams.get("token");

    // Authenticate: either via cron token or session auth
    const cronSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.OUSTAND_API_KEY;
    const isCronAuthorized = !!(token && cronSecret && token === cronSecret);

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
    console.error("Optimization trigger route error:", error);
    return NextResponse.json({error: error.message || "Internal Server Error"}, {status: 500});
  }
}
