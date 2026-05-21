import type {NextRequest} from "next/server";

import {parseJsonBody} from "@/server/site-projects/request-body";
import {withInternalApiKey} from "@/server/site-projects/route-handler";
import {updateScopedApiKey} from "@/server/site-projects/api-keys";
import {updateApiKeyInputSchema} from "@/server/site-projects/api-key-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{keyId: string}>},
) {
  const {keyId} = await params;
  return withInternalApiKey(request, "operator.retry", async (ctx) => {
    const body = await parseJsonBody(request, updateApiKeyInputSchema, {
      maxBytes: 32 * 1024,
      invalidMessage: "Invalid API key update payload",
    });
    return updateScopedApiKey(ctx, keyId, body);
  });
}