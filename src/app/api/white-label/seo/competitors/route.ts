import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";
import {serializeCompetitor} from "@/server/db/schemas/competitors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const competitorsCol = await collections.competitors();
    const docs = await competitorsCol.find({agencyOrgId: orgId}).toArray();

    return NextResponse.json({
      ok: true,
      competitors: docs.map(serializeCompetitor),
    });
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const body = await request.json();
    const {domain} = body;

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: domain"}},
        {status: 400}
      );
    }

    const trimmedDomain = domain.trim().toLowerCase();
    const competitorsCol = await collections.competitors();

    // Check duplicate
    const existing = await competitorsCol.findOne({agencyOrgId: orgId, domain: trimmedDomain});
    if (existing) {
      return NextResponse.json(
        {ok: false, error: {code: "CONFLICT", message: "Competitor is already being tracked"}},
        {status: 409}
      );
    }

    // Generate simulated metrics for the competitor
    const visibilityScore = Math.floor(Math.random() * 40) + 10; // 10% - 50%
    const averagePosition = Math.floor(Math.random() * 30) + 8;  // Rank 8 - 38

    const now = new Date();
    await competitorsCol.insertOne({
      agencyOrgId: orgId,
      domain: trimmedDomain,
      visibilityScore,
      averagePosition,
      createdAt: now,
      updatedAt: now,
    } as any);

    return NextResponse.json({ok: true});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const {searchParams} = new URL(request.url);
    const competitorId = searchParams.get("competitorId");

    if (!competitorId) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: competitorId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(competitorId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid competitorId format"}},
        {status: 400}
      );
    }

    const competitorsCol = await collections.competitors();
    const result = await competitorsCol.deleteOne({
      _id: new ObjectId(competitorId),
      agencyOrgId: orgId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Competitor not found or unauthorized"}},
        {status: 404}
      );
    }

    return NextResponse.json({ok: true});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
