export type GoogleAuthPersona = "customer" | "white-label" | "affiliate";

export type GoogleSignInOptions = {
  persona: GoogleAuthPersona;
  returnTo?: string;
  mode?: "sign-in" | "sign-up";
};

/** Client-safe URL to start Google OAuth (redirects via API route). */
export function getGoogleSignInUrl(options: GoogleSignInOptions): string {
  const params = new URLSearchParams({persona: options.persona});
  if (options.returnTo) params.set("returnTo", options.returnTo);
  if (options.mode) params.set("mode", options.mode);
  return `/api/integrations/google?${params.toString()}`;
}
