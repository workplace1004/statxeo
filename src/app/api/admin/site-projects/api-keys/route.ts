import type {NextRequest} from "next/server";

import {createScopedApiKey} from "@/server/site-projects/api-keys";
import {createApiKeyInputSchema} from "@/server/site-projects/api-key-schemas";
import {parseJsonBody} from "@/server/site-projects/request-body";
import {withInternalApiKey} from "@/server/site-projects/route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withInternalApiKey(request, "operator.retry", async (ctx) => {
    const body = await parseJsonBody(request, createApiKeyInputSchema, {
      maxBytes: 32 * 1024,
      invalidMessage: "Invalid API key creation payload",
    });
    return createScopedApiKey(ctx, body);
  });
}