import "server-only";

import {z} from "zod";

import {validationError} from "./errors";

const baseContentSchema = z.object({
  headline: z.string().min(1).optional(),
  body: z.string().optional(),
  sections: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AiValidationResult =
  | {ok: true; data: z.infer<typeof baseContentSchema>}
  | {ok: false; reason: string};

export function validateAiOutput(
  artifactType: string,
  payload: unknown,
  maxRepairAttempts = 1,
): AiValidationResult {
  let attempts = 0;
  let current = payload;

  while (attempts <= maxRepairAttempts) {
    const parsed = baseContentSchema.safeParse(current);
    if (parsed.success) {
      return {ok: true, data: parsed.data};
    }
    if (typeof current === "object" && current !== null && "content" in current) {
      current = (current as {content: unknown}).content;
      attempts += 1;
      continue;
    }
    break;
  }

  return {
    ok: false,
    reason: `AI output failed structural validation for ${artifactType}`,
  };
}

export function assertValidAiOutput(artifactType: string, payload: unknown): void {
  const result = validateAiOutput(artifactType, payload);
  if (!result.ok) {
    throw validationError(result.reason);
  }
}
