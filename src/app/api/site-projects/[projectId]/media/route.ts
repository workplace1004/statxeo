import type {NextRequest} from "next/server";
import {promises as fs} from "fs";
import path from "path";

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
 * Requires an authenticated session with media.upload permission.
 * Persists the binary to a private server-side directory (not public/) so
 * the raw file is never directly web-accessible.
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  const storagePath = request.nextUrl.searchParams.get("storagePath");

  if (!storagePath) {
    return Response.json(
      {ok: false, error: "Missing storagePath query parameter"},
      {status: 400},
    );
  }

  // Ensure storagePath stays within projects/[projectId]/media/ sandbox
  const expectedPrefix = `projects/${projectId}/media/`;
  if (!storagePath.startsWith(expectedPrefix)) {
    return Response.json(
      {ok: false, error: "Invalid storagePath segment"},
      {status: 400},
    );
  }

  return withSiteProjectsSession(request, async (ctx) => {
    // Verify the caller owns this project and has media.upload permission
    await service.assertMediaUploadAccess(ctx, projectId);

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to a private server-side directory — NOT public/ — so the raw
    // binary is never directly web-accessible to anonymous requests.
    const destPath = path.join(process.cwd(), "server-uploads", storagePath);
    await fs.mkdir(path.dirname(destPath), {recursive: true});
    await fs.writeFile(destPath, buffer);

    return {storagePath};
  });
}
