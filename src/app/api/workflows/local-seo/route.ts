import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";

import {getSession} from "@/server/auth/session";
import {collections} from "@/server/db/collections";
import {serializeWorkflowExecution} from "@/server/db/schemas/workflow-executions";
import {safetyErrorToResponse} from "@/server/ai/safety";
import {
  startLocalSeoWorkflow,
  runKeywordResearch,
  approveStrategy,
  generatePages,
  approvePublish,
  publishAndDraftSocial,
  type KeywordStrategy,
} from "@/lib/workflows/local-seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Shared auth helper
// ─────────────────────────────────────────────────────────────────────────────

async function requireSession(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return {session: null, user: null, error: NextResponse.json({ok: false, error: {code: "UNAUTHORIZED", message: "Authentication required"}}, {status: 401})};
  }
  const users = await collections.users();
  const user = await users.findOne({email: session.email.toLowerCase()});
  if (!user) {
    return {session, user: null, error: NextResponse.json({ok: false, error: {code: "USER_NOT_FOUND", message: "User record not found"}}, {status: 403})};
  }
  return {session, user, error: null};
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — Scene 1: Start a new local SEO workflow
// Body: { clientOrgId: string, intent: string }
// ─────────────────────────────────────────────────────────────────────────────

const startSchema = z.object({
  clientOrgId: z.string().min(1, "clientOrgId is required"),
  intent: z.string().min(3, "intent must be at least 3 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const {session, user, error} = await requireSession(request);
    if (error) return error;

    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {ok: false, error: {code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join(", ")}},
        {status: 400},
      );
    }

    const {clientOrgId, intent} = parsed.data;

    // Scene 1: create workflow record
    const workflowId = await startLocalSeoWorkflow({
      whiteLabelerId: user!.organizationId ?? "",
      clientOrgId,
      intent,
      triggeredBy: session!.email,
    });

    // Scene 2: immediately run keyword research (async — could be backgrounded)
    const strategy = await runKeywordResearch(workflowId, intent);

    return NextResponse.json({
      ok: true,
      workflowId,
      status: "strategy_pending_approval",
      strategy,
      message: "Workflow started. Keyword strategy is ready for agency review.",
    });
  } catch (err) {
    const {status, body} = safetyErrorToResponse(err);
    if (status === 403) return NextResponse.json(body, {status});
    console.error("[local-seo] POST error:", err);
    return NextResponse.json({ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, {status: 500});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Advance workflow to next scene
// Body: { action: "approve_strategy" | "generate_pages" | "approve_publish" | "publish" }
// ─────────────────────────────────────────────────────────────────────────────

const advanceSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve_strategy"),
    workflowId: z.string().min(1),
  }),
  z.object({
    action: z.literal("generate_pages"),
    workflowId: z.string().min(1),
  }),
  z.object({
    action: z.literal("approve_publish"),
    workflowId: z.string().min(1),
    approvalId: z.string().min(1),
    orgId: z.string().min(1),
  }),
  z.object({
    action: z.literal("publish"),
    workflowId: z.string().min(1),
    approvalId: z.string().min(1),
    orgId: z.string().min(1),
  }),
]);

export async function PATCH(request: NextRequest) {
  try {
    const {session, user, error} = await requireSession(request);
    if (error) return error;

    const body = await request.json();
    const parsed = advanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {ok: false, error: {code: "VALIDATION_ERROR", message: parsed.error.issues.map((i) => i.message).join(", ")}},
        {status: 400},
      );
    }

    const input = parsed.data;
    const whiteLabelerId = user!.organizationId ?? "";

    // Scene 3: Agency approves strategy
    if (input.action === "approve_strategy") {
      const approvalId = await approveStrategy(
        input.workflowId,
        session!.email,
        whiteLabelerId,
      );
      return NextResponse.json({ok: true, approvalId, status: "strategy_approved", message: "Strategy approved. Ready to generate pages."});
    }

    // Scene 4: Generate pages from approved strategy
    if (input.action === "generate_pages") {
      const col = await collections.workflowExecutions();
      const execDoc = await col.findOne({_id: input.workflowId as any});
      if (!execDoc) {
        return NextResponse.json({ok: false, error: {code: "NOT_FOUND", message: "Workflow not found"}}, {status: 404});
      }
      // Pull strategy from snapshot v1
      const strategySnapshot = execDoc.snapshots?.find((s: any) => s.version === 1);
      if (!strategySnapshot) {
        return NextResponse.json({ok: false, error: {code: "NO_STRATEGY", message: "No approved strategy snapshot found"}}, {status: 422});
      }
      const strategy = strategySnapshot.payload.strategy as KeywordStrategy;
      const pages = await generatePages(input.workflowId, strategy, execDoc.clientOrgId ?? "");
      return NextResponse.json({ok: true, status: "content_review_pending", pages, message: "Pages generated. Awaiting client approval to publish."});
    }

    // Scene 5: Client approves publish
    if (input.action === "approve_publish") {
      await approvePublish(input.workflowId, input.approvalId, input.orgId, session!.email);
      return NextResponse.json({ok: true, status: "publish_approved", message: "Publish approved. Ready to go live."});
    }

    // Scene 6: Publish pages + draft social posts
    if (input.action === "publish") {
      const col = await collections.workflowExecutions();
      const execDoc = await col.findOne({_id: input.workflowId as any});
      if (!execDoc) {
        return NextResponse.json({ok: false, error: {code: "NOT_FOUND", message: "Workflow not found"}}, {status: 404});
      }
      // Safety check before publish
      await approvePublish(input.workflowId, input.approvalId, input.orgId, session!.email);
      // Pull generated pages from snapshot v2
      const pageSnapshot = execDoc.snapshots?.find((s: any) => s.version === 2);
      const pages = pageSnapshot?.payload?.pages ?? [];
      const result = await publishAndDraftSocial(
        input.workflowId,
        execDoc.clientOrgId ?? "",
        whiteLabelerId,
        pages,
      );
      return NextResponse.json({
        ok: true,
        status: "completed",
        ...result,
        message: `${result.publishedCount} pages published. ${result.socialDraftCount} social post drafts created.`,
      });
    }

    return NextResponse.json({ok: false, error: {code: "UNKNOWN_ACTION", message: "Unknown action"}}, {status: 400});
  } catch (err) {
    const {status, body} = safetyErrorToResponse(err);
    if (status === 403) return NextResponse.json(body, {status});
    console.error("[local-seo] PATCH error:", err);
    return NextResponse.json({ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, {status: 500});
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Fetch workflow status and current snapshot
// Query: ?workflowId=<id>
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const {error} = await requireSession(request);
    if (error) return error;

    const workflowId = request.nextUrl.searchParams.get("workflowId");
    if (!workflowId) {
      return NextResponse.json({ok: false, error: {code: "MISSING_PARAM", message: "workflowId is required"}}, {status: 400});
    }

    const col = await collections.workflowExecutions();
    const doc = await col.findOne({_id: workflowId as any});
    if (!doc) {
      return NextResponse.json({ok: false, error: {code: "NOT_FOUND", message: "Workflow not found"}}, {status: 404});
    }

    return NextResponse.json({ok: true, workflow: serializeWorkflowExecution(doc as any)});
  } catch (err) {
    console.error("[local-seo] GET error:", err);
    return NextResponse.json({ok: false, error: {code: "INTERNAL_ERROR", message: "Internal server error"}}, {status: 500});
  }
}
