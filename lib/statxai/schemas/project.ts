import { z } from "zod"

export const SiteProjectStatus = z.enum([
  "awaiting_purchase",
  "awaiting_preferences",
  "assets_pending",
  "ready_for_generation",
  "generating",
  "preview_ready",
  "changes_requested",
  "approved",
  "production_deploying",
  "live",
  "failed",
])

export type SiteProjectStatus = z.infer<typeof SiteProjectStatus>

export const GenerationJobStatus = z.enum(["queued", "running", "completed", "failed", "cancelled"])

export type GenerationJobStatus = z.infer<typeof GenerationJobStatus>

export const GenerationJobType = z.enum(["initial", "revision", "regenerate", "deploy_preview", "deploy_production"])

export type GenerationJobType = z.infer<typeof GenerationJobType>

export const GenerationStage = z.enum([
  "queued",
  "loading_project",
  "normalizing_intake",
  "resolving_template",
  "assembling_prompt",
  "llm_calling",
  "validating_output",
  "mapping_slots",
  "generating_seo",
  "building_manifest",
  "deploying_preview",
  "deploying_production",
  "complete",
  "failed",
])

export type GenerationStage = z.infer<typeof GenerationStage>

export const ChangeRequestScope = z.enum(["site", "page", "section", "seo", "media"])

export type ChangeRequestScope = z.infer<typeof ChangeRequestScope>

export const ChangeRequestStatus = z.enum(["pending", "in_progress", "resolved", "rejected"])

export type ChangeRequestStatus = z.infer<typeof ChangeRequestStatus>
