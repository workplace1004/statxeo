"use client";

import {useState} from "react";
import {
  Card,
  Button,
  Spinner,
  Chip,
} from "@heroui/react";
import {
  Sparkles,
  Check,
  Globe,
  FileText,
  ChevronRight,
  ChartLine,
} from "@gravity-ui/icons";
import {motion, AnimatePresence} from "motion/react";
import {SeoPagePreviewModal, type GeneratedPageContent} from "./modals/seo-page-preview-modal";
import {notifySuccess, notifyError} from "../../lib/ui/white-label-notify";

export interface SeoWorkflowWizardProps {
  activeWorkflow: any;
  clientOrgId: string;
  onRefresh: () => void;
}

export function SeoWorkflowWizard({
  activeWorkflow,
  clientOrgId,
  onRefresh,
}: SeoWorkflowWizardProps) {
  const [intent, setIntent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPage, setPreviewPage] = useState<GeneratedPageContent | null>(null);

  // Track if we are currently loading an API action
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const workflowId = activeWorkflow?.id;
  const stage = activeWorkflow?.stage;
  const status = activeWorkflow?.status;

  // Extracted data from snapshots
  const strategy = activeWorkflow?.snapshots?.find((s: any) => s.version === 1)?.payload?.strategy;
  const pages = activeWorkflow?.snapshots?.find((s: any) => s.version === 2)?.payload?.pages || [];

  // 1. Submit campaign intent (Scene 1 -> Scene 2)
  const handleSubmitIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim() || intent.trim().length < 3) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workflows/local-seo", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({clientOrgId, intent: intent.trim()}),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error?.message || "Failed to start SEO campaign");
      }
      notifySuccess("AI campaign initiated successfully!");
      setIntent("");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      notifyError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Approve Strategy & Generate Pages (Scene 3 -> Scene 4 -> Scene 5)
  const handleApproveStrategy = async () => {
    if (!workflowId) return;
    setLoadingAction("approving");
    try {
      // Step 1: Approve the strategy
      const approveRes = await fetch("/api/workflows/local-seo", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: "approve_strategy", workflowId}),
      });
      const approveData = await approveRes.json();
      if (!approveData.ok) {
        throw new Error(approveData.error?.message || "Failed to approve strategy");
      }

      // Step 2: Trigger copywriting generation
      setLoadingAction("generating_pages");
      const genRes = await fetch("/api/workflows/local-seo", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: "generate_pages", workflowId}),
      });
      const genData = await genRes.json();
      if (!genData.ok) {
        throw new Error(genData.error?.message || "Failed to generate pages");
      }

      notifySuccess("Keyword strategy approved! Starting AI copy generation...");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      notifyError(err.message || "Failed to complete strategy approval");
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Publish Pages & Draft Social Posts (Scene 5 -> Scene 6)
  const handlePublish = async () => {
    if (!workflowId) return;
    setLoadingAction("publishing");
    try {
      const res = await fetch("/api/workflows/local-seo", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: "publish", workflowId}),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error?.message || "Failed to publish pages");
      }
      notifySuccess("SEO pages published and social drafts created!");
      onRefresh();
    } catch (err: any) {
      console.error(err);
      notifyError(err.message || "Failed to publish");
    } finally {
      setLoadingAction(null);
    }
  };

  // Render current scene
  const renderScene = () => {
    // Scene 1: Not started / Completed / Cancelled
    if (!activeWorkflow || status === "completed" || status === "failed" || status === "cancelled") {
      if (status === "completed") {
        return (
          <motion.div
            key="scene-completed"
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            className="flex flex-col md:flex-row items-center justify-between gap-6 p-2"
          >
            <div className="flex items-center gap-4">
              <div className="bg-success/10 text-success flex size-12 shrink-0 items-center justify-center rounded-2xl">
                <Check className="size-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-foreground font-semibold text-lg">AI Local SEO Campaign Live</h3>
                <p className="text-muted text-sm max-w-xl">
                  Your pages are live and indexing. Social media drafts for Facebook & Instagram are waiting in your Queue.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  // Allow starting another campaign by resetting
                  onRefresh();
                }}
              >
                Start Another Campaign
              </Button>
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div
          key="scene-start"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-2"
        >
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-accent/10 text-accent flex size-8 items-center justify-center rounded-lg">
                <Sparkles className="size-4" />
              </span>
              <h3 className="text-foreground font-semibold text-base">Launch an AI-Driven Local SEO Campaign</h3>
            </div>
            <p className="text-muted text-xs leading-relaxed">
              Target local high-intent keywords to dominate search results. The AI will research keywords, generate inner service pages, write SEO metadata, and draft matching social updates.
            </p>
          </div>

          <form onSubmit={handleSubmitIntent} className="flex w-full md:w-auto items-center gap-2 shrink-0">
            <input
              type="text"
              aria-label="Target SEO Intent"
              placeholder="e.g. HVAC repair in Chicago"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="min-w-[240px] md:min-w-[280px] bg-content2 border border-border/40 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isDisabled={isSubmitting || !intent.trim() || intent.trim().length < 3}
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              Launch Campaign
            </Button>
          </form>
        </motion.div>
      );
    }

    // Scene 2 & 3: Researching / Strategy Pending Approval
    if (stage === "intent_received" || stage === "keyword_research" || (stage === "strategy_pending_approval" && !strategy)) {
      return (
        <motion.div
          key="scene-researching"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          className="flex flex-col items-center justify-center py-6 text-center gap-3"
        >
          <Spinner size="md" />
          <div className="flex flex-col gap-1">
            <h4 className="text-foreground font-semibold text-sm">AI Keyword & Competitor Research</h4>
            <p className="text-muted text-xs max-w-md">
              AI is scanning local search volume, difficulty, and competitors to formulate your targeting strategy. This will take a moment...
            </p>
          </div>
        </motion.div>
      );
    }

    if (stage === "strategy_pending_approval" && strategy) {
      return (
        <motion.div
          key="scene-strategy-review"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          className="flex flex-col gap-5 p-2"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Chip size="sm" color="warning" variant="soft" className="font-semibold">Scene 2 & 3: Strategy Review</Chip>
                <h4 className="text-foreground font-semibold text-base">Verify AI Keywords & Geotargets</h4>
              </div>
              <p className="text-muted text-xs">
                Review the researched plan before AI begins drafting page copywriting.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                isDisabled={loadingAction === "approving" || loadingAction === "generating_pages"}
                onPress={handleApproveStrategy}
              >
                {loadingAction === "approving" || loadingAction === "generating_pages" ? (
                  <>
                    <Spinner size="sm" className="mr-1.5" />
                    Generating...
                  </>
                ) : (
                  "Approve & Generate Content"
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-foreground font-semibold text-xs flex items-center gap-1.5">
                  <ChartLine className="size-3.5 text-accent" />
                  Primary Target Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.primaryKeywords?.map((kw: string) => (
                    <Chip key={kw} size="sm" variant="soft" className="text-xs">
                      {kw}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-foreground font-semibold text-xs flex items-center gap-1.5">
                  <Globe className="size-3.5 text-accent" />
                  Targeting Locations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.geoTargets?.map((loc: string) => (
                    <Chip key={loc} size="sm" variant="soft" className="text-xs">
                      {loc}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-content2/50 border border-border/40 rounded-xl p-3">
                <span className="text-foreground font-semibold text-xs">AI Strategy Reasoning</span>
                <p className="text-muted text-xs leading-relaxed">{strategy.reasoning}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-foreground font-semibold text-xs flex items-center gap-1.5">
                <FileText className="size-3.5 text-accent" />
                Proposed Page Architecture
              </span>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {strategy.suggestedPages?.map((p: any, idx: number) => (
                  <div key={idx} className="bg-content2/30 border border-border/30 rounded-lg p-2 flex flex-col gap-1 text-[11px]">
                    <div className="font-semibold text-foreground truncate">{p.title}</div>
                    <div className="text-muted truncate">
                      Keyword: <strong>"{p.targetKeyword}"</strong> ({p.location})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Scene 4: Copywriting Generation running
    if (stage === "strategy_approved" || stage === "content_generation") {
      return (
        <motion.div
          key="scene-generation"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          className="flex flex-col items-center justify-center py-6 text-center gap-3"
        >
          <Spinner size="md" />
          <div className="flex flex-col gap-1">
            <h4 className="text-foreground font-semibold text-sm">AI Page Copywriting & Meta Generation</h4>
            <p className="text-muted text-xs max-w-md">
              AI copywriters are writing conversion-optimized copy, building SEO meta titles, meta descriptions, and drafting slugs. This may take 20-40 seconds.
            </p>
          </div>
        </motion.div>
      );
    }

    // Scene 5: Preview & Publish
    if (stage === "content_review_pending" && pages.length > 0) {
      return (
        <motion.div
          key="scene-content-preview"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          className="flex flex-col gap-4 p-2"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Chip size="sm" color="accent" variant="soft" className="font-semibold">Scene 5: Preview Drafts</Chip>
                <h4 className="text-foreground font-semibold text-base">Review AI-Generated Draft Copy</h4>
              </div>
              <p className="text-muted text-xs">
                Inspect copy and metadata for the generated pages before committing publication.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                isDisabled={loadingAction === "publishing"}
                onPress={handlePublish}
              >
                {loadingAction === "publishing" ? (
                  <>
                    <Spinner size="sm" className="mr-1.5" />
                    Publishing...
                  </>
                ) : (
                  "Approve & Publish Campaign"
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pages.map((page: GeneratedPageContent, idx: number) => (
              <Card key={idx} className="bg-content2/30 border border-border/30 rounded-xl hover:border-border/60 transition-all">
                <Card.Content className="p-3.5 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="bg-accent-soft text-accent text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded w-max">
                      /{page.slug}
                    </span>
                    <h5 className="text-foreground font-semibold text-xs truncate mt-1">{page.title}</h5>
                    <p className="text-muted text-[11px] line-clamp-2 leading-relaxed">
                      {page.metaDescription}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/20">
                    <span className="text-muted text-[10px]">
                      Targets <strong>"{page.targetKeyword}"</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => setPreviewPage(page)}
                    >
                      Preview Copy
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </motion.div>
      );
    }

    // Default Fallback
    return (
      <div className="flex items-center justify-between p-2">
        <span className="text-muted text-xs">Campaign in progress... Stage: {stage}</span>
        <Button size="sm" variant="tertiary" onPress={onRefresh}>Refresh State</Button>
      </div>
    );
  };

  return (
    <>
      <Card className="rounded-2xl border border-border/40 bg-content1/80 backdrop-blur-md shadow-xl overflow-hidden p-4">
        <AnimatePresence mode="wait">{renderScene()}</AnimatePresence>
      </Card>

      {/* Modal for draft preview */}
      {previewPage && (
        <SeoPagePreviewModal
          page={previewPage}
          state={{
            isOpen: !!previewPage,
            close: () => setPreviewPage(null),
            open: () => {},
            toggle: () => {},
            setOpen: (open) => {
              if (!open) setPreviewPage(null);
            },
          }}
        />
      )}
    </>
  );
}
