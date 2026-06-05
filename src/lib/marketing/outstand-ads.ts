import {siteProjectCollections} from "@/server/site-projects/collections";

export interface OutstandCampaignParams {
  name: string;
  dailyBudget: number;
  whiteLabelerId: string;
  clientOrgId: string;
  channel: "meta" | "google";
}

export interface OutstandCreativeParams {
  name: string;
  headline: string;
  body: string;
  mediaUrl: string;
  type: "video" | "image";
}

/**
 * Outstand Ads API Client (Mockable for development / manual testing)
 * 
 * Routes ad operations through outstand.so using the white-labeler's connected outstandAccountId,
 * rather than storing raw Meta/Google credentials on our side.
 */
export class OutstandAdsClient {
  private apiKey: string;
  private isSandbox: boolean;

  constructor() {
    this.apiKey = process.env.OUSTAND_API_KEY || "mock_outstand_key";
    this.isSandbox = this.apiKey === "mock_outstand_key" || !process.env.OUSTAND_API_KEY;
  }

  private async getOutstandAccountId(whiteLabelerId: string): Promise<string> {
    const coll = await siteProjectCollections.whiteLabelerSocialAccounts();
    const account = await coll.findOne({ whiteLabelerId, isActive: true });
    
    if (!account || !account.outstandAccountId) {
      if (this.isSandbox) {
        return "mock_outstand_account_id";
      }
      throw new Error(`No active Outstand account found for white-labeler org: ${whiteLabelerId}`);
    }
    
    return account.outstandAccountId;
  }

  /**
   * Fetches latest campaign performance stats (Impressions, CTR, Clicks, conversions)
   */
  async getInsights(whiteLabelerId: string, campaignId: string, channel: "meta" | "google") {
    const accountId = await this.getOutstandAccountId(whiteLabelerId);

    if (this.isSandbox) {
      // Mock performance data based on channel
      const isGoogle = channel === "google";
      return {
        impressions: Math.floor(Math.random() * (isGoogle ? 8000 : 5000)) + 1000,
        clicks: Math.floor(Math.random() * (isGoogle ? 300 : 200)) + 20,
        spend: Math.floor(Math.random() * (isGoogle ? 60 : 50)) + 10,
        conversions: Math.floor(Math.random() * 15),
      };
    }

    // Actual Outstand endpoint: GET /v1/ads/campaigns/{campaignId}/insights
    const response = await fetch(
      `https://api.outstand.so/v1/ads/campaigns/${campaignId}/insights?accountId=${accountId}&channel=${channel}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Outstand Insights fetch failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return {
      impressions: parseInt(data.impressions || "0"),
      clicks: parseInt(data.clicks || "0"),
      spend: parseFloat(data.spend || "0"),
      conversions: parseInt(data.conversions || "0"),
    };
  }

  /**
   * Updates daily budget or status of campaign via Outstand
   */
  async updateCampaign(whiteLabelerId: string, campaignId: string, channel: "meta" | "google", updates: { dailyBudget?: number; status?: "ACTIVE" | "PAUSED" }) {
    const accountId = await this.getOutstandAccountId(whiteLabelerId);

    if (this.isSandbox) {
      console.log(`[Outstand - Mock] Updating ${channel} campaign ${campaignId} for account ${accountId}:`, updates);
      return { success: true };
    }

    // Actual Outstand endpoint: PATCH /v1/ads/campaigns/{campaignId}
    const response = await fetch(`https://api.outstand.so/v1/ads/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        accountId,
        channel,
        ...updates
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Outstand Campaign Update failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}
