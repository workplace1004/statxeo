import { describe, it, expect, vi, beforeEach } from "vitest";
import { optimizeActiveCampaigns } from "../campaign-optimizer";
import Campaign from "../../db/models/campaign";
import WorkflowExecution from "../../db/models/workflow-execution";

// Mock MongoDB Models
vi.mock("../../db/models/campaign", () => {
  const mockSave = vi.fn().mockResolvedValue(null);
  const mockCampaign = {
    _id: "mock_campaign_id_123",
    campaignName: "Test Roofing Campaign",
    channel: "meta",
    whiteLabelerId: "mock_wl_id_456",
    clientOrgId: "mock_client_id_789",
    budget: {
      dailyLimit: 100,
      totalAllocated: 1000,
      spendToDate: 150,
    },
    status: "active",
    keywords: ["roofing", "contractor"],
    creatives: [
      {
        url: "https://mock.url/creative-winner.mp4",
        type: "video",
        headline: "Premium Roofing Dallas",
        description: "Dallas Metal Roofing Contractor",
        ctr: 0.05, // 5% CTR
        conversionRate: 0.1,
        spend: 50,
        status: "active",
      },
      {
        url: "https://mock.url/creative-loser.mp4",
        type: "video",
        headline: "Cheap Roofing Dallas",
        description: "Best Metal Roofing Deals",
        ctr: 0.005, // 0.5% CTR (should trigger ad fatigue pause)
        conversionRate: 0.01,
        spend: 50,
        status: "active",
      },
    ],
    guardrails: {
      maxDailyDrift: 0.2,
      autoPauseFatigueScore: 0.8,
    },
    performanceHistory: [],
    save: mockSave,
  };

  return {
    default: {
      find: vi.fn().mockResolvedValue([mockCampaign]),
      mockCampaign, // Expose for verification
      mockSave,
    },
  };
});

vi.mock("../../db/models/workflow-execution", () => {
  return {
    default: {
      create: vi.fn().mockResolvedValue({ id: "mock_execution_123" }),
    },
  };
});

// Mock DB connection
vi.mock("../../db/mongodb", () => {
  return {
    default: vi.fn().mockResolvedValue(null),
  };
});

describe("Campaign Optimizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect ad creative fatigue and pause the lower performing ad", async () => {
    const results = await optimizeActiveCampaigns();

    // Verify it processed the campaign
    expect(results).toHaveLength(1);
    expect(results[0].campaignName).toBe("Test Roofing Campaign");
    expect(results[0].updatesApplied).toBe(true);

    // Verify the loser creative status was set to paused
    const campaignModule = await import("../../db/models/campaign");
    const mockCampaign = campaignModule.default.mockCampaign;
    const loserCreative = mockCampaign.creatives.find((c: any) => c.url.includes("loser"));
    expect(loserCreative.status).toBe("paused");

    // Verify campaign save was called
    expect(campaignModule.default.mockSave).toHaveBeenCalled();

    // Verify workflow execution audit log was created
    expect(WorkflowExecution.create).toHaveBeenCalled();
  });
});
