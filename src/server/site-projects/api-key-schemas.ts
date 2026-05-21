import {z} from "zod";

export const apiKeyScopeSchema = z.enum(["generation.enqueue", "reconcile.run", "*"]);

export const createApiKeyInputSchema = z.object({
  orgId: z.string().trim().min(1),
  scopes: z.array(apiKeyScopeSchema).min(1),
  createdBy: z.string().trim().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateApiKeyInputSchema = z.object({
  orgId: z.string().trim().min(1).optional(),
  scopes: z.array(apiKeyScopeSchema).min(1).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  revoke: z.boolean().optional(),
});