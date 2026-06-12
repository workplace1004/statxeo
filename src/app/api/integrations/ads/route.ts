import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {user} = ctx!;

    const body = await request.json();
    const {network, customerId} = body;

    if (network !== "meta" && network !== "google") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "network must be 'meta' or 'google'"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    const usersCol = await collections.users();

    const updateFields: any = {};
    if (network === "meta") {
      updateFields.metaAdsAccessToken = "mock_meta_access_token_auth_9876";
    } else {
      updateFields.googleAdsRefreshToken = "mock_google_refresh_token_auth_5432";
      updateFields.googleAdsCustomerId = customerId || "123-456-7890";
    }

    await usersCol.updateOne(
      {_id: new ObjectId(user._id)},
      {$set: {...updateFields, updatedAt: new Date()}}
    );

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
    const {user} = ctx!;

    const {searchParams} = new URL(request.url);
    const network = searchParams.get("network");

    if (network !== "meta" && network !== "google") {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "network must be 'meta' or 'google'"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    const usersCol = await collections.users();

    const unsetFields: any = {};
    if (network === "meta") {
      unsetFields.metaAdsAccessToken = "";
    } else {
      unsetFields.googleAdsRefreshToken = "";
      unsetFields.googleAdsCustomerId = "";
    }

    await usersCol.updateOne(
      {_id: new ObjectId(user._id)},
      {
        $unset: unsetFields,
        $set: {updatedAt: new Date()},
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
