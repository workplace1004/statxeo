export const SESSION_COOKIE_NAME = "statxeo_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export const GOOGLE_AUTH_PERSONAS = ["customer", "white-label", "affiliate"] as const;
export type GoogleAuthPersona = (typeof GOOGLE_AUTH_PERSONAS)[number];

export const PERSONA_DEFAULT_PATH: Record<GoogleAuthPersona, string> = {
  customer: "/customer",
  "white-label": "/white-label",
  affiliate: "/affiliate",
};

export const PERSONA_ONBOARDING_PATH: Record<GoogleAuthPersona, string> = {
  customer: "/onboarding/customer",
  "white-label": "/onboarding/white-label",
  affiliate: "/onboarding/affiliate",
};
