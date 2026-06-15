import { LanderContentSchema } from "./lander-content"
import { CoreContentSchema } from "./core-content"
import { TitanContentSchema } from "./titan-content"
import type { ZodTypeAny } from "zod"

/**
 * Returns the correct Zod content schema for a given template name.
 * This is the single source of truth for schema routing across all agents.
 *
 * Used by: assemble-prompt, generate-content, validate-output
 */
export function selectContentSchema(templateName: string): ZodTypeAny {
  switch (templateName) {
    case "lander-default":
      return LanderContentSchema
    case "core-default":
      return CoreContentSchema
    case "titan-default":
      return TitanContentSchema
    default:
      return LanderContentSchema
  }
}

export { LanderContentSchema } from "./lander-content"
export { CoreContentSchema } from "./core-content"
export { TitanContentSchema } from "./titan-content"
export type { LanderContent } from "./lander-content"
export type { CoreContent, CoreServiceItem, CoreFaqItem } from "./core-content"
export type { TitanContent, TitanServicePage, TitanCityPage } from "./titan-content"
