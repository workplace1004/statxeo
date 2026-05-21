import type {NextRequest} from "next/server";

import type {z} from "zod";

import {validationError} from "./errors";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 256 * 1024;

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  options?: {maxBytes?: number; emptyMessage?: string; invalidMessage?: string},
): Promise<T> {
  const body = await readJsonBody(request, options);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError(
      options?.invalidMessage ?? "Invalid request payload",
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}

export async function readJsonBody(
  request: NextRequest,
  options?: {maxBytes?: number; emptyMessage?: string},
): Promise<unknown> {
  const maxBytes = options?.maxBytes ?? DEFAULT_JSON_BODY_LIMIT_BYTES;
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number.parseInt(contentLength, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw validationError("Request body exceeds size limit", {maxBytes});
    }
  }

  const raw = await request.text();
  const actualBytes = Buffer.byteLength(raw, "utf8");
  if (actualBytes > maxBytes) {
    throw validationError("Request body exceeds size limit", {maxBytes});
  }
  if (!raw.trim()) {
    throw validationError(options?.emptyMessage ?? "Request body is required");
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw validationError("Malformed JSON body");
  }
}