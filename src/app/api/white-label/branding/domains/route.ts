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
    const {domain, type} = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: domain"}},
        {status: 400}
      );
    }

    const domainType = type === "email" || type === "tracking" ? type : "app";

    const domainsCol = await collections.brandedDomains();
    const existing = await domainsCol.findOne({domain: domain.toLowerCase()});
    if (existing) {
      return NextResponse.json(
        {ok: false, error: {code: "CONFLICT", message: "This domain is already registered"}},
        {status: 409}
      );
    }

    const now = new Date();
    await domainsCol.insertOne({
      agencyOrgId: orgId,
      domain: domain.toLowerCase(),
      type: domainType,
      status: "Pending",
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

    const body = await request.json();
    const {domainId} = body;

    if (!domainId || typeof domainId !== "string") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: domainId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(domainId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid domainId format"}},
        {status: 400}
      );
    }

    const domainsCol = await collections.brandedDomains();
    const result = await domainsCol.deleteOne({
      _id: new ObjectId(domainId),
      agencyOrgId: orgId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Domain not found or unauthorized"}},
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

export async function PATCH(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const body = await request.json();
    const {domainId} = body;

    if (!domainId || typeof domainId !== "string") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: domainId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(domainId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid domainId format"}},
        {status: 400}
      );
    }

    const domainsCol = await collections.brandedDomains();
    const domainDoc = await domainsCol.findOne({
      _id: new ObjectId(domainId),
      agencyOrgId: orgId,
    });

    if (!domainDoc) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Domain not found or unauthorized"}},
        {status: 404}
      );
    }

    // Simulate standard DNS checks and update status to Active
    await domainsCol.updateOne(
      {_id: new ObjectId(domainId)},
      {
        $set: {
          status: "Active",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ok: true});
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: {code: "INTERNAL_ERROR", message: err.message || "Internal server error"}},
      {status: 500}
    );
  }
}
