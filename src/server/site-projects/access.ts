export function hasApiKeyProjectAccess(
  apiKeyOrgId: string | null,
  projectOrgId: string,
): boolean {
  return Boolean(apiKeyOrgId && apiKeyOrgId === projectOrgId);
}