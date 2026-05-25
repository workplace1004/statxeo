"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCcw,
  Rocket,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronRight,
  Eye,
  ThumbsUp,
  Zap,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WebsiteProjectForm } from "@/components/sections/website-project-form"
import { WebsitePreviewPanel } from "@/components/sections/website-preview-panel"
import { GenerationProgress } from "@/components/sections/generation-progress"
import { ChangeRequestPanel } from "@/components/sections/change-request-panel"
import {
  fetchSiteProjects,
  fetchSiteProjectDetail,
  approveSiteProject,
  type SiteProject,
  type SiteProjectDetail,
  SiteProjectApiError,
} from "@/lib/statxeo/site-project-client"

// ─── Pipeline stages ─────────────────────────────────────────────────────────

type PipelineStage = {
  key: string
  label: string
  description: string
  icon: React.FC<{ className?: string }>
}

const PIPELINE_STAGES: PipelineStage[] = [
  { key: "setup",    label: "Setup",    description: "Configure your brand & preferences", icon: Sparkles },
  { key: "generate", label: "Generate", description: "AI builds your website content",     icon: Zap },
  { key: "review",   label: "Review",   description: "Preview & request changes",          icon: Eye },
  { key: "launch",   label: "Launch",   description: "Approve & go live",                  icon: Rocket },
]

type StageStatus = "completed" | "active" | "pending"

function getStageStatuses(projectStatus: string): Record<string, StageStatus> {
  const map: Record<string, Record<string, StageStatus>> = {
    awaiting_purchase:    { setup: "pending",   generate: "pending",   review: "pending",   launch: "pending" },
    awaiting_preferences: { setup: "active",    generate: "pending",   review: "pending",   launch: "pending" },
    assets_pending:       { setup: "active",    generate: "pending",   review: "pending",   launch: "pending" },
    ready_for_generation: { setup: "completed", generate: "active",    review: "pending",   launch: "pending" },
    generating:           { setup: "completed", generate: "active",    review: "pending",   launch: "pending" },
    preview_ready:        { setup: "completed", generate: "completed", review: "active",    launch: "pending" },
    changes_requested:    { setup: "completed", generate: "completed", review: "active",    launch: "pending" },
    approved:             { setup: "completed", generate: "completed", review: "completed", launch: "active" },
    production_deploying: { setup: "completed", generate: "completed", review: "completed", launch: "active" },
    live:                 { setup: "completed", generate: "completed", review: "completed", launch: "completed" },
    failed:               { setup: "completed", generate: "active",    review: "pending",   launch: "pending" },
  }
  return map[projectStatus] ?? { setup: "pending", generate: "pending", review: "pending", launch: "pending" }
}

function getPipelineProgress(projectStatus: string): number {
  const progressMap: Record<string, number> = {
    awaiting_purchase: 0, awaiting_preferences: 10, assets_pending: 20,
    ready_for_generation: 30, generating: 55, preview_ready: 70,
    changes_requested: 65, approved: 85, production_deploying: 92,
    live: 100, failed: 50,
  }
  return progressMap[projectStatus] ?? 0
}

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  pulse?: boolean
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  awaiting_purchase:    { label: "Awaiting Purchase",   variant: "outline" },
  awaiting_preferences: { label: "Setup Required",      variant: "default" },
  assets_pending:       { label: "Upload Assets",       variant: "default" },
  ready_for_generation: { label: "Ready to Generate",   variant: "default" },
  generating:           { label: "Generating…",         variant: "secondary", pulse: true },
  preview_ready:        { label: "Preview Ready",       variant: "default" },
  changes_requested:    { label: "Changes Requested",   variant: "secondary" },
  approved:             { label: "Approved",            variant: "default" },
  production_deploying: { label: "Deploying…",          variant: "secondary", pulse: true },
  live:                 { label: "Live",                variant: "default" },
  failed:               { label: "Failed",              variant: "destructive" },
}

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? { label: status, variant: "outline" }
}

const POLLING_STATUSES = new Set(["generating", "production_deploying"])
const POLL_INTERVAL_MS = 5000

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyProjectState({ onProjectCreated, onBack }: { onProjectCreated: () => void; onBack: () => void }) {
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState("")
  const [seedDone, setSeedDone] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    setSeedError("")
    try {
      const res = await fetch("/api/dev/seed-demo-project", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Seed failed")
      setSeedDone(true)
      setTimeout(() => onProjectCreated(), 800)
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Seed failed")
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="size-4" />Back to Portal
        </Button>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card">
              <Globe className="size-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold">No Website Project Yet</p>
            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Your website project will appear here after your purchase is confirmed.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Development</p>
                <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding || seedDone} className="w-full gap-2">
                  {seeding ? <Loader2 className="size-3.5 animate-spin" /> : seedDone ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Sparkles className="size-3.5" />}
                  {seeding ? "Creating demo project…" : seedDone ? "Done! Loading…" : "Create Demo Project"}
                </Button>
                {seedError && <p className="mt-2 text-xs text-destructive">{seedError}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Seeds a demo lead + project linked to your account</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Pipeline tracker ─────────────────────────────────────────────────────────

function PipelineTracker({ status }: { status: string }) {
  const stageStatuses = getStageStatuses(status)
  const progress = getPipelineProgress(status)

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardContent className="pt-6 pb-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Build Progress</span>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="mb-6 h-1.5" />
        <div className="relative flex items-start justify-between">
          <div className="absolute top-4 left-0 right-0 h-px bg-border" style={{ left: "12.5%", right: "12.5%" }} />
          {PIPELINE_STAGES.map((stage) => {
            const stageStatus = stageStatuses[stage.key]
            const Icon = stage.icon
            const isCompleted = stageStatus === "completed"
            const isActive = stageStatus === "active"
            return (
              <TooltipProvider key={stage.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative z-10 flex flex-1 flex-col items-center gap-2">
                      <div className={[
                        "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCompleted ? "border-primary bg-primary text-primary-foreground"
                          : isActive ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/20"
                          : "border-border bg-background text-muted-foreground",
                      ].join(" ")}>
                        {isCompleted ? <CheckCircle2 className="size-4" />
                          : isActive ? <Icon className="size-4" />
                          : <Circle className="size-3" />}
                      </div>
                      <div className="text-center">
                        <p className={["text-xs font-semibold", isCompleted || isActive ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                          {stage.label}
                        </p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>{stage.description}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Status banner ────────────────────────────────────────────────────────────

type BannerJob = { status: string } | null

function StatusBanner({ projectStatus, generationJob }: { projectStatus: string; generationJob: BannerJob }) {
  const jobStillRunning =
    generationJob &&
    (generationJob.status === "pending" || generationJob.status === "running")

  if (projectStatus === "generating" && jobStillRunning) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <Loader2 className="size-5 animate-spin text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-blue-300">AI is building your website</p>
            <p className="text-sm text-blue-400/80">Generating content, SEO metadata, and deploying your preview. Usually takes 1–2 minutes.</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-2 rounded-full bg-blue-400" style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  if (projectStatus === "production_deploying") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <Rocket className="size-5 animate-bounce text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-300">Deploying to production</p>
            <p className="text-sm text-emerald-400/80">Your site will be live in just a moment.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (projectStatus === "live") {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <Globe className="size-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-300">Your website is live!</p>
            <p className="text-sm text-emerald-400/80">Visitors can now find your business online.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (projectStatus === "failed") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Generation failed</p>
            <p className="text-sm text-destructive/80">Something went wrong. Review your settings and try generating again.</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  return null
}

// ─── Generation job row ───────────────────────────────────────────────────────

function GenerationJobRow({ job }: {
  job: { id: string; job_type: string; status: string; stage: string; created_at: string; error_message: string | null }
}) {
  const isCompleted = job.status === "completed"
  const isFailed = job.status === "failed"
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/50 bg-card/40 px-4 py-3 transition-colors hover:bg-card/60">
      <div className={["flex size-8 shrink-0 items-center justify-center rounded-full",
        isCompleted ? "bg-emerald-500/10" : isFailed ? "bg-destructive/10" : "bg-blue-500/10"].join(" ")}>
        {isCompleted ? <CheckCircle2 className="size-4 text-emerald-400" />
          : isFailed ? <AlertCircle className="size-4 text-destructive" />
          : <Loader2 className="size-4 animate-spin text-blue-400" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium capitalize">{job.job_type.replace(/_/g, " ")} generation</p>
        <p className="text-xs text-muted-foreground">
          Stage: <span className="font-mono">{job.stage}</span> · {new Date(job.created_at).toLocaleString()}
        </p>
        {job.error_message && <p className="mt-1 text-xs text-destructive">{job.error_message}</p>}
      </div>
      <Badge variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"} className="shrink-0 text-xs">
        {job.status}
      </Badge>
    </div>
  )
}

// ─── Sitemap info ─────────────────────────────────────────────────────────────

function SitemapInfo({ routes, productionUrl }: { routes: string[]; productionUrl: string | null }) {
  if (routes.length === 0) return null
  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" />
          Site Structure
        </CardTitle>
        <CardDescription>{routes.length} page{routes.length !== 1 ? "s" : ""} will be indexed by search engines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {routes.map((route) => (
            <Badge key={route} variant="outline" className="font-mono text-xs">
              {route === "/" ? "/" : route}
            </Badge>
          ))}
        </div>
        {productionUrl && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sitemap: <a href={`${productionUrl}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{productionUrl}/sitemap.xml</a>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CustomerWebsitePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<SiteProject[]>([])
  const [selectedProject, setSelectedProject] = useState<SiteProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Tracks last known project status so we can refetch once when generation/deploy finishes. */
  const prevProjectStatusRef = useRef<string | undefined>(undefined)

  const loadProjectDetail = useCallback(async (projectId: string) => {
    setDetailLoading(true)
    try {
      const detail = await fetchSiteProjectDetail(projectId)
      setSelectedProject(detail)
    } catch (err) {
      setError(err instanceof SiteProjectApiError ? err.message : "Failed to load project details")
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await fetchSiteProjects()
      setProjects(data)
      if (data.length === 1 && !selectedProject) {
        await loadProjectDetail(data[0].id)
      }
    } catch (err) {
      setError(err instanceof SiteProjectApiError ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProjectUpdate = useCallback(() => {
    if (selectedProject) loadProjectDetail(selectedProject.id)
  }, [selectedProject, loadProjectDetail])

  const handleApprove = useCallback(async () => {
    if (!selectedProject) return
    setApproving(true)
    try {
      await approveSiteProject(selectedProject.id)
      await loadProjectDetail(selectedProject.id)
    } catch (err) {
      setError(err instanceof SiteProjectApiError ? err.message : "Approval failed")
    } finally {
      setApproving(false)
    }
  }, [selectedProject, loadProjectDetail])

  useEffect(() => {
    if (!selectedProject) return
    if (POLLING_STATUSES.has(selectedProject.status)) {
      pollRef.current = setInterval(() => loadProjectDetail(selectedProject.id), POLL_INTERVAL_MS)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedProject?.id, selectedProject?.status, loadProjectDetail])

  // When generation or production deploy completes, poll may have stopped before the next
  // interval — refetch immediately so job rows + change-request statuses stay in sync.
  useEffect(() => {
    if (!selectedProject) {
      prevProjectStatusRef.current = undefined
      return
    }
    const id = selectedProject.id
    const prev = prevProjectStatusRef.current
    const cur = selectedProject.status
    if (
      prev !== undefined &&
      (prev === "generating" || prev === "production_deploying") &&
      cur !== prev
    ) {
      void loadProjectDetail(id)
    }
    prevProjectStatusRef.current = cur
  }, [selectedProject?.id, selectedProject?.status, loadProjectDetail])

  useEffect(() => { loadProjects() }, [loadProjects])

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card"><Spinner /></div>
          <p className="text-sm text-muted-foreground">Loading your website project…</p>
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────

  if (error && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/customer")} className="gap-2">
            <ArrowLeft className="size-4" />Back to Portal
          </Button>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="size-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Empty ────────────────────────────────────────────────────────────

  if (projects.length === 0) {
    return <EmptyProjectState onProjectCreated={loadProjects} onBack={() => router.push("/customer")} />
  }

  // ─── Project selector ─────────────────────────────────────────────────

  if (projects.length > 1 && !selectedProject) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/customer")} className="mb-4 gap-2">
              <ArrowLeft className="size-4" />Back to Portal
            </Button>
            <h1 className="text-2xl font-bold">My Websites</h1>
            <p className="mt-1 text-sm text-muted-foreground">Select a project to view and manage</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const config = getStatusConfig(p.status)
              return (
                <Card key={p.id} className="group cursor-pointer border-border/50 bg-card/60 transition-all hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5" onClick={() => loadProjectDetail(p.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{p.business_name ?? "Website"}</CardTitle>
                        <CardDescription className="mt-0.5 capitalize">{p.package_tier.replace("statxeo_", "")} package</CardDescription>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardHeader>
                  <CardContent><Badge variant={config.variant}>{config.label}</Badge></CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── Detail loading ───────────────────────────────────────────────────

  if (detailLoading && !selectedProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4"><Spinner /><p className="text-sm text-muted-foreground">Loading project details…</p></div>
      </div>
    )
  }

  if (!selectedProject) return null

  // ─── Derived state ────────────────────────────────────────────────────

  const statusConfig = getStatusConfig(selectedProject.status)
  const showForm = ["awaiting_preferences", "assets_pending", "changes_requested", "failed", "ready_for_generation"].includes(selectedProject.status)
  const showApprove = selectedProject.status === "preview_ready"
  const showChangeRequest = ["preview_ready", "changes_requested"].includes(selectedProject.status)
  const hasJobs = selectedProject.statxeo_site_generation_jobs.length > 0
  /** Prefer in-flight job; nested jobs were ordered newest-first in API. */
  const activeJob =
    selectedProject.statxeo_site_generation_jobs.find(
      (j) => j.status === "running" || j.status === "pending",
    ) ?? selectedProject.statxeo_site_generation_jobs[0] ?? null
  const showGenerationProgress =
    selectedProject.status === "generating" && hasJobs && activeJob !== null

  // ─── Main detail view ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/customer")} className="gap-2">
              <ArrowLeft className="size-4" />Portal
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <h1 className="text-xl font-bold leading-tight">{selectedProject.business_name ?? "My Website"}</h1>
              <p className="text-xs capitalize text-muted-foreground">
                {selectedProject.package_tier.replace("statxeo_", "")} package
                {selectedProject.pageCount ? ` · ${selectedProject.pageCount} pages` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant} className="hidden sm:flex">
              {statusConfig.pulse && <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-current" />}
              {statusConfig.label}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleProjectUpdate} disabled={detailLoading} className="size-8">
                    <RefreshCcw className={["size-3.5", detailLoading ? "animate-spin" : ""].join(" ")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh status</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-col gap-5">

          {/* Pipeline tracker */}
          <PipelineTracker status={selectedProject.status} />

          {/* Status banner */}
          <StatusBanner projectStatus={selectedProject.status} generationJob={activeJob} />

          {/* Action bar */}
          {(selectedProject.preview_url || selectedProject.production_url || showApprove) && (
            <Card className="border-border/50 bg-card/60">
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                {selectedProject.preview_url && (
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a href={selectedProject.preview_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />View Preview
                    </a>
                  </Button>
                )}
                {showApprove && (
                  <Button size="sm" onClick={handleApprove} disabled={approving} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                    {approving ? <Loader2 className="size-3.5 animate-spin" /> : <ThumbsUp className="size-3.5" />}
                    {approving ? "Approving…" : "Approve & Go Live"}
                  </Button>
                )}
                {selectedProject.production_url && (
                  <Button size="sm" asChild className="gap-2">
                    <a href={selectedProject.production_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="size-3.5" />Live Site
                    </a>
                  </Button>
                )}
                {error && <p className="ml-auto text-sm text-destructive">{error}</p>}
              </CardContent>
            </Card>
          )}

          {/* Live generation progress (replaces static iframe during generation) */}
          {showGenerationProgress && activeJob && (
            <GenerationProgress
              projectId={selectedProject.id}
              jobType={activeJob.job_type}
              jobStatus={activeJob.status}
              currentStage={activeJob.stage}
              onComplete={handleProjectUpdate}
            />
          )}

          {/* Multi-page preview */}
          {selectedProject.preview_url && !showGenerationProgress && (
            <WebsitePreviewPanel
              previewBaseUrl={selectedProject.preview_url}
              previewPages={selectedProject.previewPages}
              packageTier={selectedProject.package_tier}
              pageCount={selectedProject.pageCount}
            />
          )}

          {/* Setup / preferences form */}
          {showForm && (
            <WebsiteProjectForm project={selectedProject} onProjectUpdate={handleProjectUpdate} />
          )}

          {/* Change request panel (review stage) */}
          {showChangeRequest && (
            <ChangeRequestPanel project={selectedProject} onRequestSubmitted={handleProjectUpdate} />
          )}

          {/* Sitemap / page structure */}
          {selectedProject.sitemapRoutes && selectedProject.sitemapRoutes.length > 1 && (
            <SitemapInfo routes={selectedProject.sitemapRoutes} productionUrl={selectedProject.production_url} />
          )}

          {/* Generation job history */}
          {hasJobs && !showGenerationProgress && (
            <Card className="border-border/50 bg-card/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="size-4 text-muted-foreground" />
                  Generation History
                </CardTitle>
                <CardDescription>
                  {selectedProject.statxeo_site_generation_jobs.length} job{selectedProject.statxeo_site_generation_jobs.length !== 1 ? "s" : ""} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {selectedProject.statxeo_site_generation_jobs.map((job) => (
                    <GenerationJobRow key={job.id} job={job} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
