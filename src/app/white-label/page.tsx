import {getCurrentAgencyOrgId} from "../../server/context";
import {
  countActiveCustomers,
  getRevenueSeries,
  getRevenueThisMonth,
  listAiActivity,
  listCustomers,
  listPendingApprovals,
} from "../../server/queries/agency";
import {WhiteLabelDashboardPage} from "../../views/white-label/dashboard-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const [customers, approvals, activity, revenue, mrr, activeCustomers] = await Promise.all([
    listCustomers({agencyOrgId, limit: 50}),
    listPendingApprovals({agencyOrgId}),
    listAiActivity({agencyOrgId, limit: 50}),
    getRevenueSeries({agencyOrgId}),
    getRevenueThisMonth({agencyOrgId}),
    countActiveCustomers({agencyOrgId}),
  ]);

  return (
    <WhiteLabelDashboardPage
      activeCustomers={activeCustomers}
      activity={activity}
      approvals={approvals}
      customers={customers}
      mrr={mrr}
      revenue={revenue}
    />
  );
}
