import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId, user} = ctx!;

    const body = await request.json();
    const {name, email, role} = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing required parameters: name, email, or role"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    const agencyTeamCol = await collections.agencyTeam();

    const existing = await agencyTeamCol.findOne({agencyOrgId: orgId, email: email.toLowerCase()});
    if (existing) {
      return NextResponse.json(
        {ok: false, error: {code: "CONFLICT", message: "Teammate with this email already exists"}},
        {status: 409}
      );
    }

    const newTeammate = {
      agencyOrgId: orgId,
      userId: null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: null,
      role,
      customers: 0,
      status: "Invited",
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await agencyTeamCol.insertOne(newTeammate as any);

    // Audit Log
    const activityLogCol = await collections.activityLog();
    await activityLogCol.insertOne({
      agencyOrgId: orgId,
      actorUserId: user._id.toString(),
      actorName: user.name,
      action: "invited teammate",
      target: name,
      occurredAt: new Date(),
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
    const {orgId, user} = ctx!;

    const {searchParams} = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: memberId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(memberId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid memberId format"}},
        {status: 400}
      );
    }

    const agencyTeamCol = await collections.agencyTeam();
    const teammateDoc = await agencyTeamCol.findOne({
      _id: new ObjectId(memberId),
      agencyOrgId: orgId,
    });

    if (!teammateDoc) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Teammate not found or unauthorized"}},
        {status: 404}
      );
    }

    await agencyTeamCol.deleteOne({_id: new ObjectId(memberId)});

    // Audit Log
    const activityLogCol = await collections.activityLog();
    await activityLogCol.insertOne({
      agencyOrgId: orgId,
      actorUserId: user._id.toString(),
      actorName: user.name,
      action: "removed teammate",
      target: teammateDoc.name,
      occurredAt: new Date(),
    } as any);

    return NextResponse.json({ok: true});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
