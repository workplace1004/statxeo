import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db/mongodb";
import Campaign from "@/lib/db/models/campaign";
import WorkflowExecution from "@/lib/db/models/workflow-execution";
import { getAuthenticatedWhiteLabeler } from "@/lib/statxeo/white-labeler-server";
import { MetaAdsClient } from "@/lib/marketing/meta-ads";
import { GoogleAdsClient } from "@/lib/marketing/google-ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Fetch campaigns for the current authenticated White Labeler or Client Org.
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthenticatedWhiteLabeler();
    if (authContext instanceof NextResponse) {
      return authContext; // Propagate unauthorized/forbidden response
    }

    const { searchParams } = new URL(request.url);
    const clientOrgId = searchParams.get("clientOrgId");
    const includeAudit = searchParams.get("audit") === "true";

    await connectToDatabase();

    const query: Record<string, any> = { whiteLabelerId: authContext.whiteLabelerId };
    if (clientOrgId) {
      query.clientOrgId = clientOrgId;
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    let auditLogs: any[] = [];
    if (includeAudit) {
      auditLogs = await WorkflowExecution.find({ whiteLabelerId: authContext.whiteLabelerId })
        .sort({ createdAt: -1 })
        .limit(100);
    }

    return NextResponse.json({ data: campaigns, auditLogs });
  } catch (error: any) {
    console.error("GET Campaigns error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST: Create a new marketing campaign in MongoDB, and optionally provision it on Google/Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthenticatedWhiteLabeler();
    if (authContext instanceof NextResponse) {
      return authContext;
    }

    const body = await request.json();
    const { campaignName, channel, dailyBudget, totalAllocated, keywords, creatives, clientOrgId } = body;

    if (!campaignName || !channel || !dailyBudget || !totalAllocated || !clientOrgId) {
      return NextResponse.json(
        { error: "Missing required fields: campaignName, channel, dailyBudget, totalAllocated, clientOrgId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Save campaign document to MongoDB
    const campaign = await Campaign.create({
      clientOrgId,
      whiteLabelerId: authContext.whiteLabelerId,
      campaignName,
      channel,
      budget: {
        dailyLimit: dailyBudget,
        totalAllocated,
        spendToDate: 0,
      },
      status: "pending_approval", // Safety Check: requires approval
      keywords: keywords || [],
      creatives: creatives || [],
      guardrails: {
        maxDailyDrift: 0.2,
        autoPauseFatigueScore: 0.8,
      },
      performanceHistory: [],
    });

    // 2. Log workflow execution step in MongoDB
    await WorkflowExecution.create({
      campaignId: campaign._id.toString(),
      whiteLabelerId: authContext.whiteLabelerId,
      workflowType: "ad_campaign",
      status: "completed",
      stage: "campaign_drafted",
      history: [
        { stage: "campaign_drafted", status: "completed", transitionedAt: new Date() }
      ],
      auditLogs: [
        {
          timestamp: new Date(),
          actor: "user",
          action: "draft_campaign",
          description: `Campaign "${campaignName}" drafted successfully by User ${authContext.user.email} (Pending manual agency/client approval).`,
          meta: { channel, dailyBudget, totalAllocated },
        },
      ],
    });

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error: any) {
    console.error("POST Campaigns error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
