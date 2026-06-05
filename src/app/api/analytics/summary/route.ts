import "server-only";
import {NextRequest, NextResponse} from "next/server";

import {collections} from "@/server/db/collections";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import type {PerformanceHistory} from "@/server/db/schemas/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/summary?range=7D|30D|90D|12M
 *
 * Returns aggregated KPIs and trend data for the white-label operator's
 * entire client portfolio:
 *   - Sessions (sum from performance history)
 *   - Ad Spend (from campaigns)
 *   - Active Campaigns
 *   - Social Posts published
 *   - Channel split (Meta vs Google)
 *   - Spend trend (daily buckets for the chosen range)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId} = auth.ctx!;
    const rangeParam = request.nextUrl.searchParams.get("range") ?? "30D";
    const daysMap: Record<string, number> = {"7D": 7, "30D": 30, "90D": 90, "12M": 365};
    const days = daysMap[rangeParam] ?? 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ── Campaigns ──────────────────────────────────────────────────────────
    const campaignsCol = await collections.campaigns();
    const allCampaigns = await campaignsCol.find({whiteLabelerId: orgId}).toArray();
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");

    // Aggregate spend + impressions + clicks from performanceHistory within range
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let metaSpend = 0;
    let googleSpend = 0;

    // Build daily spend trend map
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < Math.min(days, 30); i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }

    for (const campaign of allCampaigns) {
      const history = (campaign.performanceHistory ?? []).filter(
        (h: PerformanceHistory) => new Date(h.date) >= since,
      );
      for (const h of history) {
        totalSpend += h.spend ?? 0;
        totalImpressions += h.impressions ?? 0;
        totalClicks += h.clicks ?? 0;
        totalConversions += h.conversions ?? 0;
        if (campaign.channel === "meta") metaSpend += h.spend ?? 0;
        if (campaign.channel === "google") googleSpend += h.spend ?? 0;
        const key = new Date(h.date).toISOString().slice(0, 10);
        if (key in trendMap) trendMap[key] += h.spend ?? 0;
      }
    }

    const spendTrend = Object.entries(trendMap).map(([date, spend]) => ({
      date: date.slice(5), // MM-DD
      spend: Math.round(spend * 100) / 100,
    }));

    // ── Social Posts ───────────────────────────────────────────────────────
    const socialCol = await collections.socialPosts();
    const publishedPosts = await socialCol.countDocuments({
      orgId,
      status: "Published",
      publishedAt: {$gte: since},
    });

    // ── Workflow Executions ────────────────────────────────────────────────
    const workflowsCol = await collections.workflowExecutions();
    const completedWorkflows = await workflowsCol.countDocuments({
      whiteLabelerId: orgId,
      status: "completed",
      createdAt: {$gte: since},
    });

    // ── Customers ──────────────────────────────────────────────────────────
    const customersCol = await collections.customers();
    const totalCustomers = await customersCol.countDocuments({whiteLabelerId: orgId});

    // ── Channel split for pie chart ────────────────────────────────────────
    const channelSplit = [
      {name: "Meta Ads", value: Math.round(metaSpend * 100) / 100},
      {name: "Google Ads", value: Math.round(googleSpend * 100) / 100},
    ].filter((c) => c.value > 0);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return NextResponse.json({
      ok: true,
      range: rangeParam,
      kpis: {
        totalSpend: Math.round(totalSpend * 100) / 100,
        activeCampaigns: activeCampaigns.length,
        totalCustomers,
        publishedPosts,
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: Math.round(ctr * 100) / 100,
        completedWorkflows,
      },
      charts: {
        spendTrend,
        channelSplit,
      },
    });
  } catch (err: any) {
    console.error("[analytics/summary] error:", err);
    return NextResponse.json({ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, {status: 500});
  }
}
