import "server-only";

import type {ObjectId} from "mongodb";

import {collections} from "@/server/db/collections";
import {assertCanPublish} from "@/server/ai/safety";

/**
 * Local SEO Workflow Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements the 6-scene workflow from the XEO Architecture planning doc:
 *
 *  Scene 1  →  Client submits intent (keyword focus + location)
 *  Scene 2  →  AI researches keywords and drafts strategy
 *  Scene 3  →  Agency reviews and approves strategy  [approval gate]
 *  Scene 4  →  AI generates page content + metadata  [snapshot saved]
 *  Scene 5  →  Client previews and approves publish  [approval gate]
 *  Scene 6  →  Pages published → social posts drafted
 *
 * Each scene advances the workflow-execution stage and appends an audit log.
 * Snapshots are saved at Scene 4 (generated content) to support rollback.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalSeoIntentInput {
  /** The white-labeler (agency) org ID */
  whiteLabelerId: string;
  /** The client org ID */
  clientOrgId: string;
  /** Raw intent from the client — e.g. "metal roofing in Dallas" */
  intent: string;
  /** Who is triggering (email for audit trail) */
  triggeredBy: string;
}

export interface KeywordStrategy {
  primaryKeywords: string[];
  geoTargets: string[];
  suggestedPages: Array<{
    title: string;
    targetKeyword: string;
    location: string;
    description: string;
  }>;
  reasoning: string;
}

export interface GeneratedPageContent {
  title: string;
  targetKeyword: string;
  location: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

async function appendAuditLog(
  workflowId: string,
  actor: "system" | "user" | "ai",
  action: string,
  description: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const col = await collections.workflowExecutions();
  await col.updateOne(
    {_id: workflowId as unknown as ObjectId},
    {
      $push: {
        auditLogs: {
          timestamp: new Date(),
          actor,
          action,
          description,
          meta: meta ?? {},
        },
      },
      $set: {updatedAt: new Date()},
    },
  );
}

async function advanceStage(
  workflowId: string,
  toStage: string,
  toStatus: "queued" | "running" | "completed" | "failed" | "cancelled" | "pending_approval",
): Promise<void> {
  const col = await collections.workflowExecutions();
  await col.updateOne(
    {_id: workflowId as unknown as ObjectId},
    {
      $set: {stage: toStage, status: toStatus as any, updatedAt: new Date()},
      $push: {
        history: {
          stage: toStage,
          status: toStatus,
          transitionedAt: new Date(),
        },
      },
    },
  );
}

async function saveSnapshot(
  workflowId: string,
  version: number,
  createdBy: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const col = await collections.workflowExecutions();
  await col.updateOne(
    {_id: workflowId as unknown as ObjectId},
    {
      $push: {
        snapshots: {version, createdAt: new Date(), createdBy, payload},
      },
      $set: {updatedAt: new Date()},
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 1 — Client submits intent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new local_seo workflow execution record in `queued` state.
 * Returns the workflowId for all subsequent scene calls.
 */
export async function startLocalSeoWorkflow(input: LocalSeoIntentInput): Promise<string> {
  const col = await collections.workflowExecutions();

  const now = new Date();
  const doc = {
    whiteLabelerId: input.whiteLabelerId,
    clientOrgId: input.clientOrgId,
    intent: input.intent,
    workflowType: "local_seo" as const,
    status: "queued" as const,
    stage: "intent_received",
    history: [{stage: "intent_received", status: "queued", transitionedAt: now}],
    snapshots: [],
    auditLogs: [
      {
        timestamp: now,
        actor: "user" as const,
        action: "workflow_started",
        description: `Local SEO workflow started. Intent: "${input.intent}"`,
        meta: {triggeredBy: input.triggeredBy, clientOrgId: input.clientOrgId},
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.insertOne(doc as any);
  return result.insertedId.toString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 2 — AI researches keywords and builds strategy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a keyword strategy from the client's intent.
 * In production, wire this to your AI provider (Gemini, GPT-4, etc.).
 * Saves the strategy as a snapshot and moves to `pending_approval`.
 */
export async function runKeywordResearch(
  workflowId: string,
  intent: string,
): Promise<KeywordStrategy> {
  await advanceStage(workflowId, "keyword_research", "running");
  await appendAuditLog(workflowId, "ai", "keyword_research_started", `AI researching keywords for: "${intent}"`);

  // ── AI Research (stub — wire to real AI provider) ────────────────────────
  // Production: call Gemini/GPT with intent, location, and client profile.
  // The AI should query search trends, competitor keywords, and geo demand.
  const strategy: KeywordStrategy = await generateKeywordStrategy(intent);

  // Save strategy as snapshot v1
  await saveSnapshot(workflowId, 1, "ai", {strategy, intent});

  // Advance to pending approval (Scene 3)
  await advanceStage(workflowId, "strategy_pending_approval", "pending_approval" as any);
  await appendAuditLog(
    workflowId,
    "ai",
    "keyword_research_complete",
    `Strategy generated with ${strategy.suggestedPages.length} pages. Waiting for agency approval.`,
    {pageCount: strategy.suggestedPages.length},
  );

  return strategy;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 3 — Agency approves strategy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agency reviews the AI keyword strategy and approves it.
 * Creates an Approval record in the database, then triggers page generation.
 */
export async function approveStrategy(
  workflowId: string,
  approvedByEmail: string,
  orgId: string,
): Promise<string> {
  const approvalsCol = await collections.approvals();
  const now = new Date();

  const result = await approvalsCol.insertOne({
    orgId,
    customerId: null,
    customerName: "Agency",
    customerAvatar: null,
    kind: "website" as const,
    summary: `Local SEO strategy approved for workflow ${workflowId}`,
    count: 1,
    payloadRef: workflowId,
    requestedBy: approvedByEmail,
    requestedAt: now,
    dueAt: null,
    status: "approved" as const,
    createdAt: now,
    updatedAt: now,
  } as any);

  const approvalId = result.insertedId.toString();

  await advanceStage(workflowId, "strategy_approved", "running");
  await appendAuditLog(
    workflowId,
    "user",
    "strategy_approved",
    `Strategy approved by ${approvedByEmail}. Approval ID: ${approvalId}`,
    {approvalId, approvedBy: approvedByEmail},
  );

  return approvalId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 4 — AI generates page content + metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI generates the actual page content (copy, H1, meta, schema) for each
 * suggested page from the strategy. Saves a full content snapshot for rollback.
 */
export async function generatePages(
  workflowId: string,
  strategy: KeywordStrategy,
  clientOrgId: string,
): Promise<GeneratedPageContent[]> {
  await advanceStage(workflowId, "content_generation", "running");
  await appendAuditLog(
    workflowId,
    "ai",
    "content_generation_started",
    `Generating ${strategy.suggestedPages.length} pages from approved strategy.`,
  );

  // ── AI Page Generation (stub — wire to real AI provider) ─────────────────
  const pages: GeneratedPageContent[] = await generatePageContent(strategy, clientOrgId);

  // Save full generated content as snapshot v2 (rollback point)
  await saveSnapshot(workflowId, 2, "ai", {pages, generatedAt: new Date().toISOString()});

  // Insert draft website-page records
  const pagesCol = await collections.websitePages();
  for (const page of pages) {
    await pagesCol.insertOne({
      customerOrgId: clientOrgId,
      slug: page.slug,
      title: page.title,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      bodyHtml: page.bodyHtml,
      excerpt: page.metaDescription,
      pageType: "Page" as const,
      status: "Generating" as const,
      views: 0,
      conversion: 0,
      aiGenerated: true,
      publishedAt: null,
      workflowId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  await advanceStage(workflowId, "content_review_pending", "pending_approval" as any);
  await appendAuditLog(
    workflowId,
    "ai",
    "content_generation_complete",
    `${pages.length} pages generated and saved as drafts. Awaiting client preview and approval.`,
    {pageCount: pages.length},
  );

  return pages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 5 — Client approves publish
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Client reviews the generated pages and approves publication.
 * Calls assertCanPublish (AI Safety Guard) before any live deployment.
 */
export async function approvePublish(
  workflowId: string,
  approvalId: string,
  orgId: string,
  approvedByEmail: string,
): Promise<void> {
  // ── AI Safety Guard: must have approved Approval record before publish ──
  await assertCanPublish({orgId, approvalId, actorEmail: approvedByEmail, workflowId});

  await advanceStage(workflowId, "publish_approved", "running");
  await appendAuditLog(
    workflowId,
    "user",
    "publish_approved",
    `Publish approved by ${approvedByEmail} via approvalId=${approvalId}.`,
    {approvalId, approvedBy: approvedByEmail},
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene 6 — Publish pages + draft social posts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pushes all draft pages to `published` status, then creates social post
 * drafts for each page (Facebook, Instagram by default).
 */
export async function publishAndDraftSocial(
  workflowId: string,
  clientOrgId: string,
  whiteLabelerId: string,
  pages: GeneratedPageContent[],
): Promise<{publishedCount: number; socialDraftCount: number}> {
  const pagesCol = await collections.websitePages();
  const socialCol = await collections.socialPosts();
  const now = new Date();

  // Publish all draft pages
  await pagesCol.updateMany(
    {customerOrgId: clientOrgId, workflowId, status: "Generating"},
    {$set: {status: "Published" as const, publishedAt: now, updatedAt: now}},
  );

  // Draft social posts for each page (Facebook + Instagram)
  let socialDraftCount = 0;
  for (const page of pages) {
    const postText = `🚀 New: ${page.title} — ${page.metaDescription}`;
    const platforms = ["facebook", "instagram"] as const;
    for (const platform of platforms) {
      await socialCol.insertOne({
        orgId: whiteLabelerId,
        clientOrgId,
        platform,
        content: postText,
        status: "draft",
        workflowId,
        scheduledAt: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      } as any);
      socialDraftCount++;
    }
  }

  // Mark workflow complete
  await advanceStage(workflowId, "completed", "completed");
  await appendAuditLog(
    workflowId,
    "system",
    "workflow_completed",
    `${pages.length} pages published. ${socialDraftCount} social post drafts created.`,
    {publishedCount: pages.length, socialDraftCount},
  );

  return {publishedCount: pages.length, socialDraftCount};
}

// ─────────────────────────────────────────────────────────────────────────────
// AI stubs — replace with real AI provider calls in production
// ─────────────────────────────────────────────────────────────────────────────

async function generateKeywordStrategy(intent: string): Promise<KeywordStrategy> {
  // TODO: replace with Gemini/GPT-4 call
  // Query: Google Trends, Reddit, competitor keywords, local search demand
  const match = intent.match(/(.+?)\s+in\s+(.+)/i);
  const topic = match?.[1] ?? intent;
  const location = match?.[2] ?? "local area";

  return {
    primaryKeywords: [
      `${topic} ${location}`,
      `best ${topic} ${location}`,
      `${topic} near me`,
      `affordable ${topic} ${location}`,
    ],
    geoTargets: [location],
    suggestedPages: [
      {
        title: `${topic} Services in ${location}`,
        targetKeyword: `${topic} ${location}`,
        location,
        description: `Main service page targeting primary keyword`,
      },
      {
        title: `Best ${topic} Company in ${location}`,
        targetKeyword: `best ${topic} ${location}`,
        location,
        description: `Competitive positioning page`,
      },
      {
        title: `Affordable ${topic} in ${location}`,
        targetKeyword: `affordable ${topic} ${location}`,
        location,
        description: `Price-focused landing page`,
      },
    ],
    reasoning: `Generated from intent: "${intent}". Focus on local search intent in ${location}.`,
  };
}

async function generatePageContent(
  strategy: KeywordStrategy,
  clientOrgId: string,
): Promise<GeneratedPageContent[]> {
  // TODO: replace with Gemini/GPT-4 call for full page copywriting
  return strategy.suggestedPages.map((page) => ({
    title: page.title,
    targetKeyword: page.targetKeyword,
    location: page.location,
    slug: page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    metaTitle: `${page.title} | Professional Services`,
    metaDescription: `Looking for ${page.targetKeyword}? We provide professional, reliable services in ${page.location}. Contact us today.`,
    h1: page.title,
    bodyHtml: `<h1>${page.title}</h1><p>Professional ${page.targetKeyword} services in ${page.location}. Call us today for a free consultation.</p>`,
  }));
}
