import "server-only";

import type {Collection, Document} from "mongodb";

import type {AiActivityDoc} from "./schemas/ai-activity";
import type {AiSettingDoc} from "./schemas/ai-settings";
import type {AiTaskDoc} from "./schemas/ai-tasks";
import type {
  ActivityLogEntryDoc,
  AgencyTeamMemberDoc,
} from "./schemas/agency-team";
import type {ApprovalDoc} from "./schemas/approvals";
import type {
  BrandAssetDoc,
  BrandPaletteDoc,
  BrandVoiceDoc,
  BrandedDomainDoc,
} from "./schemas/branding";
import type {BusinessProfileDoc} from "./schemas/business-profile";
import type {CallDoc, PhoneNumberDoc} from "./schemas/calls";
import type {ChatMessageDoc} from "./schemas/chat-messages";
import type {CommissionDoc, PayoutDoc} from "./schemas/commissions";
import type {CompetitorDoc} from "./schemas/competitors";
import type {CustomerKeywordDoc} from "./schemas/customer-keywords";
import type {CustomerTeamMemberDoc} from "./schemas/customer-team";
import type {CustomerDoc} from "./schemas/customers";
import type {DomainDoc} from "./schemas/domains";
import type {IntegrationDoc} from "./schemas/integrations";
import type {InvoiceDoc} from "./schemas/invoices";
import type {KeywordDoc} from "./schemas/keywords";
import type {LeadDoc} from "./schemas/leads";
import type {MarketingAssetDoc} from "./schemas/marketing-assets";
import type {MeetingDoc} from "./schemas/meetings";
import type {NotificationPreferenceDoc} from "./schemas/notification-preferences";
import type {
  OnboardingFlowDoc,
  OnboardingStepDoc,
  ServiceOptionDoc,
} from "./schemas/onboarding";
import type {OrganizationDoc} from "./schemas/organizations";
import type {PlanDoc} from "./schemas/plans";
import type {ReferralLinkDoc} from "./schemas/referral-links";
import type {RevenueEventDoc} from "./schemas/revenue-events";
import type {ReviewDoc} from "./schemas/reviews";
import type {SiteDoc} from "./schemas/sites";
import type {SocialPostDoc} from "./schemas/social-posts";
import type {
  FaqDoc,
  KnowledgeArticleDoc,
  SupportTicketDoc,
} from "./schemas/support-tickets";
import type {TrainingModuleDoc, TrainingProgressDoc} from "./schemas/training";
import type {UserDoc} from "./schemas/users";
import type {WebsitePageDoc} from "./schemas/website-pages";
import type {WorkflowDoc} from "./schemas/workflows";
<<<<<<< Updated upstream
=======
import type {CampaignDoc} from "./schemas/campaigns";
import type {WorkflowExecutionDoc} from "./schemas/workflow-executions";
>>>>>>> Stashed changes

import {getDb} from "./database";

/** Names for every collection. Source of truth for `ensureIndexes` and queries. */
export const COLLECTION_NAMES = {
  activityLog: "activityLog",
  agencyTeam: "agencyTeam",
  aiActivity: "aiActivity",
  aiSettings: "aiSettings",
  aiTasks: "aiTasks",
  approvals: "approvals",
  brandAssets: "brandAssets",
  brandPalettes: "brandPalettes",
  brandVoices: "brandVoices",
  brandedDomains: "brandedDomains",
  businessProfiles: "businessProfiles",
  calls: "calls",
  chatMessages: "chatMessages",
  commissions: "commissions",
  competitors: "competitors",
  customerKeywords: "customerKeywords",
  customerTeam: "customerTeam",
  customers: "customers",
  domains: "domains",
  faqs: "faqs",
  integrations: "integrations",
  invoices: "invoices",
  knowledgeArticles: "knowledgeArticles",
  keywords: "keywords",
  leads: "leads",
  marketingAssets: "marketingAssets",
  meetings: "meetings",
  notificationPreferences: "notificationPreferences",
  onboardingFlows: "onboardingFlows",
  onboardingSteps: "onboardingSteps",
  organizations: "organizations",
  payouts: "payouts",
  phoneNumbers: "phoneNumbers",
  plans: "plans",
  referralLinks: "referralLinks",
  revenueEvents: "revenueEvents",
  reviews: "reviews",
  serviceOptions: "serviceOptions",
  sites: "sites",
  socialPosts: "socialPosts",
  supportTickets: "supportTickets",
  trainingModules: "trainingModules",
  trainingProgress: "trainingProgress",
  users: "users",
  websitePages: "websitePages",
  workflows: "workflows",
<<<<<<< Updated upstream
=======
  campaigns: "campaigns",
  workflowExecutions: "workflowExecutions",
>>>>>>> Stashed changes
} as const;

export type CollectionName = (typeof COLLECTION_NAMES)[keyof typeof COLLECTION_NAMES];

async function coll<T extends Document>(name: CollectionName): Promise<Collection<T>> {
  const db = await getDb();

  return db.collection<T>(name);
}

export const collections = {
  activityLog: () => coll<ActivityLogEntryDoc>(COLLECTION_NAMES.activityLog),
  agencyTeam: () => coll<AgencyTeamMemberDoc>(COLLECTION_NAMES.agencyTeam),
  aiActivity: () => coll<AiActivityDoc>(COLLECTION_NAMES.aiActivity),
  aiSettings: () => coll<AiSettingDoc>(COLLECTION_NAMES.aiSettings),
  aiTasks: () => coll<AiTaskDoc>(COLLECTION_NAMES.aiTasks),
  approvals: () => coll<ApprovalDoc>(COLLECTION_NAMES.approvals),
  brandAssets: () => coll<BrandAssetDoc>(COLLECTION_NAMES.brandAssets),
  brandPalettes: () => coll<BrandPaletteDoc>(COLLECTION_NAMES.brandPalettes),
  brandVoices: () => coll<BrandVoiceDoc>(COLLECTION_NAMES.brandVoices),
  brandedDomains: () => coll<BrandedDomainDoc>(COLLECTION_NAMES.brandedDomains),
  businessProfiles: () => coll<BusinessProfileDoc>(COLLECTION_NAMES.businessProfiles),
  calls: () => coll<CallDoc>(COLLECTION_NAMES.calls),
  chatMessages: () => coll<ChatMessageDoc>(COLLECTION_NAMES.chatMessages),
  commissions: () => coll<CommissionDoc>(COLLECTION_NAMES.commissions),
  competitors: () => coll<CompetitorDoc>(COLLECTION_NAMES.competitors),
  customerKeywords: () => coll<CustomerKeywordDoc>(COLLECTION_NAMES.customerKeywords),
  customerTeam: () => coll<CustomerTeamMemberDoc>(COLLECTION_NAMES.customerTeam),
  customers: () => coll<CustomerDoc>(COLLECTION_NAMES.customers),
  domains: () => coll<DomainDoc>(COLLECTION_NAMES.domains),
  faqs: () => coll<FaqDoc>(COLLECTION_NAMES.faqs),
  integrations: () => coll<IntegrationDoc>(COLLECTION_NAMES.integrations),
  invoices: () => coll<InvoiceDoc>(COLLECTION_NAMES.invoices),
  knowledgeArticles: () => coll<KnowledgeArticleDoc>(COLLECTION_NAMES.knowledgeArticles),
  keywords: () => coll<KeywordDoc>(COLLECTION_NAMES.keywords),
  leads: () => coll<LeadDoc>(COLLECTION_NAMES.leads),
  marketingAssets: () => coll<MarketingAssetDoc>(COLLECTION_NAMES.marketingAssets),
  meetings: () => coll<MeetingDoc>(COLLECTION_NAMES.meetings),
  notificationPreferences: () =>
    coll<NotificationPreferenceDoc>(COLLECTION_NAMES.notificationPreferences),
  onboardingFlows: () => coll<OnboardingFlowDoc>(COLLECTION_NAMES.onboardingFlows),
  onboardingSteps: () => coll<OnboardingStepDoc>(COLLECTION_NAMES.onboardingSteps),
  organizations: () => coll<OrganizationDoc>(COLLECTION_NAMES.organizations),
  payouts: () => coll<PayoutDoc>(COLLECTION_NAMES.payouts),
  phoneNumbers: () => coll<PhoneNumberDoc>(COLLECTION_NAMES.phoneNumbers),
  plans: () => coll<PlanDoc>(COLLECTION_NAMES.plans),
  referralLinks: () => coll<ReferralLinkDoc>(COLLECTION_NAMES.referralLinks),
  revenueEvents: () => coll<RevenueEventDoc>(COLLECTION_NAMES.revenueEvents),
  reviews: () => coll<ReviewDoc>(COLLECTION_NAMES.reviews),
  serviceOptions: () => coll<ServiceOptionDoc>(COLLECTION_NAMES.serviceOptions),
  sites: () => coll<SiteDoc>(COLLECTION_NAMES.sites),
  socialPosts: () => coll<SocialPostDoc>(COLLECTION_NAMES.socialPosts),
  supportTickets: () => coll<SupportTicketDoc>(COLLECTION_NAMES.supportTickets),
  trainingModules: () => coll<TrainingModuleDoc>(COLLECTION_NAMES.trainingModules),
  trainingProgress: () => coll<TrainingProgressDoc>(COLLECTION_NAMES.trainingProgress),
  users: () => coll<UserDoc>(COLLECTION_NAMES.users),
  websitePages: () => coll<WebsitePageDoc>(COLLECTION_NAMES.websitePages),
  workflows: () => coll<WorkflowDoc>(COLLECTION_NAMES.workflows),
<<<<<<< Updated upstream
=======
  campaigns: () => coll<CampaignDoc>(COLLECTION_NAMES.campaigns),
  workflowExecutions: () => coll<WorkflowExecutionDoc>(COLLECTION_NAMES.workflowExecutions),
>>>>>>> Stashed changes
} as const;
