import { NextRequest, NextResponse } from "next/server"

import { reconcilePaidOrders } from "@/lib/statxai/reconciler"

/**
 * POST /api/site-projects/reconcile
 *
 * Detects paid website purchases with no site project and creates them.
 * Designed to be called by a cron job (e.g. every 5 minutes) or on-demand.
 *
 * Auth: Requires STATXAI_API_KEY or STATXT_INTERNAL_API_KEY header.
 * Also accepts Supabase service role via Authorization header.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await reconcilePaidOrders()

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      created: result.created,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reconciliation failed" },
      { status: 500 },
    )
  }
}

function isAuthorized(request: NextRequest): boolean {
  // Accept the internal API key used by STATXT integration
  const internalKey = process.env.STATXT_INTERNAL_API_KEY?.trim()
  if (internalKey && request.headers.get("x-statxt-internal-key") === internalKey) {
    return true
  }

  // Accept a dedicated STATXAI API key for cron/service calls
  const statxaiKey = process.env.STATXAI_API_KEY?.trim()
  if (statxaiKey && request.headers.get("x-statxai-api-key") === statxaiKey) {
    return true
  }

  // Accept Supabase service role token
  const auth = request.headers.get("authorization")
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (auth && serviceRoleKey && auth === `Bearer ${serviceRoleKey}`) {
    return true
  }

  return false
}
