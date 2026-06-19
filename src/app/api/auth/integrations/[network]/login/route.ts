import {NextRequest, NextResponse} from "next/server";
import {getAuthenticatedWhiteLabeler} from "@/server/api-context";
import {createOAuthState} from "@/server/auth/oauth-state";

export const dynamic = "force-dynamic";

// Placeholder endpoints for OAuth providers (to be replaced with real URLs)
const OAUTH_PROVIDERS: Record<string, { authUrl: string; clientIdEnvVar: string; scopes: string }> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientIdEnvVar: "GOOGLE_ADS_OAUTH_CLIENT_ID",
    scopes: "https://www.googleapis.com/auth/adwords",
  },
  meta: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientIdEnvVar: "META_ADS_OAUTH_CLIENT_ID",
    scopes: "ads_management,pages_manage_posts", // Requesting both Ads and Social scopes
  },
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    clientIdEnvVar: "MICROSOFT_ADS_OAUTH_CLIENT_ID",
    scopes: "msads.manage offline_access",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientIdEnvVar: "LINKEDIN_ADS_OAUTH_CLIENT_ID",
    scopes: "r_ads r_ads_reporting w_member_social",
  },
  tiktok: {
    authUrl: "https://ads.tiktok.com/marketing_api/auth",
    clientIdEnvVar: "TIKTOK_ADS_OAUTH_CLIENT_ID",
    scopes: "ad.management",
  },
  amazon: {
    authUrl: "https://www.amazon.com/ap/oa",
    clientIdEnvVar: "AMAZON_ADS_OAUTH_CLIENT_ID",
    scopes: "cpc_advertising:campaign_management",
  },
};

export async function GET(request: NextRequest, {params}: {params: Promise<{network: string}>}) {
  try {
    const {network} = await params;
    
    if (!OAUTH_PROVIDERS[network]) {
      return NextResponse.json({error: `Unsupported network: ${network}`}, {status: 400});
    }

    // 1. Authenticate user to ensure they have the right to connect an account
    const {ctx, errorResponse} = await getAuthenticatedWhiteLabeler(request);
    if (errorResponse) return errorResponse;
    if (!ctx) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    
    const {user, orgId} = ctx;
    
    // 2. Generate cryptographically secure CSRF state mapping to this tenant
    const state = createOAuthState({
      integrationNetwork: network,
      organizationId: orgId,
      userId: user._id.toString(),
    });

    // 3. Construct OAuth URL
    const provider = OAUTH_PROVIDERS[network];
    const clientId = process.env[provider.clientIdEnvVar] || `mock_${network}_client_id`;
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/integrations/${network}/callback`;

    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes,
      state: state,
      access_type: "offline", // Mainly for Google to get refresh token
      prompt: "consent", // Force consent screen to guarantee refresh token
    });

    const finalAuthUrl = `${provider.authUrl}?${authParams.toString()}`;

    // 4. Redirect user to the Native Provider's Consent Screen
    return NextResponse.redirect(finalAuthUrl);

  } catch (error) {
    console.error(`[OAuth Login] Error initiating login:`, error);
    return NextResponse.redirect(new URL("/white-label/integrations?error=oauth_init_failed", request.url));
  }
}

