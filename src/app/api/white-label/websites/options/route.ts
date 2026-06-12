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
    const {siteId, tier, status, previewUrl} = body;

    if (!siteId) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing required parameter: siteId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(siteId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid siteId format"}},
        {status: 400}
      );
    }

    const sitesCol = await collections.sites();
    const existing = await sitesCol.findOne({_id: new ObjectId(siteId), agencyOrgId: orgId});

    if (!existing) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Website not found or unauthorized"}},
        {status: 404}
      );
    }

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (tier !== undefined) updateFields.tier = tier;
    if (status !== undefined) updateFields.status = status;
    if (previewUrl !== undefined) updateFields.previewUrl = previewUrl || null;

    await sitesCol.updateOne(
      {_id: new ObjectId(siteId)},
      {$set: updateFields}
    );

    return NextResponse.json({ok: true});
  } catch (err: any) {
    console.error("[POST /api/white-label/websites/options] error:", err);
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
