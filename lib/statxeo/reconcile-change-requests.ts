import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Marks change requests as resolved when a preview-generation job finished
 * after the request was created. This heals rows that were left pending because
 * `resolvePendingChangeRequests` in the orchestrator never ran (e.g. serverless
 * freezing work after the HTTP response from POST /trigger).
 */
export async function reconcileResolvedChangeRequests(
  admin: SupabaseClient,
  projectId: string,
): Promise<void> {
  const { data: pending, error: pErr } = await admin
    .from("statxeo_site_change_requests")
    .select("id, created_at")
    .eq("project_id", projectId)
    .in("status", ["pending", "in_progress"])

  if (pErr || !pending?.length) return

  const { data: jobs, error: jErr } = await admin
    .from("statxeo_site_generation_jobs")
    .select("id, completed_at, job_type")
    .eq("project_id", projectId)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .neq("job_type", "deploy_production")
    .order("completed_at", { ascending: true })

  if (jErr || !jobs?.length) return

  const resolvedAt = new Date().toISOString()

  await Promise.all(
    pending.map(async (cr) => {
      const doneAfter = jobs.find(
        (j) =>
          j.completed_at != null &&
          new Date(j.completed_at).getTime() > new Date(cr.created_at).getTime(),
      )
      if (!doneAfter) return

      const { error: uErr } = await admin
        .from("statxeo_site_change_requests")
        .update({
          status: "resolved",
          resolved_at: resolvedAt,
          generation_job_id: doneAfter.id,
        })
        .eq("id", cr.id)
        .in("status", ["pending", "in_progress"])

      if (uErr) {
        const { error: retry } = await admin
          .from("statxeo_site_change_requests")
          .update({ status: "resolved", resolved_at: resolvedAt })
          .eq("id", cr.id)
          .in("status", ["pending", "in_progress"])
        if (retry) {
          console.error("[statxeo] reconcile change request failed:", cr.id, retry.message)
        }
      }
    }),
  )
}
