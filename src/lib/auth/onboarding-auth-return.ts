import type {GoogleAuthPersona} from "@/lib/auth/google-auth";

const ONBOARDING_PATH: Record<GoogleAuthPersona, string> = {
  customer: "/onboarding/customer",
  "white-label": "/onboarding/white-label",
  affiliate: "/onboarding/affiliate",
};

/** Return path after Google OAuth during onboarding (advances to done step). */
export function onboardingGoogleReturnTo(
  persona: GoogleAuthPersona,
  options?: {signIn?: boolean},
): string {
  const params = new URLSearchParams({auth: "google"});
  if (options?.signIn) params.set("mode", "sign-in");
  return `${ONBOARDING_PATH[persona]}?${params.toString()}`;
}
