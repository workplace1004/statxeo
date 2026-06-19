import {NextRequest, NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {parseOAuthState} from "@/server/auth/oauth-state";
import {encryptToken} from "@/server/auth/crypto";
import {collections} from "@/server/db/collections";
import {ObjectId} from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, {params}: {params: Promise<{network: string}>}) {
  try {
    const {network} = await params;
    const {searchParams} = new URL(request.url);
    
    const code = searchParams.get("code");
    const stateToken = searchParams.get("state");
    const errorParam = searchParams.get("error");
    
    if (errorParam || !code) {
      console.warn(`[OAuth Callback] User denied or provider returned error:`, errorParam);
      return NextResponse.redirect(new URL("/white-label/integrations?error=oauth_denied", request.url));
    }
    
    if (!stateToken) {
      return NextResponse.redirect(new URL("/white-label/integrations?error=missing_state", request.url));
    }

    // 1. Cryptographically validate state to prevent CSRF
    const statePayload = parseOAuthState(stateToken);
    
    if (!statePayload) {
      console.error(`[OAuth Callback] Invalid or expired state token.`);
      return NextResponse.redirect(new URL("/white-label/integrations?error=invalid_state", request.url));
    }
    
    if (statePayload.integrationNetwork !== network) {
      console.error(`[OAuth Callback] State network mismatch. Expected ${statePayload.integrationNetwork}, got ${network}`);
      return NextResponse.redirect(new URL("/white-label/integrations?error=network_mismatch", request.url));
    }

    const {organizationId, userId} = statePayload;

    if (!organizationId || !userId) {
      return NextResponse.redirect(new URL("/white-label/integrations?error=missing_context", request.url));
    }

    // 2. Exchange Code for Tokens (Mocked Exchange until Mic provides the official Client Secrets)
    // Normally we would POST to the provider's token endpoint here.
    const mockAccessToken = `mock_access_token_${network}_${randomUUID()}`;
    const mockRefreshToken = `mock_refresh_token_${network}_${randomUUID()}`;
    const mockAccountId = `mock_account_id_${network}`;

    // 3. Encrypt Tokens at Rest (Requirement #1)
    const encryptedAccess = encryptToken(mockAccessToken);
    const encryptedRefresh = encryptToken(mockRefreshToken);

    // 4. Save to Database securely mapped to the specific Tenant (Requirement #3)
    const usersCollection = await collections.users();
    
    const updateFields: Record<string, string> = {};
    
    if (network === "google") {
      updateFields.googleAdsRefreshToken = encryptedRefresh;
      updateFields.googleAdsCustomerId = mockAccountId;
    } else if (network === "meta") {
      updateFields.metaAdsAccessToken = encryptedAccess;
      // Meta generally uses long-lived access tokens, sometimes refresh tokens aren't explicitly separate
    } else if (network === "microsoft") {
      updateFields.microsoftAdsRefreshToken = encryptedRefresh;
      updateFields.microsoftAdsCustomerId = mockAccountId;
    } else if (network === "linkedin") {
      updateFields.linkedinAdsAccessToken = encryptedAccess;
      updateFields.linkedinAdsAccountId = mockAccountId;
    } else if (network === "tiktok") {
      updateFields.tiktokAdsAccessToken = encryptedAccess;
      updateFields.tiktokAdsAdvertiserId = mockAccountId;
    } else if (network === "amazon") {
      updateFields.amazonAdsRefreshToken = encryptedRefresh;
      updateFields.amazonAdsProfileId = mockAccountId;
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId), organizationId },
      { $set: updateFields }
    );

    // 5. Redirect back to Integrations Hub with success flag
    return NextResponse.redirect(new URL(`/white-label/integrations?success=${network}_connected`, request.url));

  } catch (error) {
    console.error(`[OAuth Callback] Fatal Error:`, error);
    return NextResponse.redirect(new URL("/white-label/integrations?error=internal_error", request.url));
  }
}
