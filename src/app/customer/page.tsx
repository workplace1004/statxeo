import {getCurrentCustomerOrgId} from "../../server/context";
import {
  getActiveProject,
  getAverageRanking,
  getBusinessProfile,
  listAiTasks,
  listCustomerKeywords,
} from "../../server/queries/customer";
import {CustomerDashboardPage} from "../../views/customer/dashboard-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();

  const [businessProfile, aiTasks, allKeywords, avgRank, project] = await Promise.all([
    getBusinessProfile({customerOrgId}),
    listAiTasks({customerOrgId}),
    listCustomerKeywords({customerOrgId}),
    getAverageRanking({customerOrgId}),
    getActiveProject({customerOrgId}),
  ]);

  const pendingAi = aiTasks
    .filter((t) => t.status === "Waiting for approval" || t.status === "Suggested")
    .slice(0, 3);
  const keywords = allKeywords.slice(0, 5);
  return (
    <CustomerDashboardPage
      avgRank={avgRank}
      businessProfile={businessProfile}
      keywords={keywords}
      pendingAi={pendingAi}
      showWebsiteSetupBanner={project?.status === "awaiting_preferences"}
    />
  );
}
