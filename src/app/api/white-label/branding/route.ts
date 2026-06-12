import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {collections} from "@/server/db/collections";
import {brandSettingsSchema} from "@/server/db/schemas/organizations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    const {orgId} = ctx!;

    const body = await request.json();
    const parsed = brandSettingsSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {ok: false, error: {code: "BAD_REQUEST", message: "Invalid branding settings data", details: parsed.error.flatten()}},
        {status: 400}
      );
    }

    const {ObjectId} = await import("mongodb");
    const orgsCol = await collections.organizations();

    const org = await orgsCol.findOne({_id: new ObjectId(orgId)});
    if (!org) {
      return NextResponse.json(
        {ok: false, error: {code: "NOT_FOUND", message: "Organization not found"}},
        {status: 404}
      );
    }

    const updatedBrand = {
      logoLightUrl: org.brand?.logoLightUrl ?? null,
      logoDarkUrl: org.brand?.logoDarkUrl ?? null,
      primaryColor: org.brand?.primaryColor ?? null,
      secondaryColor: org.brand?.secondaryColor ?? null,
      accentColor: org.brand?.accentColor ?? null,
      customDomain: org.brand?.customDomain ?? null,
      emailFrom: org.brand?.emailFrom ?? null,
      emailFromName: org.brand?.emailFromName ?? null,
      emailFromAddress: org.brand?.emailFromAddress ?? null,
      emailFooter: org.brand?.emailFooter ?? null,
      emailHideBranding: org.brand?.emailHideBranding ?? null,
      loginHeadline: org.brand?.loginHeadline ?? null,
      loginSubhead: org.brand?.loginSubhead ?? null,
      loginBgUrl: org.brand?.loginBgUrl ?? null,
      ...parsed.data,
    };

    await orgsCol.updateOne(
      {_id: new ObjectId(orgId)},
      {
        $set: {
          brand: updatedBrand,
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
