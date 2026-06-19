import {NextRequest, NextResponse} from "next/server";
import {ObjectId} from "mongodb";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";
import {serializeApproval} from "@/server/db/schemas/approvals";
import {assertCan} from "@/server/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Fetch pending approvals for the current authenticated White Labeler org.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId} = auth.ctx!;

    const approvalsCol = await collections.approvals();
    const docs = await approvalsCol
      .find({
        orgId,
        status: "pending",
      })
      .sort({dueAt: 1, requestedAt: -1})
      .toArray();

    return NextResponse.json({
      ok: true,
      approvals: docs.map((doc) => ({
        ...serializeApproval(doc),
        customerId: doc.customerId,
        payloadRef: doc.payloadRef,
        requestedAt: doc.requestedAt ? doc.requestedAt.toISOString() : null,
        meta: (doc as any).meta || null,
      })),
    });
  } catch (err: any) {
    console.error("GET Approvals error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}

/**
 * POST: Process (Approve or Reject) an approval request.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedWhiteLabeler(request);
    if (auth.errorResponse) return auth.errorResponse;
    const {orgId, user, session} = auth.ctx!;

    // Enforce role permission: Must have manage_campaigns (agency_owner, agency_staff, or platform_admin)
    assertCan(user.role, "manage_campaigns");

    const body = await request.json();
    const {approvalId, action} = body;

    if (!approvalId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing or invalid parameters: approvalId, action"}},
        {status: 400}
      );
    }

    if (!ObjectId.isValid(approvalId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid approvalId format"}},
        {status: 400}
      );
    }

    const approvalsCol = await collections.approvals();
    const approval = await approvalsCol.findOne({
      _id: new ObjectId(approvalId),
      orgId,
    });

    if (!approval) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Approval not found or unauthorized"}},
        {status: 404}
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Approval has already been processed"}},
        {status: 400}
      );
    }

    const now = new Date();

    if (action === "reject") {
      await approvalsCol.updateOne(
        {_id: approval._id},
        {
          $set: {
            status: "rejected",
            updatedAt: now,
          },
        }
      );

      // If campaign draft is rejected, we set campaign status to failed / rejected
      if (approval.kind === "ads" && approval.payloadRef) {
        const meta = (approval as any).meta || {};
        if (meta.actionType === "activate_campaign") {
          const campaignsCol = await collections.campaigns();
          await campaignsCol.updateOne(
            {_id: new ObjectId(approval.payloadRef)},
            {$set: {status: "failed", updatedAt: now}}
          );

          const execCol = await collections.workflowExecutions();
          await execCol.insertOne({
            _id: new ObjectId(),
            campaignId: approval.payloadRef,
            whiteLabelerId: orgId,
            workflowType: "ad_campaign",
            status: "failed",
            stage: "campaign_rejected",
            history: [{stage: "campaign_rejected", status: "failed", transitionedAt: now}],
            snapshots: [],
            auditLogs: [
              {
                timestamp: now,
                actor: "user",
                action: "reject_campaign",
                description: `Campaign draft rejected by User ${session.email}.`,
              },
            ],
            createdAt: now,
            updatedAt: now,
          } as any);
        }
      }

      return NextResponse.json({ok: true});
    }

    // action === "approve"
    await approvalsCol.updateOne(
      {_id: approval._id},
      {
        $set: {
          status: "approved",
          updatedAt: now,
        },
      }
    );

    // Apply mutations based on the approval type
    if (approval.kind === "ads" && approval.payloadRef) {
      const meta = (approval as any).meta || {};
      const campaignsCol = await collections.campaigns();
      const execCol = await collections.workflowExecutions();
      const campaignId = new ObjectId(approval.payloadRef);

      const campaign = await campaignsCol.findOne({_id: campaignId});
      if (!campaign) {
        return NextResponse.json(
          {ok: false, error: {code: "NOT_FOUND", message: "Associated campaign not found"}},
          {status: 404}
        );
      }

      if (meta.actionType === "activate_campaign" || campaign.status === "pending_approval") {
        // Activate campaign draft
        await campaignsCol.updateOne(
          {_id: campaignId},
          {
            $set: {
              status: "active",
              updatedAt: now,
            },
          }
        );

        await execCol.insertOne({
          _id: new ObjectId(),
          campaignId: approval.payloadRef,
          whiteLabelerId: orgId,
          workflowType: "ad_campaign",
          status: "completed",
          stage: "campaign_activated",
          history: [{stage: "campaign_activated", status: "completed", transitionedAt: now}],
          snapshots: [],
          auditLogs: [
            {
              timestamp: now,
              actor: "user",
              action: "activate_campaign",
              description: `Campaign "${campaign.campaignName}" approved and activated by User ${session.email}.`,
            },
          ],
          createdAt: now,
          updatedAt: now,
        } as any);
      } else if (meta.actionType === "pause_creative") {
        // Pause fatigued creative
        const creativeUrl = meta.creativeUrl;
        let updated = false;

        const updatedCreatives = (campaign.creatives || []).map((cr) => {
          if (cr.url === creativeUrl) {
            cr.status = "paused";
            updated = true;
          }
          return cr;
        });

        if (updated) {
          await campaignsCol.updateOne(
            {_id: campaignId},
            {
              $set: {
                creatives: updatedCreatives,
                updatedAt: now,
              },
            }
          );

          await execCol.insertOne({
            _id: new ObjectId(),
            campaignId: approval.payloadRef,
            whiteLabelerId: orgId,
            workflowType: "ad_campaign",
            status: "completed",
            stage: "creative_paused",
            history: [{stage: "creative_paused", status: "completed", transitionedAt: now}],
            snapshots: [],
            auditLogs: [
              {
                timestamp: now,
                actor: "user",
                action: "pause_creative",
                description: `Creative paused by User ${session.email} based on AI fatigue recommendation.`,
                meta: {creativeUrl},
              },
            ],
            createdAt: now,
            updatedAt: now,
          } as any);
        }
      }
    }

    return NextResponse.json({ok: true});
  } catch (error: any) {
    if (error?.status === 403 || error?.name === "PermissionError") {
      return NextResponse.json(
        {ok: false, error: {code: "FORBIDDEN", message: error.message || "Unauthorized action"}},
        {status: 403}
      );
    }
    console.error("POST Approvals error:", error);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: error.message || "Internal server error"}},
      {status: 500}
    );
  }
}
