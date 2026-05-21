import type {Commission, Payout} from "../../server/db/schemas/commissions";
import type {Lead} from "../../server/db/schemas/leads";
import type {Asset} from "../../server/db/schemas/marketing-assets";
import type {ReferralLink} from "../../server/db/schemas/referral-links";

import type {RecentReferral} from "../../widgets/affiliate/recent-referrals-card";

import {buildCsv, downloadCsv} from "./export-csv";

const LINK_CHANNEL_LABEL: Record<ReferralLink["channel"], string> = {
  ads: "Paid Ads",
  blog: "Blog",
  email: "Email",
  qr: "QR Code",
  social: "Social",
  widget: "Widget",
};

export function exportReferralLinksCsv(
  links: ReferralLink[],
  filename = "referral-links.csv",
): void {
  downloadCsv(
    filename,
    buildCsv(links, [
      {header: "Campaign", value: (l) => l.campaign},
      {header: "URL", value: (l) => l.url},
      {header: "Channel", value: (l) => LINK_CHANNEL_LABEL[l.channel]},
      {header: "Clicks", value: (l) => l.clicks},
      {header: "Conversions", value: (l) => l.conversions},
      {header: "EPC", value: (l) => l.epc},
      {header: "Status", value: (l) => l.status},
      {header: "Created", value: (l) => l.createdAt},
    ]),
  );
}

export function exportLeadsCsv(leads: Lead[], filename = "leads.csv"): void {
  downloadCsv(
    filename,
    buildCsv(leads, [
      {header: "Company", value: (l) => l.company},
      {header: "Contact", value: (l) => l.contactName},
      {header: "Role", value: (l) => l.contactRole},
      {header: "Industry", value: (l) => l.industry},
      {header: "Source", value: (l) => l.source},
      {header: "Stage", value: (l) => l.stage},
      {header: "Deal value", value: (l) => l.dealValue},
      {header: "Expected close", value: (l) => l.expectedClose},
      {header: "Tag", value: (l) => l.tag.label},
    ]),
  );
}

export function exportCommissionsCsv(
  commissions: Commission[],
  filename = "commissions.csv",
): void {
  downloadCsv(
    filename,
    buildCsv(commissions, [
      {header: "Reference", value: (c) => c.reference},
      {header: "Company", value: (c) => c.company},
      {header: "Plan", value: (c) => c.plan},
      {header: "Amount", value: (c) => c.amount},
      {header: "Currency", value: (c) => c.currency},
      {header: "Status", value: (c) => c.status},
      {header: "Closed", value: (c) => c.closedDate},
      {header: "Payout", value: (c) => c.payoutDate ?? c.reason ?? ""},
    ]),
  );
}

export function exportPayoutsCsv(payouts: Payout[], filename = "payouts.csv"): void {
  downloadCsv(
    filename,
    buildCsv(payouts, [
      {header: "Reference", value: (p) => p.reference},
      {header: "Date", value: (p) => p.date},
      {header: "Method", value: (p) => p.method},
      {header: "Status", value: (p) => p.status},
      {header: "Amount", value: (p) => p.amount},
      {header: "Currency", value: (p) => p.currency},
    ]),
  );
}

export function exportRecentReferralsCsv(
  referrals: readonly RecentReferral[],
  filename = "recent-referrals.csv",
): void {
  downloadCsv(
    filename,
    buildCsv([...referrals], [
      {header: "Company", value: (r) => r.company},
      {header: "Contact", value: (r) => r.contact.name},
      {header: "Source", value: (r) => r.source},
      {header: "Status", value: (r) => r.status},
      {header: "Amount", value: (r) => r.amount},
      {header: "When", value: (r) => r.whenLabel},
    ]),
  );
}

export function exportAssetsCsv(assets: Asset[], filename = "marketing-assets.csv"): void {
  downloadCsv(
    filename,
    buildCsv(assets, [
      {header: "Title", value: (a) => a.title},
      {header: "Type", value: (a) => a.type},
      {header: "Format", value: (a) => a.format},
      {header: "Size", value: (a) => a.size},
      {header: "Updated", value: (a) => a.updatedAt},
      {header: "Tag", value: (a) => a.tag ?? ""},
      {header: "Description", value: (a) => a.description},
    ]),
  );
}
