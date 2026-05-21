import type {NextRequest} from "next/server";

import {z} from "zod";

import * as service from "@/server/site-projects/service";
import {validationError} from "@/server/site-projects/errors";
import {withSiteProjectsSession} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mediaUploadBodySchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine((value) => !/[\\/]/.test(value), "Filename must not contain path separators")
    .refine((value) => !/^\.+$/.test(value), "Filename is invalid"),
  mimeType: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) =>
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/svg+xml",
          "application/pdf",
        ].includes(value),
      "Unsupported media type",
    ),
  assetType: z.enum(["photo", "logo", "document"]),
});

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{projectId: string}>},
) {
  const {projectId} = await params;
  return withSiteProjectsSession(request, async (ctx) => {
    const parsed = mediaUploadBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw validationError("Invalid media upload payload", parsed.error.flatten());
    }

    return service.signMediaUpload(ctx, projectId, parsed.data);
  });
}
