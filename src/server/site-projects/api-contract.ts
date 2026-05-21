import {z} from "zod";

export const API_SCHEMA_VERSION = 1;

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
  schemaVersion?: number;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiError = {
  ok: false;
  error: ApiErrorBody;
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginatedData<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
  IDEMPOTENCY_REPLAY: "IDEMPOTENCY_REPLAY",
  RATE_LIMITED: "RATE_LIMITED",
  FEATURE_DISABLED: "FEATURE_DISABLED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
