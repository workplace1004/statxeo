import "server-only";

/**
 * Artifact storage rules — metadata in Mongo, large blobs in object storage (future).
 * v1 stores inline payload on generation_artifacts when under size threshold.
 */

export const INLINE_PAYLOAD_MAX_BYTES = 512 * 1024;

export function shouldStoreInline(payload: unknown): boolean {
  const size = Buffer.byteLength(JSON.stringify(payload ?? {}), "utf8");
  return size <= INLINE_PAYLOAD_MAX_BYTES;
}

export function buildStorageKey(orgId: string, projectId: string, artifactType: string): string {
  return `orgs/${orgId}/projects/${projectId}/artifacts/${artifactType}/${Date.now()}.json`;
}
