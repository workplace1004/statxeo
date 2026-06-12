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
    const {stripeConnected} = body;

    const {ObjectId} = await import("mongodb");
    const orgsCol = await collections.organizations();

    await orgsCol.updateOne(
      {_id: new ObjectId(orgId)},
      {
        $set: {
          stripeConnected: !!stripeConnected,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ok: true});
  } catch (err: any) {
    console.error("[POST /api/white-label/billing/stripe] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
