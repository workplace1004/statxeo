import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {siteProjectCollections} from "@/server/site-projects/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const {searchParams} = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Missing parameter: accountId"}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    if (!ObjectId.isValid(accountId)) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid accountId format"}},
        {status: 400}
      );
    }

    const coll = await siteProjectCollections.whiteLabelerSocialAccounts();
    const result = await coll.deleteOne({
      _id: new ObjectId(accountId),
      whiteLabelerId: orgId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Social account not found or unauthorized"}},
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
