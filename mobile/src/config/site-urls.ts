import { env } from "./env";

/** White-label partner application (sign-up) on the Statxeo web app. */
export function whiteLabelApplyUrl(): string {
  const base = env.siteUrl.replace(/\/$/, "");
  return `${base}/white-labeler/apply`;
}
