import "server-only";

import {
  GOOGLE_AUTH_PERSONAS,
  PERSONA_DEFAULT_PATH,
  PERSONA_ONBOARDING_PATH,
  type GoogleAuthPersona,
} from "./constants";
import {getAppUrl} from "./google-config";

function isSafeRelativePath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.includes("\\")) return false;
  return true;
}

function matchesAllowedPath(path: string, allowedBase: string): boolean {
  return path === allowedBase || path.startsWith(`${allowedBase}/`);
}

function isAllowedReturnPath(persona: GoogleAuthPersona, path: string): boolean {
  if (!isSafeRelativePath(path)) return false;

  return (
    matchesAllowedPath(path, PERSONA_DEFAULT_PATH[persona]) ||
    matchesAllowedPath(path, PERSONA_ONBOARDING_PATH[persona])
  );
}

export function parsePersona(value: string | null): GoogleAuthPersona | null {
  if (!value) return null;
  return GOOGLE_AUTH_PERSONAS.includes(value as GoogleAuthPersona)
    ? (value as GoogleAuthPersona)
    : null;
}

export function resolvePostAuthRedirect(
  persona: GoogleAuthPersona,
  returnTo?: string,
): string {
  if (returnTo && isAllowedReturnPath(persona, returnTo)) {
    return returnTo;
  }
  return PERSONA_DEFAULT_PATH[persona];
}

export function buildAuthErrorRedirect(
  persona: GoogleAuthPersona | null,
  returnTo: string | undefined,
  errorCode: string,
): string {
  const base =
    persona && returnTo && isAllowedReturnPath(persona, returnTo)
      ? returnTo
      : persona
        ? PERSONA_DEFAULT_PATH[persona]
        : "/";
  const url = new URL(base, getAppUrl());
  url.searchParams.set("auth_error", errorCode);
  return `${url.pathname}${url.search}`;
}
