import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICreative {
  type: "video" | "image";
  url: string;
  headline: string;
  description: string;
  ctr: number;
  conversionRate: number;
  spend: number;
  status: "draft" | "approved" | "active" | "paused" | "failed";
}

export interface IPerformanceHistory {
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface ICampaign extends Document {
  clientOrgId: string; // UUID from Supabase Client
  whiteLabelerId: string; // UUID from Supabase WL
  campaignName: string;
  channel: "meta" | "google";
  budget: {
    dailyLimit: number;
    totalAllocated: number;
    spendToDate: number;
  };
  status: "draft" | "pending_approval" | "active" | "paused" | "failed";
  keywords: string[];
  creatives: ICreative[];
  guardrails: {
    maxDailyDrift: number;
    autoPauseFatigueScore: number;
  };
  performanceHistory: IPerformanceHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const CreativeSchema = new Schema<ICreative>({
  type: { type: String, enum: ["video", "image"], required: true },
  url: { type: String, required: true },
  headline: { type: String, required: true },
  description: { type: String, required: true },
  ctr: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["draft", "approved", "active", "paused", "failed"],
    default: "draft",
  },
});

const PerformanceHistorySchema = new Schema<IPerformanceHistory>({
  date: { type: Date, required: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
});

const CampaignSchema = new Schema<ICampaign>(
  {
    clientOrgId: { type: String, required: true, index: true },
    whiteLabelerId: { type: String, required: true, index: true },
    campaignName: { type: String, required: true },
    channel: { type: String, enum: ["meta", "google"], required: true },
    budget: {
      dailyLimit: { type: Number, required: true },
      totalAllocated: { type: Number, required: true },
      spendToDate: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "active", "paused", "failed"],
      default: "draft",
    },
    keywords: [{ type: String }],
    creatives: [CreativeSchema],
    guardrails: {
      maxDailyDrift: { type: Number, default: 0.2 }, // 20% max deviation
      autoPauseFatigueScore: { type: Number, default: 0.8 }, // threshold to pause underperforming creative
    },
    performanceHistory: [PerformanceHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js Hot Reloads
const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
