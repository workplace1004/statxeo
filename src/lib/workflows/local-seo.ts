import "server-only";

import {generateObject} from "ai";
import {openai} from "@ai-sdk/openai";
import {z} from "zod";

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
// Real AI Generation — OpenAI (GPT-4o)
// ─────────────────────────────────────────────────────────────────────────────

async function generateKeywordStrategy(intent: string): Promise<KeywordStrategy> {
  const result = await generateObject({
    model: openai("gpt-4o"),
    system: `You are an expert local SEO strategist. Your job is to create a keyword strategy and suggest pages based on the client's intent. 
Focus on high-conversion local search intent. Suggest exactly 3-5 pages to create. 
Identify the primary location, primary keywords, and the reasoning for the strategy.`,
    prompt: `The client intent is: "${intent}". Develop a local SEO strategy for them.`,
    schema: z.object({
      primaryKeywords: z.array(z.string()).describe("A list of 4-6 primary high-value keywords to target."),
      geoTargets: z.array(z.string()).describe("The main geographical locations or areas to target."),
      suggestedPages: z.array(z.object({
        title: z.string().describe("The exact H1 / Title of the suggested page."),
        targetKeyword: z.string().describe("The primary keyword this specific page targets."),
        location: z.string().describe("The location this page targets."),
        description: z.string().describe("A short explanation of what this page is for and why it's valuable.")
      })).describe("3-5 highly relevant pages to create."),
      reasoning: z.string().describe("A brief explanation of why this strategy will drive local conversions.")
    }),
  });

  return result.object;
}

async function generatePageContent(
  strategy: KeywordStrategy,
  clientOrgId: string,
): Promise<GeneratedPageContent[]> {
  const result = await generateObject({
    model: openai("gpt-4o"),
    system: `You are an expert SEO copywriter. You have been given a Local SEO strategy containing a list of pages to create.
Your job is to write the complete, final website content for EACH of those pages.
The HTML body should use standard tags (<h2>, <h3>, <p>, <ul>, <li>, <strong>) and be structured for conversions. Do not include <html>, <head>, or <body> tags, just the inner HTML. Do NOT include an <h1> tag in the body, as it will be rendered separately.
Write professional, persuasive copy that targets the specified keyword and location. Write 200-400 words per page.`,
    prompt: `Generate the final page content for the following local SEO strategy:
${JSON.stringify(strategy, null, 2)}

Provide the content for every suggested page in the strategy.`,
    schema: z.object({
      pages: z.array(z.object({
        title: z.string().describe("The exact title of the page."),
        targetKeyword: z.string().describe("The keyword being targeted."),
        location: z.string().describe("The location being targeted."),
        slug: z.string().describe("The URL slug (e.g. 'roofing-dallas')."),
        metaTitle: z.string().describe("The SEO meta title (max 60 chars)."),
        metaDescription: z.string().describe("The SEO meta description (max 160 chars)."),
        h1: z.string().describe("The H1 heading for the page."),
        bodyHtml: z.string().describe("The HTML content for the body of the page (no h1, just h2/p/ul/etc).")
      }))
    })
  });

  return result.object.pages;
}
