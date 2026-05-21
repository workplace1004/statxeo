import type {ErrorCode} from "./api-contract";
import {ERROR_CODES} from "./api-contract";

export class SiteProjectsError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "SiteProjectsError";
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Resource not found"): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.NOT_FOUND, message);
}

export function forbidden(message = "Forbidden"): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.FORBIDDEN, message);
}

export function unauthorized(message = "Not authenticated"): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.UNAUTHORIZED, message);
}

export function validationError(message: string, details?: unknown): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.VALIDATION_ERROR, message, details);
}

export function invalidTransition(from: string, to: string): SiteProjectsError {
  return new SiteProjectsError(
    ERROR_CODES.INVALID_STATE_TRANSITION,
    `Invalid transition: ${from} → ${to}`,
    {from, to},
  );
}

export function featureDisabled(feature: string): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.FEATURE_DISABLED, `${feature} is not enabled`);
}

export function conflict(message: string, details?: unknown): SiteProjectsError {
  return new SiteProjectsError(ERROR_CODES.CONFLICT, message, details);
}
