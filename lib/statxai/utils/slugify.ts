/**
 * Deterministic slug generation for service and city page URLs.
 * Code-owned — slugs are generated before the LLM call so the model
 * can echo them back rather than invent its own.
 *
 * Rules:
 *   - Lowercase
 *   - Replace non-alphanumeric with hyphens
 *   - Collapse multiple hyphens to one
 *   - Strip leading/trailing hyphens
 *   - Max 60 chars
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

/**
 * Generate slugs for a list of labels, deduplicating collisions by
 * appending a numeric suffix (-2, -3, …).
 *
 * Returns an array of slugs in the same order as the input labels.
 * Duplicate labels get different suffixes so each slug is unique.
 */
export function dedupeSlugList(labels: string[]): string[] {
  const seen = new Map<string, number>()
  return labels.map((label) => {
    const base = slugify(label)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  })
}

/**
 * Returns a Map<label, slug> for unique labels only.
 * Use this when you need to look up a slug by its original label.
 * Assumes labels are unique — duplicate labels will use the last slug.
 */
export function labelToSlugMap(labels: string[]): Map<string, string> {
  const slugs = dedupeSlugList(labels)
  return new Map(labels.map((label, i) => [label, slugs[i]]))
}
