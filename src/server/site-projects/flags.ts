import "server-only";

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return raw === "true" || raw === "1";
}

export const siteProjectFlags = {
  siteProjectsMongoEnabled: () => envFlag("SITE_PROJECTS_MONGO_ENABLED", false),
  aiGenerationMongoEnabled: () => envFlag("AI_GENERATION_MONGO_ENABLED", false),
  reconcileMongoEnabled: () => envFlag("RECONCILE_MONGO_ENABLED", false),
  socialCallbackMongoEnabled: () => envFlag("SOCIAL_CALLBACK_MONGO_ENABLED", false),
};

export function assertSiteProjectsEnabled(): void {
  if (!siteProjectFlags.siteProjectsMongoEnabled()) {
    throw new Error("SITE_PROJECTS_MONGO_ENABLED is false");
  }
}

export function assertAiGenerationEnabled(): void {
  if (!siteProjectFlags.aiGenerationMongoEnabled()) {
    throw new Error("AI_GENERATION_MONGO_ENABLED is false");
  }
}

export const isSiteProjectsMongoEnabled = siteProjectFlags.siteProjectsMongoEnabled;
export const isAiGenerationMongoEnabled = siteProjectFlags.aiGenerationMongoEnabled;
export const isReconcileMongoEnabled = siteProjectFlags.reconcileMongoEnabled;
export const isSocialCallbackMongoEnabled = siteProjectFlags.socialCallbackMongoEnabled;
