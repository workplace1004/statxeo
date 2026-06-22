import {getCurrentCustomerOrgId} from "../../../server/context";
import {
  getAverageRanking,
  listCompetitors,
  listCustomerKeywords,
} from "../../../server/queries/customer";
import {collections} from "../../../server/db/collections";
import {serializeWorkflowExecution} from "../../../server/db/schemas/workflow-executions";
import {CustomerSeoPage, type SeoScore} from "../../../views/customer/seo-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();

  const [keywords, competitors, avgRank, rawWorkflow] = await Promise.all([
    listCustomerKeywords({customerOrgId}),
    listCompetitors({customerOrgId}),
    getAverageRanking({customerOrgId}),
    collections.workflowExecutions().then((col) =>
      col.findOne(
        {clientOrgId: customerOrgId, status: {$in: ["queued", "running", "pending_approval" as any]}},
        {sort: {createdAt: -1}}
      )
    ),
  ]);

  const activeWorkflow = rawWorkflow ? serializeWorkflowExecution(rawWorkflow as any) : null;

  const scores: SeoScore[] = [
    {description: "Overall search visibility", label: "Visibility", value: null},
    {description: "On-page content health", label: "Content", value: null},
    {description: "Core Web Vitals & speed", label: "Technical", value: null},
    {description: "Backlink authority", label: "Authority", value: null},
  ];

  return (
    <CustomerSeoPage
      avgRank={avgRank}
      competitors={competitors}
      keywords={keywords}
      rankingHistory={[]}
      scores={scores}
      activeWorkflow={activeWorkflow}
      clientOrgId={customerOrgId}
    />
  );
}
