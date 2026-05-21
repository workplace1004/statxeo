import {
  createProjectFromPaidLead,
  listPaidLeadsNeedingProjects,
} from "@/server/site-projects/statxai-store";
import {idToString} from "@/server/db/schemas/_helpers";

interface ReconciliationResult {
  processed: number;
  created: number;
  errors: Array<{leadId: string; error: string}>;
}

export async function reconcilePaidOrders(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {processed: 0, created: 0, errors: []};

  try {
    const leadsToProcess = await listPaidLeadsNeedingProjects(50);
    result.processed = leadsToProcess.length;

    for (const lead of leadsToProcess) {
      try {
        await createProjectFromPaidLead({
          _id: lead._id,
          orgId: lead.orgId,
          packageTier: lead.packageTier,
          businessName: lead.businessName,
          contactName: lead.contactName,
          contactEmail: lead.contactEmail,
          contactPhone: lead.contactPhone,
          intakeJson: lead.intakeJson,
        });
        result.created++;
      } catch (err) {
        result.errors.push({
          leadId: idToString(lead._id),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    result.errors.push({
      leadId: "query",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return result;
}
