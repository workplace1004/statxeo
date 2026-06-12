import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const body = await request.json();
    const {name, description, trigger, customerName, steps} = body;

    if (!name || !trigger || !customerName) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing required parameters: name, trigger, or customerName"}},
        {status: 400}
      );
    }

    const workflowsCol = await collections.workflows();
    
    // Generate simulated metrics for the new automation
    const runsLast7Days = Math.floor(Math.random() * 25) + 5; // 5 to 30 runs
    const successRate = 0.9 + Math.random() * 0.1; // 90% to 100%

    const newWorkflow = {
      agencyOrgId: orgId,
      customerId: null,
      customerName: customerName.trim(),
      name: name.trim(),
      description: (description || "").trim(),
      status: "Active" as const,
      trigger,
      steps: Number(steps) || 2,
      enabled: true,
      runsLast7Days,
      successRate,
      actions: [],
      lastRunAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await workflowsCol.insertOne(newWorkflow as any);

    return NextResponse.json({ok: true});
  } catch (err: any) {
    console.error("[POST /api/white-label/automation] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
