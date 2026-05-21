import "server-only";

import {collections} from "../db/collections";
import {
  serializeCommission,
  serializePayout,
  type Commission,
  type Payout,
} from "../db/schemas/commissions";
import {serializeLead, type Lead} from "../db/schemas/leads";
import {serializeMarketingAsset, type Asset} from "../db/schemas/marketing-assets";
import {serializeMeeting, type Meeting} from "../db/schemas/meetings";
import {serializePlan, type PlanTier} from "../db/schemas/plans";
import {serializeReferralLink, type ReferralLink} from "../db/schemas/referral-links";
import {
  serializeTrainingModule,
  type TrainingModule,
} from "../db/schemas/training";

export interface AffiliateScope {
  affiliateUserId: string;
}

// ─── Referral links ────────────────────────────────────────────────────────

export async function listReferralLinks(opts: AffiliateScope): Promise<ReferralLink[]> {
  const c = await collections.referralLinks();
  const docs = await c
    .find({affiliateUserId: opts.affiliateUserId})
    .sort({createdAt: -1})
    .limit(200)
    .toArray();

  return docs.map(serializeReferralLink);
}

// ─── Leads ─────────────────────────────────────────────────────────────────

export async function listLeads(opts: AffiliateScope): Promise<Lead[]> {
  const c = await collections.leads();
  const docs = await c
    .find({affiliateUserId: opts.affiliateUserId})
    .sort({updatedAt: -1})
    .limit(500)
    .toArray();

  return docs.map(serializeLead);
}

// ─── Commissions ───────────────────────────────────────────────────────────

export async function listCommissions(opts: AffiliateScope): Promise<Commission[]> {
  const c = await collections.commissions();
  const docs = await c
    .find({affiliateUserId: opts.affiliateUserId})
    .sort({closedDate: -1})
    .limit(500)
    .toArray();

  return docs.map(serializeCommission);
}

export async function listPayouts(opts: AffiliateScope): Promise<Payout[]> {
  const c = await collections.payouts();
  const docs = await c
    .find({affiliateUserId: opts.affiliateUserId})
    .sort({scheduledFor: -1})
    .limit(50)
    .toArray();

  return docs.map(serializePayout);
}

export interface CommissionKpiTotals {
  paidThisYear: number;
  pending: number;
  upcoming: number;
  clawbacks30d: number;
}

export async function getCommissionTotals(opts: AffiliateScope): Promise<CommissionKpiTotals> {
  const c = await collections.commissions();
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [row] = await c
    .aggregate<{paidThisYear: number; pending: number; upcoming: number; clawbacks30d: number}>([
      {$match: {affiliateUserId: opts.affiliateUserId}},
      {
        $group: {
          _id: null,
          paidThisYear: {
            $sum: {
              $cond: [
                {$and: [{$eq: ["$status", "Paid"]}, {$gte: ["$closedDate", yearStart]}]},
                "$amountCents",
                0,
              ],
            },
          },
          pending: {
            $sum: {$cond: [{$eq: ["$status", "Pending"]}, "$amountCents", 0]},
          },
          upcoming: {
            $sum: {$cond: [{$eq: ["$status", "Upcoming"]}, "$amountCents", 0]},
          },
          clawbacks30d: {
            $sum: {
              $cond: [
                {$and: [{$eq: ["$status", "Clawback"]}, {$gte: ["$closedDate", thirtyDaysAgo]}]},
                {$abs: "$amountCents"},
                0,
              ],
            },
          },
        },
      },
    ])
    .toArray();

  if (!row) return {paidThisYear: 0, pending: 0, upcoming: 0, clawbacks30d: 0};

  return {
    paidThisYear: Math.round(row.paidThisYear / 100),
    pending: Math.round(row.pending / 100),
    upcoming: Math.round(row.upcoming / 100),
    clawbacks30d: Math.round(row.clawbacks30d / 100),
  };
}

// ─── Marketing assets ──────────────────────────────────────────────────────

export async function listMarketingAssets(): Promise<Asset[]> {
  const c = await collections.marketingAssets();
  const docs = await c.find({}).sort({updatedAt: -1}).limit(200).toArray();

  return docs.map(serializeMarketingAsset);
}

// ─── Training ──────────────────────────────────────────────────────────────

export async function listTrainingModules(opts: AffiliateScope): Promise<TrainingModule[]> {
  const modulesC = await collections.trainingModules();
  const progressC = await collections.trainingProgress();

  const [modules, progressRows] = await Promise.all([
    modulesC.find({}).sort({isRequired: -1, createdAt: 1}).toArray(),
    progressC.find({userId: opts.affiliateUserId}).toArray(),
  ]);

  const progressById = new Map(progressRows.map((row) => [row.moduleId, row]));

  return modules.map((m) => serializeTrainingModule(m, progressById.get(m._id.toHexString()) ?? null));
}

export async function getTrainingStats(opts: AffiliateScope): Promise<{
  completed: number;
  inProgress: number;
  totalMinutes: number;
  certifications: number;
}> {
  const modules = await listTrainingModules(opts);
  const completed = modules.filter((m) => m.status === "Completed").length;
  const inProgress = modules.filter((m) => m.status === "In Progress").length;
  const totalMinutes = modules.reduce((sum, m) => sum + m.durationMinutes, 0);

  return {completed, inProgress, totalMinutes, certifications: completed};
}

// ─── Meetings ──────────────────────────────────────────────────────────────

export async function listMeetings(opts: AffiliateScope): Promise<Meeting[]> {
  const c = await collections.meetings();
  const docs = await c
    .find({affiliateUserId: opts.affiliateUserId})
    .sort({scheduledFor: 1})
    .limit(100)
    .toArray();

  return docs.map(serializeMeeting);
}

// ─── Plans (catalogue is platform-level, not per-affiliate) ────────────────

export async function listPlans(): Promise<PlanTier[]> {
  const c = await collections.plans();
  const docs = await c.find({}).sort({monthlyPriceCents: 1}).toArray();

  return docs.map(serializePlan);
}
