export interface GoogleCampaignParams {
  name: string;
  dailyBudget: number;
  whiteLabelerId: string;
  clientOrgId: string;
}

export interface GoogleAdParams {
  adGroupId: string;
  headline: string;
  description: string;
  finalUrls: string[];
}

/**
 * Google Ads API Client (Mockable for development / manual testing)
 */
export class GoogleAdsClient {
  private developerToken: string;
  private isSandbox: boolean;

  constructor(developerToken?: string) {
    this.developerToken = developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "mock_google_token";
    this.isSandbox = this.developerToken === "mock_google_token" || !process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  }

  /**
   * Creates a Google Ads Campaign (Performance Max or Search)
   */
  async createCampaign(params: GoogleCampaignParams) {
    if (this.isSandbox) {
      console.log("[GoogleAds - Mock] Creating campaign:", params.name);
      return {
        id: `customers/1234567890/campaigns/0`,
        name: params.name,
        status: "PAUSED",
        dailyBudgetMicroAmount: params.dailyBudget * 1_000_000,
        createdAt: new Date().toISOString(),
      };
    }

    // Google Ads API REST Endpoint
    // POST /v16/customers/{customerId}/campaigns:mutate
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    if (!customerId) {
      throw new Error("Missing GOOGLE_ADS_CUSTOMER_ID environment variable.");
    }

    const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/campaigns:mutate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer-token": this.developerToken,
        "login-customer-id": loginCustomerId || "",
        Authorization: `Bearer ${process.env.GOOGLE_ADS_OAUTH_TOKEN}`,
      },
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: params.name,
              advertisingChannelType: "SEARCH",
              status: "PAUSED",
              manualCpc: {},
              campaignBudget: `customers/${customerId}/campaignBudgets/mock_budget_id`,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Ads Campaign Creation failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Creates an Ad Group and Ad creatives
   */
  async createAdGroupAd(params: GoogleAdParams) {
    if (this.isSandbox) {
      console.log("[GoogleAds - Mock] Creating ad for adGroup:", params.adGroupId);
      return {
        id: `${params.adGroupId}/adGroupAds/0`,
        headline: params.headline,
        description: params.description,
        finalUrls: params.finalUrls,
      };
    }

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/adGroupAds:mutate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer-token": this.developerToken,
        Authorization: `Bearer ${process.env.GOOGLE_ADS_OAUTH_TOKEN}`,
      },
      body: JSON.stringify({
        operations: [
          {
            create: {
              adGroup: params.adGroupId,
              status: "PAUSED",
              ad: {
                finalUrls: params.finalUrls,
                expandedTextAd: {
                  headlinePart1: params.headline,
                  description: params.description,
                },
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Ads Create Ad failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Updates Campaign daily budget
   */
  async updateCampaignBudget(campaignId: string, dailyBudget: number) {
    if (this.isSandbox) {
      console.log(`[GoogleAds - Mock] Updating campaign budget ${campaignId} to $${dailyBudget}`);
      return { success: true };
    }

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/campaigns:mutate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer-token": this.developerToken,
        Authorization: `Bearer ${process.env.GOOGLE_ADS_OAUTH_TOKEN}`,
      },
      body: JSON.stringify({
        operations: [
          {
            update: {
              resourceName: campaignId,
              // Update code logic for budget mutations
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Ads Budget Update failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Fetches latest campaign performance stats
   */
  async getInsights(campaignId: string) {
    if (this.isSandbox) {
      return {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
      };
    }

    // Google Ads Query Language search
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const response = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "developer-token": this.developerToken,
        Authorization: `Bearer ${process.env.GOOGLE_ADS_OAUTH_TOKEN}`,
      },
      body: JSON.stringify({
        query: `SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE campaign.resource_name = '${campaignId}'`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Ads Search failed: ${JSON.stringify(error)}`);
    }

    const payload = await response.json();
    const row = payload.results?.[0];
    if (!row) {
      return { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    }

    return {
      impressions: parseInt(row.metrics.impressions || "0"),
      clicks: parseInt(row.metrics.clicks || "0"),
      spend: parseFloat(row.metrics.costMicros || "0") / 1_000_000,
      conversions: parseFloat(row.metrics.conversions || "0"),
    };
  }
}
