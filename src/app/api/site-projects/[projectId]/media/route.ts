import type {NextRequest} from "next/server";

import * as service from "@/server/site-projects/service";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  return withSiteProjectsSession(request, (ctx) => service.listProjectMedia(ctx, projectId));
}

/**
 * PUT /api/site-projects/[projectId]/media
 *
 * Accepts the binary upload for a media asset previously registered via
 * sign-upload.  The DB record (storagePath, metadata) is already committed
 * by sign-upload; this handler just acknowledges receipt.
 *
 * TODO: wire to a blob storage backend (e.g. Vercel Blob) and persist the
 * binary to the `storagePath` so downstream generation jobs can read it.
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId: _projectId} = await params;

  // Drain the body so the connection is not left hanging
  try {
    await request.arrayBuffer();
  } catch {
    // ignore read errors
  }

  return Response.json({ok: true}, {status: 200});
}
