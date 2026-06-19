import {NextRequest, NextResponse} from "next/server";
import {ObjectId} from "mongodb";

import {collections} from "@/server/db/collections";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {serializeCampaign, campaignInputSchema} from "@/server/db/schemas/campaigns";
import {serializeWorkflowExecution} from "@/server/db/schemas/workflow-executions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Fetch campaigns for the current authenticated White Labeler or Client Org.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId: agencyOrgId} = auth.ctx!;

    const {searchParams} = new URL(request.url);
    const clientOrgId = searchParams.get("clientOrgId");
    const includeAudit = searchParams.get("audit") === "true";

    const query: Record<string, any> = {whiteLabelerId: agencyOrgId};
    if (clientOrgId) {
      query.clientOrgId = clientOrgId;
    }

    const campaignCol = await collections.campaigns();
    const campaignDocs = await campaignCol.find(query).sort({createdAt: -1}).toArray();
    const campaigns = campaignDocs.map(serializeCampaign);

    let auditLogs: any[] = [];
    if (includeAudit) {
      const execCol = await collections.workflowExecutions();
      const execDocs = await execCol
        .find({whiteLabelerId: agencyOrgId})
        .sort({createdAt: -1})
        .limit(100)
        .toArray();
      auditLogs = execDocs.map(serializeWorkflowExecution);
    }

    return NextResponse.json({data: campaigns, auditLogs});
  } catch (error: any) {
    console.error("GET Campaigns error:", error);
    return NextResponse.json({error: error.message || "Internal Server Error"}, {status: 500});
  }
}

/**
 * POST: Create a new marketing campaign in MongoDB, and optionally provision it on Google/Meta.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId: agencyOrgId, session} = auth.ctx!;

    const body = await request.json();
    const {campaignName, channel, dailyBudget, totalAllocated, keywords, creatives, clientOrgId} = body;

    if (!campaignName || !channel || !dailyBudget || !totalAllocated || !clientOrgId) {
      return NextResponse.json(
        {error: "Missing required fields: campaignName, channel, dailyBudget, totalAllocated, clientOrgId"},
        {status: 400},
      );
    }

    // 1. Insert campaign document to MongoDB using native campaigns collection
    const campaignCol = await collections.campaigns();
    const campaignId = new ObjectId();
    const now = new Date();

    const newCampaignDoc = {
      _id: campaignId,
      clientOrgId,
      whiteLabelerId: agencyOrgId,
      campaignName,
      channel,
      budget: {
        dailyLimit: Number(dailyBudget),
        totalAllocated: Number(totalAllocated),
        spendToDate: 0,
      },
      status: "pending_approval" as const,
      keywords: keywords || [],
      creatives: (creatives || []).map((c: any) => ({
        type: c.type,
        url: c.url,
        headline: c.headline,
        description: c.description,
        ctr: Number(c.ctr || 0),
        conversionRate: Number(c.conversionRate || 0),
        spend: Number(c.spend || 0),
        status: (c.status || "draft") as any,
      })),
      guardrails: {
        maxDailyDrift: 0.2,
        autoPauseFatigueScore: 0.8,
      },
      performanceHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    // Run validation
    const validated = campaignInputSchema.safeParse(newCampaignDoc);
    if (!validated.success) {
      return NextResponse.json(
        {error: "Invalid campaign schema", details: validated.error.format()},
        {status: 400},
      );
    }

    await campaignCol.insertOne(newCampaignDoc);

    // 1B. Create a pending Approval record so it appears in the approvals queue
    const approvalsCol = await collections.approvals();
    const customersCol = await collections.customers();
    let customerName = "Unknown Client";
    let customerAvatar = null;
    try {
      const customer = await customersCol.findOne({_id: new ObjectId(clientOrgId)});
      if (customer) {
        customerName = customer.name;
        customerAvatar = customer.avatar;
      }
    } catch (e) {
      console.error("Failed to find customer details for campaign draft approval:", e);
    }

    await approvalsCol.insertOne({
      orgId: agencyOrgId,
      customerId: clientOrgId,
      customerName,
      customerAvatar,
      kind: "ads" as const,
      summary: `Approve and launch new campaign: "${campaignName}" (${channel === "meta" ? "Meta" : "Google"} Ads, Daily Budget: $${dailyBudget})`,
      count: 1,
      payloadRef: campaignId.toHexString(),
      requestedBy: session.email,
      requestedAt: now,
      dueAt: null,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
      meta: {
        actionType: "activate_campaign",
        campaignId: campaignId.toHexString(),
      },
    } as any);

    // 2. Log workflow execution step in MongoDB
    const execCol = await collections.workflowExecutions();
    await execCol.insertOne({
      _id: new ObjectId(),
      campaignId: campaignId.toHexString(),
      whiteLabelerId: agencyOrgId,
      workflowType: "ad_campaign",
      status: "completed",
      stage: "campaign_drafted",
      history: [{stage: "campaign_drafted", status: "completed", transitionedAt: now}],
      snapshots: [],
      auditLogs: [
        {
          timestamp: now,
          actor: "user",
          action: "draft_campaign",
          description: `Campaign "${campaignName}" drafted successfully by User ${session.email} (Pending manual agency/client approval).`,
          meta: {channel, dailyBudget, totalAllocated},
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    const createdCampaign = serializeCampaign(newCampaignDoc);
    return NextResponse.json({data: createdCampaign}, {status: 201});
  } catch (error: any) {
    console.error("POST Campaigns error:", error);
    return NextResponse.json({error: error.message || "Internal Server Error"}, {status: 500});
  }
}
