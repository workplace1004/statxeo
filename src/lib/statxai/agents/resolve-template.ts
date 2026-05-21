import {readArtifact, writeArtifact, type JobContext} from "../orchestrator";
import type {NormalizedIntake} from "../schemas/intake";
import {
  findTemplateByName,
  getActiveTemplate,
  getPipelineProject,
  updateProjectFields,
} from "@/server/site-projects/statxai-store";

const PACKAGE_TEMPLATE_DEFAULTS: Record<string, string> = {
  statxeo_lander: "lander-default",
  statxeo_core: "core-default",
  statxeo_titan: "titan-default",
};

export async function resolveTemplate(ctx: JobContext): Promise<void> {
  const artifact = await readArtifact<{normalizedIntake: NormalizedIntake}>(
    ctx.projectId,
    "generated_copy",
  );
  const {normalizedIntake} = artifact;

  const project = await getPipelineProject(ctx.projectId);
  let templateRow: {
    id: string;
    name: string;
    slot_schema: unknown;
    pages: unknown[];
    renderer_version: string;
  } | null = null;

  if (project?.template_id && typeof project.template_id === "string") {
    templateRow = await getActiveTemplate(project.template_id);
  }

  if (!templateRow) {
    const preferredName =
      PACKAGE_TEMPLATE_DEFAULTS[normalizedIntake.packageTier] ?? "lander-default";
    templateRow = await findTemplateByName(preferredName);
  }

  if (!templateRow) {
    throw new Error(`No active template found for package tier: ${normalizedIntake.packageTier}`);
  }

  if (!project?.template_id) {
    await updateProjectFields(ctx.projectId, {template_id: templateRow.id});
  }

  await writeArtifact(ctx.jobId, ctx.projectId, "generated_copy", {
    normalizedIntake,
    template: {
      id: templateRow.id,
      name: templateRow.name,
      slotSchema: templateRow.slot_schema,
      pages: templateRow.pages,
      rendererVersion: templateRow.renderer_version,
    },
  });
}
