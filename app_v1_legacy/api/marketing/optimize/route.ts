import { NextRequest, NextResponse } from "next/server";
import { optimizeActiveCampaigns } from "@/lib/marketing/campaign-optimizer";
import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST: Runs the optimization cycle across active Google and Meta ad campaigns.
 * Can be triggered via dashboard or cron (authenticating via secret token).
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Authenticate: either via cron token or session auth
    const cronSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.OUSTAND_API_KEY;
    const isCronAuthorized = token && cronSecret && token === cronSecret;

    if (!isCronAuthorized) {
      const authContext = await getAuthenticatedWhiteLabeler();
      if (authContext instanceof NextResponse) {
        return authContext; // Propagate unauthorized/forbidden
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
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
