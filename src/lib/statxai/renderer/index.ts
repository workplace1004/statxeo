import type { RenderManifest } from "../agents/build-manifest"
import type { RenderResult } from "./primitives"
import { renderLanderDefault } from "./lander-default"
import { renderCoreDefault } from "./core-default"
import { renderTitanDefault } from "./titan-default"

/**
 * Selects and invokes the correct renderer for a given template.
 *
 * @param manifest - The assembled render manifest
 * @param siteToken - Opaque token for contact form auth (Core/Titan only)
 */
export function selectRenderer(manifest: RenderManifest, siteToken = ""): RenderResult {
  switch (manifest.templateName) {
    case "lander-default":
      return renderLanderDefault(manifest)
    case "core-default":
      return renderCoreDefault(manifest, siteToken)
    case "titan-default":
      return renderTitanDefault(manifest, siteToken)
    default:
      return renderLanderDefault(manifest)
  }
}

export type { RenderResult } from "./primitives"
export type { RenderManifest } from "../agents/build-manifest"
