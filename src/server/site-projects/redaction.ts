import "server-only";

const ALLOWED_LOG_KEYS = new Set([
  "requestId",
  "projectId",
  "jobId",
  "orgId",
  "userId",
  "artifactId",
  "stage",
  "durationMs",
  "eventType",
  "code",
  "route",
  "principal",
  "action",
]);

export function safeLogFields(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (ALLOWED_LOG_KEYS.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

export function logInfo(message: string, fields?: Record<string, unknown>): void {
  const payload = fields ? safeLogFields(fields) : {};
  console.info(JSON.stringify({level: "info", message, ...payload, ts: new Date().toISOString()}));
}

export function logError(message: string, fields?: Record<string, unknown>): void {
  const payload = fields ? safeLogFields(fields) : {};
  console.error(JSON.stringify({level: "error", message, ...payload, ts: new Date().toISOString()}));
}
