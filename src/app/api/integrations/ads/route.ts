import {NextRequest, NextResponse} from "next/server";
import {getSession} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {ObjectId} from "mongodb";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.persona !== "white-label") {
      return NextResponse.json({error: {message: "Unauthorized"}}, {status: 401});
    }

    const {searchParams} = new URL(request.url);
    const network = searchParams.get("network");

    if (!network) {
      return NextResponse.json({error: {message: "Missing network parameter"}}, {status: 400});
    }

    const usersCollection = await collections.users();
    const user = await usersCollection.findOne({email: session.email.toLowerCase()});

    if (!user) {
      return NextResponse.json({error: {message: "User not found"}}, {status: 404});
    }

    const unsetFields: Record<string, any> = {};

    if (network === "google") {
      unsetFields.googleAdsRefreshToken = "";
      unsetFields.googleAdsCustomerId = "";
    } else if (network === "meta") {
      unsetFields.metaAdsAccessToken = "";
    } else if (network === "microsoft") {
      unsetFields.microsoftAdsRefreshToken = "";
      unsetFields.microsoftAdsCustomerId = "";
    } else if (network === "linkedin") {
      unsetFields.linkedinAdsAccessToken = "";
      unsetFields.linkedinAdsAccountId = "";
    } else if (network === "tiktok") {
      unsetFields.tiktokAdsAccessToken = "";
      unsetFields.tiktokAdsAdvertiserId = "";
    } else if (network === "amazon") {
      unsetFields.amazonAdsRefreshToken = "";
      unsetFields.amazonAdsProfileId = "";
    } else {
      return NextResponse.json({error: {message: `Unsupported network: ${network}`}}, {status: 400});
    }

    await usersCollection.updateOne(
      { _id: user._id },
      { $unset: unsetFields }
    );

    return NextResponse.json({ok: true});

  } catch (error: any) {
    console.error(`[API Integrations Ads DELETE] Error:`, error);
    return NextResponse.json({error: {message: error.message || "Internal server error"}}, {status: 500});
  }
}
