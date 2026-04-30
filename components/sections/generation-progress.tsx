"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchGenerationStatus } from "@/lib/statxeo/site-project-client"

// ─── Pipeline stage definitions ───────────────────────────────────────────────

type StageInfo = {
  key: string
  label: string
  description: string
}

const PIPELINE_STAGES: StageInfo[] = [
  { key: "loading_project",    label: "Loading project",      description: "Reading your business data and preferences" },
  { key: "normalizing_intake", label: "Normalizing intake",   description: "Structuring your data for the AI" },
  { key: "resolving_template", label: "Selecting template",   description: "Choosing the right layout for your package" },
  { key: "assembling_prompt",  label: "Building prompt",      description: "Preparing instructions for the AI model" },
  { key: "llm_calling",        label: "Generating content",   description: "AI is writing your website copy" },
  { key: "validating_output",  label: "Validating output",    description: "Checking the AI's work for quality" },
  { key: "mapping_slots",      label: "Mapping content",      description: "Placing content into the right sections" },
  { key: "generating_seo",     label: "Generating SEO",       description: "Writing meta titles, descriptions, and schema" },
  { key: "building_manifest",  label: "Building manifest",    description: "Assembling the final site structure" },
  { key: "deploying_preview",  label: "Deploying preview",    description: "Publishing your preview to the web" },
  { key: "deploying_production", label: "Going live",         description: "Publishing your site to production" },
]

/** Stages for preview / content pipelines (excludes production-only step). */
const PREVIEW_STAGE_KEYS = PIPELINE_STAGES.filter((s) => s.key !== "deploying_production").map((s) => s.key)

type StageStatus = "completed" | "active" | "pending" | "failed"

type Props = {
  projectId: string
  jobType: string
  jobStatus: string
  currentStage: string
  onComplete?: () => void
}

function estimateProgress(currentStage: string, jobStatus: string): number {
  if (jobStatus === "completed") return 100
  if (jobStatus === "failed") return 0
  // Orchestrator sets stage to "complete" before status flips to completed
  if (currentStage === "complete") return 100

  const idx = PREVIEW_STAGE_KEYS.indexOf(currentStage)
  if (currentStage === "queued") {
    return 5
  }
  if (idx === -1) {
    return 5
  }
  if (jobStatus === "running" || jobStatus === "pending") {
    return Math.min(95, Math.round(((idx + 1) / PREVIEW_STAGE_KEYS.length) * 100))
  }
  return 5
}

function getStageStatus(
  stageKey: string,
  currentStage: string,
  jobStatus: string,
  jobType: string,
): StageStatus {
  if (jobStatus === "completed") {
    if (stageKey === "deploying_production") {
      return jobType === "deploy_production" ? "completed" : "pending"
    }
    return "completed"
  }

  if (jobStatus === "failed") {
    if (stageKey === "deploying_production") return "pending"
    const failAt = PREVIEW_STAGE_KEYS.indexOf(currentStage)
    const thisIdx = PREVIEW_STAGE_KEYS.indexOf(stageKey)
    if (failAt === -1) {
      // `failJob` stores stage as "failed" — we cannot map to a pipeline step
      return "pending"
    }
    if (thisIdx < failAt) return "completed"
    if (thisIdx === failAt) return "failed"
    return "pending"
  }

  if (stageKey === "deploying_production") {
    if (jobType !== "deploy_production") return "pending"
    const full = PIPELINE_STAGES.map((s) => s.key)
    const c = full.indexOf(currentStage)
    const t = full.indexOf("deploying_production")
    if (c > t) return "completed"
    if (c === t) return "active"
    return "pending"
  }

  const thisIdx = PREVIEW_STAGE_KEYS.indexOf(stageKey)
  let currentIdx = PREVIEW_STAGE_KEYS.indexOf(currentStage)

  if (currentStage === "queued") currentIdx = -1
  if (currentStage === "complete") currentIdx = PREVIEW_STAGE_KEYS.length

  if (thisIdx === -1) return "pending"
  if (currentIdx === -1 && thisIdx === 0) return "active"
  if (thisIdx < currentIdx) return "completed"
  if (thisIdx === currentIdx) return "active"
  return "pending"
}

function StageRow({ stage, status }: { stage: StageInfo; status: StageStatus }) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
      status === "active" && "bg-blue-500/5",
      status === "failed" && "bg-destructive/5",
    )}>
      <div className="mt-0.5 shrink-0">
        {status === "completed" && <CheckCircle2 className="size-4 text-emerald-500" />}
        {status === "active" && <Loader2 className="size-4 animate-spin text-blue-400" />}
        {status === "pending" && <Circle className="size-4 text-muted-foreground/30" />}
        {status === "failed" && <XCircle className="size-4 text-destructive" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-sm font-medium leading-tight",
          status === "completed" && "text-foreground",
          status === "active" && "text-blue-300",
          status === "pending" && "text-muted-foreground/50",
          status === "failed" && "text-destructive",
        )}>
          {stage.label}
        </p>
        {(status === "active" || status === "failed") && (
          <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
        )}
      </div>
      {status === "active" && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          Running
        </Badge>
      )}
    </div>
  )
}

export function GenerationProgress({ projectId, jobType, jobStatus, currentStage, onComplete }: Props) {
  const [liveStage, setLiveStage] = useState(currentStage)
  const [liveJobStatus, setLiveJobStatus] = useState(jobStatus)
  const [liveJobType, setLiveJobType] = useState(jobType)
  const [expanded, setExpanded] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    setLiveStage(currentStage)
    setLiveJobStatus(jobStatus)
    setLiveJobType(jobType)
  }, [currentStage, jobStatus, jobType])

  const poll = useCallback(async () => {
    try {
      const status = await fetchGenerationStatus(projectId)
      if (status.latestJob) {
        setLiveStage(status.latestJob.stage)
        setLiveJobStatus(status.latestJob.status)
        setLiveJobType(status.latestJob.job_type ?? liveJobType)

        if (status.latestJob.status === "completed" && !completedRef.current) {
          completedRef.current = true
          if (pollRef.current) clearInterval(pollRef.current)
          onComplete?.()
        }
        if (status.latestJob.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }
    } catch {
      // Non-fatal — keep polling
    }
  }, [projectId, onComplete, liveJobType])

  useEffect(() => {
    if (liveJobStatus === "running" || liveJobStatus === "pending") {
      pollRef.current = setInterval(poll, 3000)
      poll()
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [liveJobStatus, poll])

  const progress = estimateProgress(liveStage, liveJobStatus)
  const isRunning = liveJobStatus === "running" || liveJobStatus === "pending"
  const isFailed = liveJobStatus === "failed"
  const isDone = liveJobStatus === "completed"

  const currentStageDef = PIPELINE_STAGES.find((s) => s.key === liveStage)

  const visibleStages = PIPELINE_STAGES.filter((s) => {
    if (s.key === "deploying_production") {
      return liveJobType === "deploy_production" || liveStage === "deploying_production"
    }
    return true
  })

  return (
    <Card className={cn(
      "border transition-colors",
      isRunning && "border-blue-500/30 bg-blue-500/5",
      isFailed && "border-destructive/30 bg-destructive/5",
      isDone && "border-emerald-500/30 bg-emerald-500/5",
    )}>
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {isRunning && <Loader2 className="size-4 animate-spin text-blue-400" />}
            {isDone && <CheckCircle2 className="size-4 text-emerald-500" />}
            {isFailed && <XCircle className="size-4 text-destructive" />}
            <span className={cn(
              isRunning && "text-blue-300",
              isDone && "text-emerald-300",
              isFailed && "text-destructive",
            )}>
              {isRunning ? "Building your website…" : isDone ? "Generation complete" : "Generation failed"}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isRunning && "bg-blue-400",
              isDone && "bg-emerald-500",
              isFailed && "bg-destructive",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {isRunning && currentStageDef && (
          <p className="mt-1 text-xs text-blue-400/80">{currentStageDef.description}</p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pb-4 pt-0">
          <div className="flex flex-col gap-0.5">
            {visibleStages.map((stage) => (
              <StageRow
                key={stage.key}
                stage={stage}
                status={getStageStatus(stage.key, liveStage, liveJobStatus, liveJobType)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
