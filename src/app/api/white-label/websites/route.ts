import {NextRequest, NextResponse} from "next/server";
import {ObjectId} from "mongodb";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";
import {siteProjectCollections} from "@/server/site-projects/collections";
import {createProjectFromPaidLead} from "@/server/site-projects/statxai-store";
import {createGenerationJob} from "@/server/site-projects/repositories";
import {runGenerationJob} from "@/lib/statxai/orchestrator";
import {appendGenerationEvent} from "@/server/site-projects/events";
import {appendLedgerEvent} from "@/server/site-projects/ledger";
import {insertOutbox} from "@/server/site-projects/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId, user} = ctx!;

    const body = await request.json();
    const {businessName, domain, brief} = body;

    if (!businessName?.trim()) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "businessName is required"}},
        {status: 400}
      );
    }

    const siteDomain = domain?.trim() || `${businessName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}.statxeo.site`;
    const now = new Date();

    // 1. Create reseller site record in the 'sites' collection
    const sitesCol = await collections.sites();
    const siteRes = await sitesCol.insertOne({
      agencyOrgId: orgId,
      customerId: null,
      customerName: businessName.trim(),
      customerAvatar: null,
      name: businessName.trim(),
      domain: siteDomain,
      themeId: null,
      themeLabel: "AI Draft",
      status: "Generating",
      pages: 0,
      lastPublishedAt: null,
      monthlyVisits: 0,
      previewUrl: null,
      tier: "Standard",
      createdAt: now,
      updatedAt: now,
    } as any);
    const siteId = siteRes.insertedId.toHexString();

    // 2. Insert a paid lead into 'siteLeads'
    const leadsCol = await siteProjectCollections.siteLeads();
    const leadRes = await leadsCol.insertOne({
      orgId,
      contactEmail: user.email,
      contactName: user.name || "Agency Operator",
      contactPhone: null,
      status: "paid",
      packageTier: "statxeo_core",
      businessName: businessName.trim(),
      ownerFullName: user.name || "Agency Operator",
      intakeJson: {businessName: businessName.trim(), brief: brief?.trim() || ""},
      purchasedAt: now,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    } as any);
    const leadId = leadRes.insertedId;

    // 3. Link the lead to the user in 'customerLeadLinks'
    const leadLinksCol = await siteProjectCollections.customerLeadLinks();
    await leadLinksCol.insertOne({
      userId: user._id.toHexString(),
      leadId: leadId.toHexString(),
      orgId,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    } as any);

    // 4. Initialize the project schema
    const projectId = await createProjectFromPaidLead({
      _id: leadId,
      orgId,
      packageTier: "statxeo_core",
      businessName: businessName.trim(),
      contactName: user.name || "Agency Operator",
      contactEmail: user.email,
      contactPhone: null,
      intakeJson: {businessName: businessName.trim(), brief: brief?.trim() || ""},
    });

    // 5. Update the project and intake submissions with creative brief / target audience details
    const siteProjectColl = await siteProjectCollections.siteProjects();
    await siteProjectColl.updateOne(
      {_id: new ObjectId(projectId)},
      {
        $set: {
          status: "ready_for_generation",
          targetAudience: brief?.trim() || "",
          updatedAt: now,
        },
      }
    );

    const intakeColl = await siteProjectCollections.siteIntakeSubmissions();
    await intakeColl.updateOne(
      {projectId},
      {
        $set: {
          normalizedPayload: {
            businessName: businessName.trim(),
            ownerFullName: user.name || "Agency Operator",
            email: user.email,
            packageTier: "statxeo_core",
            targetAudience: brief?.trim() || "",
          },
          rawPayload: {
            businessName: businessName.trim(),
            brief: brief?.trim() || "",
          },
          updatedAt: now,
        },
      }
    );

    // 6. Create the generation job
    const idempotencyKey = `${projectId}_initial_${Date.now()}`;
    const job = await createGenerationJob({
      projectId,
      orgId,
      jobType: "initial",
      idempotencyKey,
    });
    const jobId = job._id.toHexString();

    // Update project to generating state
    await siteProjectColl.updateOne(
      {_id: new ObjectId(projectId)},
      {$set: {status: "generating", updatedAt: now}}
    );

    // Write events and queue job outbox
    await appendGenerationEvent({
      projectId,
      jobId,
      orgId,
      eventType: "JOB_CREATED",
      actorUserId: user._id.toHexString(),
      payload: {jobType: "initial"},
    });

    await appendLedgerEvent({
      orgId,
      projectId,
      jobId,
      eventType: "CREDIT_RESERVED",
      metadata: {jobType: "initial"},
    });

    await insertOutbox({
      orgId,
      type: "GENERATION_ENQUEUED",
      payload: {projectId, jobId},
      idempotencyKey: `enqueue:${idempotencyKey}`,
    });

    // 7. Invoke generation job asynchronously
    runGenerationJob({jobId, projectId, jobType: "initial"})
      .then(async () => {
        const updatedProj = await siteProjectColl.findOne({_id: new ObjectId(projectId)});
        const previewUrl = updatedProj?.previewUrl || null;
        await sitesCol.updateOne(
          {_id: new ObjectId(siteId)},
          {
            $set: {
              status: "Review",
              previewUrl,
              pages: 12,
              updatedAt: new Date(),
            },
          }
        );
      })
      .catch(async (err) => {
        console.error(`runGenerationJob background failure for project ${projectId}:`, err);
        await sitesCol.updateOne(
          {_id: new ObjectId(siteId)},
          {
            $set: {
              status: "Draft",
              updatedAt: new Date(),
            },
          }
        );
      });

    return NextResponse.json({
      ok: true,
      data: {
        siteId,
        projectId,
        jobId,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/white-label/websites] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
