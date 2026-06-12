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
 * Persists the binary to the local file storage corresponding to the `storagePath`
 * so downstream generation jobs can read it from the filesystem.
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

  try {
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Persist to the local public uploads directory
    const destPath = path.join(process.cwd(), "public", "uploads", storagePath);
    await fs.mkdir(path.dirname(destPath), {recursive: true});
    await fs.writeFile(destPath, buffer);

    return Response.json({ok: true, storagePath}, {status: 200});
  } catch (err: any) {
    console.error("[media upload] error writing file:", err);
    return Response.json(
      {ok: false, error: "Failed to persist media content"},
      {status: 500},
    );
  }
}
