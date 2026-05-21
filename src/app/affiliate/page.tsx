import {getCurrentAffiliateUserId} from "../../server/context";
import {
  getCommissionTotals,
  listLeads,
  listMeetings,
  listReferralLinks,
} from "../../server/queries/affiliate";
import {AffiliateDashboardPage} from "../../views/affiliate/dashboard-page";

export default async function Page() {
  const affiliateUserId = await getCurrentAffiliateUserId();
  const [commissionTotals, leads, links, meetings] = await Promise.all([
    getCommissionTotals({affiliateUserId}),
    listLeads({affiliateUserId}),
    listReferralLinks({affiliateUserId}),
    listMeetings({affiliateUserId}),
  ]);

  const activeCampaigns = links.filter((l) => l.status === "active").length;
  const nowMs = Date.now();
  const upcomingMeetings = meetings.filter((m) => new Date(m.start).getTime() >= nowMs);
  const conversions = leads.filter((l) => l.stage === "Closed Won").length;
  const clicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const conversionRate = clicks > 0 ? conversions / clicks : 0;

  const totals = {
    activeCampaigns,
    conversionRate,
    meetingsBooked: upcomingMeetings.length,
    newReferrals: leads.length,
    pendingPayout: commissionTotals.pending,
    totalEarnings: commissionTotals.paidThisYear,
  };

  return (
    <AffiliateDashboardPage
      clicksTrend={[]}
      earnings={[]}
      leaderboard={[]}
      meetings={upcomingMeetings}
      recentReferrals={[]}
      totals={totals}
    />
  );
}
