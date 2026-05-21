/** Dark glass + deep green brand fills (replaces orange CTAs). */
export const SHINY_GLASS = {
  base: "#0a120e",
  mid: "#122018",
  deep: "#0d1812",
  shine: "#3d6b55",
  shineBright: "#5a9b75",
  border: "rgba(255, 255, 255, 0.14)",
  highlight: "rgba(255, 255, 255, 0.08)",
  text: "#ffffff",
  accentText: "#b8e0c8",
  accentTextDark: "#6bbf8a",
} as const;

export function shinyGlassGradient(
  spread: number,
  soft = false,
): string {
  const base = soft ? SHINY_GLASS.mid : SHINY_GLASS.base;
  const shine = soft ? SHINY_GLASS.shineBright : SHINY_GLASS.shine;
  return `linear-gradient(${spread}deg, ${base} 0%, ${SHINY_GLASS.deep} 30%, ${shine} 50%, ${SHINY_GLASS.deep} 70%, ${base} 100%)`;
}
