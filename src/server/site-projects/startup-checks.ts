import "server-only";

import {ensureSiteProjectIndexes} from "./site-project-indexes";

export interface StartupCheckResult {
  ok: boolean;
  errors: string[];
}

export async function runSiteProjectsStartupChecks(): Promise<StartupCheckResult> {
  const errors: string[] = [];

  if (!process.env.MONGODB_URI) {
    errors.push("MONGODB_URI is required");
  }
  if (!process.env.AUTH_SESSION_SECRET) {
    errors.push("AUTH_SESSION_SECRET is required");
  }

  if (process.env.SITE_PROJECTS_MONGO_ENABLED === "true") {
    const indexResult = await ensureSiteProjectIndexes();
    for (const e of indexResult.errors) {
      errors.push(`index:${e.collection}:${e.message}`);
    }
  }

  return {ok: errors.length === 0, errors};
}
