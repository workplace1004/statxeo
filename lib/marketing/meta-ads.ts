export interface MetaCampaignParams {
  name: string;
  dailyBudget: number;
  whiteLabelerId: string;
  clientOrgId: string;
}

export interface MetaCreativeParams {
  name: string;
  headline: string;
  body: string;
  mediaUrl: string;
  type: "video" | "image";
}

/**
 * Meta Graph API Integration Client (Mockable for development / manual testing)
 */
export class MetaAdsClient {
  private accessToken: string;
  private isSandbox: boolean;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.META_ADS_ACCESS_TOKEN || "mock_meta_token";
    this.isSandbox = this.accessToken === "mock_meta_token" || !process.env.META_ADS_ACCESS_TOKEN;
  }

  /**
   * Creates a Campaign on Meta Ads
   */
  async createCampaign(params: MetaCampaignParams) {
    if (this.isSandbox) {
      console.log("[MetaAds - Mock] Creating campaign:", params.name);
      return {
        id: `act_mock_campaign_${Math.floor(Math.random() * 10000000)}`,
        name: params.name,
        status: "PAUSED",
        daily_budget: params.dailyBudget,
        created_time: new Date().toISOString(),
      };
    }

    // Actual Graph API Endpoint: POST /v19.0/act_<AD_ACCOUNT_ID>/campaigns
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    if (!adAccountId) {
      throw new Error("Missing META_AD_ACCOUNT_ID environment variable.");
    }

    const response = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        name: params.name,
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: "NONE",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Campaign Creation failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Creates Ad Creative (Video / Photo option)
   */
  async createCreative(params: MetaCreativeParams) {
    if (this.isSandbox) {
      console.log("[MetaAds - Mock] Creating creative:", params.name);
      return {
        id: `mock_creative_${Math.floor(Math.random() * 10000000)}`,
        name: params.name,
        title: params.headline,
        body: params.body,
        image_url: params.mediaUrl,
      };
    }

    // Actual endpoint: POST /v19.0/act_<AD_ACCOUNT_ID>/adcreatives
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    const response = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/adcreatives`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        name: params.name,
        object_story_spec: {
          page_id: process.env.META_PAGE_ID,
          link_data: {
            image_hash: params.type === "image" ? params.mediaUrl : undefined,
            video_id: params.type === "video" ? params.mediaUrl : undefined,
            message: params.body,
            link: "https://statxeo.com",
            caption: params.headline,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Creative Creation failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Updates daily budget or status of campaign
   */
  async updateCampaign(campaignId: string, updates: { dailyBudget?: number; status?: "ACTIVE" | "PAUSED" }) {
    if (this.isSandbox) {
      console.log(`[MetaAds - Mock] Updating campaign ${campaignId}:`, updates);
      return { success: true };
    }

    const payload: Record<string, any> = {};
    if (updates.dailyBudget) payload.daily_budget = updates.dailyBudget;
    if (updates.status) payload.status = updates.status;

    const response = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Campaign Update failed: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Fetches latest campaign performance stats (Impressions, CTR, Clicks, conversions)
   */
  async getInsights(campaignId: string) {
    if (this.isSandbox) {
      return {
        impressions: Math.floor(Math.random() * 5000) + 1000,
        clicks: Math.floor(Math.random() * 200) + 20,
        spend: Math.floor(Math.random() * 50) + 10,
        conversions: Math.floor(Math.random() * 10),
      };
    }

    // Actual endpoint: GET /v19.0/<CAMPAIGN_ID>/insights
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=impressions,clicks,spend,actions`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Insights fetch failed: ${JSON.stringify(error)}`);
    }

    const { data } = await response.json();
    if (!data || data.length === 0) {
      return { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    }

    const item = data[0];
    const actions = item.actions || [];
    const leadAction = actions.find((a: any) => a.action_type === "lead" || a.action_type === "offsite_conversion.fb_pixel_lead");
    const conversions = leadAction ? parseInt(leadAction.value) : 0;

    return {
      impressions: parseInt(item.impressions || "0"),
      clicks: parseInt(item.clicks || "0"),
      spend: parseFloat(item.spend || "0"),
      conversions,
    };
  }
}
