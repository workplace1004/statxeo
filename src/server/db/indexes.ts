import "server-only";

import {collections} from "./collections";

export interface EnsureIndexesResult {
  created: Record<string, string[]>;
  errors: Array<{collection: string; message: string}>;
}

/**
 * Idempotently create the indexes that back the live queries. Safe to call
 * multiple times — MongoDB will skip already-existing indexes that share the
 * same spec.
 *
 * Call this once after deploy via the `POST /api/admin/ensure-indexes` route.
 * Do NOT call on every cold start.
 */
export async function ensureIndexes(): Promise<EnsureIndexesResult> {
  const created: Record<string, string[]> = {};
  const errors: EnsureIndexesResult["errors"] = [];

  async function safeCreate(
    name: string,
    fn: () => Promise<string[]>,
  ): Promise<void> {
    try {
      created[name] = await fn();
    } catch (e) {
      errors.push({collection: name, message: (e as Error).message});
    }
  }

  await safeCreate("users", async () => {
    const c = await collections.users();

    return c.createIndexes([
      {key: {email: 1}, name: "users_email_unique", unique: true},
      {key: {googleSub: 1}, name: "users_google_sub_unique", unique: true, sparse: true},
      {key: {organizationId: 1, role: 1}, name: "users_org_role"},
    ]);
  });

  await safeCreate("organizations", async () => {
    const c = await collections.organizations();

    return c.createIndexes([
      {key: {type: 1, name: 1}, name: "orgs_type_name"},
      {key: {ownerUserId: 1}, name: "orgs_owner"},
    ]);
  });

  await safeCreate("customers", async () => {
    const c = await collections.customers();

    return c.createIndexes([
      {key: {agencyOrgId: 1, status: 1}, name: "customers_org_status"},
      {key: {agencyOrgId: 1, lastActivityAt: -1}, name: "customers_org_lastActivity"},
      {key: {agencyOrgId: 1, mrrCents: -1}, name: "customers_org_mrr"},
    ]);
  });

  await safeCreate("sites", async () => {
    const c = await collections.sites();

    return c.createIndexes([
      {key: {agencyOrgId: 1, status: 1}, name: "sites_org_status"},
      {key: {customerId: 1}, name: "sites_customer"},
    ]);
  });

  await safeCreate("keywords", async () => {
    const c = await collections.keywords();

    return c.createIndexes([
      {key: {customerId: 1, term: 1}, name: "keywords_customer_term", unique: true},
      {key: {customerId: 1, rank: 1}, name: "keywords_customer_rank"},
      {key: {agencyOrgId: 1, lastCheckedAt: -1}, name: "keywords_org_lastChecked"},
    ]);
  });

  await safeCreate("socialPosts", async () => {
    const c = await collections.socialPosts();

    return c.createIndexes([
      {key: {customerId: 1, scheduledFor: 1}, name: "social_customer_scheduled"},
      {key: {customerOrgId: 1, scheduledFor: 1}, name: "social_customerOrg_scheduled"},
      {key: {agencyOrgId: 1, status: 1}, name: "social_org_status"},
    ]);
  });

  await safeCreate("workflows", async () => {
    const c = await collections.workflows();

    return c.createIndexes([
      {key: {agencyOrgId: 1, status: 1}, name: "workflows_org_status"},
      {key: {agencyOrgId: 1, updatedAt: -1}, name: "workflows_org_updated"},
    ]);
  });

  await safeCreate("revenueEvents", async () => {
    const c = await collections.revenueEvents();

    return c.createIndexes([{key: {orgId: 1, occurredAt: -1}, name: "revenue_org_occurred"}]);
  });

  await safeCreate("aiActivity", async () => {
    const c = await collections.aiActivity();

    return c.createIndexes([
      {key: {orgId: 1, occurredAt: -1}, name: "aiactivity_org_occurred"},
      // Keep activity feed clean — auto-expire entries after 180 days.
      {
        key: {occurredAt: 1},
        name: "aiactivity_ttl",
        expireAfterSeconds: 60 * 60 * 24 * 180,
      },
    ]);
  });

  await safeCreate("approvals", async () => {
    const c = await collections.approvals();

    return c.createIndexes([
      {key: {orgId: 1, status: 1, dueAt: 1}, name: "approvals_org_status_due"},
    ]);
  });

  await safeCreate("agencyTeam", async () => {
    const c = await collections.agencyTeam();

    return c.createIndexes([{key: {agencyOrgId: 1, status: 1}, name: "agencyTeam_org_status"}]);
  });

  await safeCreate("activityLog", async () => {
    const c = await collections.activityLog();

    return c.createIndexes([
      {key: {agencyOrgId: 1, occurredAt: -1}, name: "activitylog_org_occurred"},
    ]);
  });

  await safeCreate("invoices", async () => {
    const c = await collections.invoices();

    return c.createIndexes([
      {key: {orgId: 1, issuedAt: -1}, name: "invoices_org_issued"},
      {key: {orgId: 1, status: 1}, name: "invoices_org_status"},
    ]);
  });

  await safeCreate("referralLinks", async () => {
    const c = await collections.referralLinks();

    return c.createIndexes([
      {key: {affiliateUserId: 1, status: 1}, name: "links_aff_status"},
      {key: {slug: 1}, name: "links_slug_unique", unique: true},
    ]);
  });

  await safeCreate("leads", async () => {
    const c = await collections.leads();

    return c.createIndexes([
      {key: {affiliateUserId: 1, stage: 1}, name: "leads_aff_stage"},
      {key: {affiliateUserId: 1, updatedAt: -1}, name: "leads_aff_updated"},
    ]);
  });

  await safeCreate("commissions", async () => {
    const c = await collections.commissions();

    return c.createIndexes([
      {key: {affiliateUserId: 1, status: 1}, name: "commissions_aff_status"},
      {key: {affiliateUserId: 1, closedDate: -1}, name: "commissions_aff_closed"},
    ]);
  });

  await safeCreate("payouts", async () => {
    const c = await collections.payouts();

    return c.createIndexes([
      {key: {affiliateUserId: 1, scheduledFor: -1}, name: "payouts_aff_scheduled"},
    ]);
  });

  await safeCreate("meetings", async () => {
    const c = await collections.meetings();

    return c.createIndexes([
      {key: {affiliateUserId: 1, scheduledFor: 1}, name: "meetings_aff_scheduled"},
    ]);
  });

  await safeCreate("marketingAssets", async () => {
    const c = await collections.marketingAssets();

    return c.createIndexes([
      {key: {type: 1, updatedAt: -1}, name: "assets_type_updated"},
      {key: {tags: 1}, name: "assets_tags"},
    ]);
  });

  await safeCreate("trainingModules", async () => {
    const c = await collections.trainingModules();

    return c.createIndexes([
      {key: {category: 1, isRequired: -1}, name: "training_cat_required"},
    ]);
  });

  await safeCreate("trainingProgress", async () => {
    const c = await collections.trainingProgress();

    return c.createIndexes([
      {key: {userId: 1, moduleId: 1}, name: "progress_user_module", unique: true},
    ]);
  });

  await safeCreate("plans", async () => {
    const c = await collections.plans();

    return c.createIndexes([{key: {slug: 1}, name: "plans_slug_unique", unique: true}]);
  });

  await safeCreate("customerKeywords", async () => {
    const c = await collections.customerKeywords();

    return c.createIndexes([
      {
        key: {customerOrgId: 1, keyword: 1},
        name: "ckw_org_keyword",
        unique: true,
      },
      {key: {customerOrgId: 1, position: 1}, name: "ckw_org_position"},
    ]);
  });

  await safeCreate("competitors", async () => {
    const c = await collections.competitors();

    return c.createIndexes([
      {key: {customerOrgId: 1, visibility: -1}, name: "competitors_org_visibility"},
    ]);
  });

  await safeCreate("reviews", async () => {
    const c = await collections.reviews();

    return c.createIndexes([
      {key: {customerOrgId: 1, postedAt: -1}, name: "reviews_org_posted"},
      {key: {customerOrgId: 1, rating: 1}, name: "reviews_org_rating"},
    ]);
  });

  await safeCreate("calls", async () => {
    const c = await collections.calls();

    return c.createIndexes([
      {key: {customerOrgId: 1, startedAt: -1}, name: "calls_org_started"},
      {key: {customerOrgId: 1, tag: 1}, name: "calls_org_tag"},
    ]);
  });

  await safeCreate("phoneNumbers", async () => {
    const c = await collections.phoneNumbers();

    return c.createIndexes([
      {key: {customerOrgId: 1, isPrimary: -1}, name: "phones_org_primary"},
      {key: {e164: 1}, name: "phones_e164_unique", unique: true},
    ]);
  });

  await safeCreate("aiTasks", async () => {
    const c = await collections.aiTasks();

    return c.createIndexes([
      {key: {customerOrgId: 1, status: 1, createdAt: -1}, name: "aitasks_org_status"},
    ]);
  });

  await safeCreate("aiSettings", async () => {
    const c = await collections.aiSettings();

    return c.createIndexes([
      {key: {customerOrgId: 1, key: 1}, name: "aisettings_org_key", unique: true},
    ]);
  });

  await safeCreate("integrations", async () => {
    const c = await collections.integrations();

    return c.createIndexes([
      {key: {orgId: 1, kind: 1}, name: "integrations_org_kind", unique: true},
    ]);
  });

  await safeCreate("customerTeam", async () => {
    const c = await collections.customerTeam();

    return c.createIndexes([
      {key: {customerOrgId: 1, role: 1}, name: "customerTeam_org_role"},
    ]);
  });

  await safeCreate("domains", async () => {
    const c = await collections.domains();

    return c.createIndexes([
      {key: {customerOrgId: 1, isPrimary: -1}, name: "domains_org_primary"},
    ]);
  });

  await safeCreate("websitePages", async () => {
    const c = await collections.websitePages();

    return c.createIndexes([
      {key: {customerOrgId: 1, slug: 1}, name: "pages_org_slug", unique: true},
      {key: {customerOrgId: 1, status: 1}, name: "pages_org_status"},
    ]);
  });

  await safeCreate("chatMessages", async () => {
    const c = await collections.chatMessages();

    return c.createIndexes([
      {key: {customerOrgId: 1, conversationId: 1, sentAt: 1}, name: "chat_org_conv_sent"},
    ]);
  });

  await safeCreate("supportTickets", async () => {
    const c = await collections.supportTickets();

    return c.createIndexes([
      {key: {audience: 1, orgId: 1, lastUpdatedAt: -1}, name: "tickets_audience_org"},
      {key: {audience: 1, userId: 1, lastUpdatedAt: -1}, name: "tickets_audience_user"},
    ]);
  });

  await safeCreate("notificationPreferences", async () => {
    const c = await collections.notificationPreferences();

    return c.createIndexes([
      {key: {orgId: 1, key: 1}, name: "notifprefs_org_key"},
      {key: {userId: 1, key: 1}, name: "notifprefs_user_key"},
    ]);
  });

  await safeCreate("brandPalettes", async () => {
    const c = await collections.brandPalettes();

    return c.createIndexes([{key: {agencyOrgId: 1}, name: "palettes_org"}]);
  });

  await safeCreate("brandAssets", async () => {
    const c = await collections.brandAssets();

    return c.createIndexes([{key: {agencyOrgId: 1, key: 1}, name: "brand_assets_org_key"}]);
  });

  await safeCreate("brandedDomains", async () => {
    const c = await collections.brandedDomains();

    return c.createIndexes([
      {key: {agencyOrgId: 1, type: 1}, name: "branded_domains_org_type"},
    ]);
  });

  await safeCreate("brandVoices", async () => {
    const c = await collections.brandVoices();

    return c.createIndexes([
      {key: {agencyOrgId: 1, customerId: 1}, name: "voices_org_customer"},
    ]);
  });

  await safeCreate("onboardingFlows", async () => {
    const c = await collections.onboardingFlows();

    return c.createIndexes([
      {key: {agencyOrgId: 1, currentStep: 1}, name: "onbflows_org_step"},
    ]);
  });

  await safeCreate("onboardingSteps", async () => {
    const c = await collections.onboardingSteps();

    return c.createIndexes([
      {key: {agencyOrgId: 1, position: 1}, name: "onbsteps_org_position"},
    ]);
  });

  await safeCreate("serviceOptions", async () => {
    const c = await collections.serviceOptions();

    return c.createIndexes([
      {key: {agencyOrgId: 1, position: 1}, name: "services_org_position"},
    ]);
  });

  await safeCreate("knowledgeArticles", async () => {
    const c = await collections.knowledgeArticles();

    return c.createIndexes([{key: {audience: 1, category: 1}, name: "kb_audience_category"}]);
  });

  await safeCreate("faqs", async () => {
    const c = await collections.faqs();

    return c.createIndexes([{key: {audience: 1, position: 1}, name: "faqs_audience_position"}]);
  });

  const {ensureSiteProjectIndexes} = await import("../site-projects/site-project-indexes");
  const siteProjectIndexResult = await ensureSiteProjectIndexes();
  Object.assign(created, siteProjectIndexResult.created);
  errors.push(...siteProjectIndexResult.errors);

  return {created, errors};
}
