import "server-only";

import {siteProjectCollections} from "./collections";
import {idToString} from "@/server/db/schemas/_helpers";

/**
 * Marks change requests resolved when a preview job completed after they were created.
 */
export async function reconcileResolvedChangeRequests(projectId: string): Promise<void> {
  const changeRequests = await siteProjectCollections.siteChangeRequests();
  const jobs = await siteProjectCollections.siteGenerationJobs();

  const pending = await changeRequests
    .find({projectId, status: {$in: ["pending", "in_progress"]}})
    .toArray();
  if (!pending.length) return;

  const completedJobs = await jobs
    .find({
      projectId,
      status: "completed",
      completedAt: {$ne: null},
      jobType: {$ne: "deploy_production"},
    })
    .sort({completedAt: 1})
    .toArray();

  if (!completedJobs.length) return;

  const resolvedAt = new Date();

  await Promise.all(
    pending.map(async (cr) => {
      const doneAfter = completedJobs.find(
        (j) => j.completedAt && j.completedAt.getTime() > cr.createdAt.getTime(),
      );
      if (!doneAfter) return;

      await changeRequests.updateOne(
        {_id: cr._id, status: {$in: ["pending", "in_progress"]}},
        {
          $set: {
            status: "resolved",
            resolvedAt,
            generationJobId: idToString(doneAfter._id),
            updatedAt: new Date(),
          },
        },
      );
    }),
  );
}
