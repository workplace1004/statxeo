"use client"

/**
 * Back-compat alias: the tenant surface area (overview, role) lives on the same
 * provider as the full portal. Prefer `useWhiteLabelerPortal` in new code.
 */
export { WhiteLabelerPortalProvider as WhiteLabelerTenantProvider, useWhiteLabelerPortal as useWhiteLabelerTenant } from "./portal-context"
