import {NextResponse} from "next/server";

import type {ApiError, ApiSuccess, ErrorCode} from "./api-contract";
import {API_SCHEMA_VERSION, ERROR_CODES} from "./api-contract";

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, requestId: string, schemaVersion = API_SCHEMA_VERSION): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    ok: true,
    data,
    requestId,
    schemaVersion,
  });
}

export function fail(
  code: ErrorCode,
  message: string,
  requestId: string,
  status: number,
  details?: unknown,
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      ok: false,
      error: {code, message, details},
      requestId,
    },
    {status},
  );
}

export function statusForErrorCode(code: ErrorCode): number {
  switch (code) {
    case ERROR_CODES.UNAUTHORIZED:
      return 401;
    case ERROR_CODES.FORBIDDEN:
    case ERROR_CODES.FEATURE_DISABLED:
      return 403;
    case ERROR_CODES.NOT_FOUND:
      return 404;
    case ERROR_CODES.VALIDATION_ERROR:
      return 400;
    case ERROR_CODES.CONFLICT:
    case ERROR_CODES.INVALID_STATE_TRANSITION:
    case ERROR_CODES.IDEMPOTENCY_REPLAY:
      return 409;
    case ERROR_CODES.RATE_LIMITED:
      return 429;
    default:
      return 500;
  }
}
