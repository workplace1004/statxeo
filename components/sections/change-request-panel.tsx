"use client"

import { useCallback, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageSquarePlus,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  createChangeRequest,
  type ChangeRequest,
  type SiteProjectDetail,
  SiteProjectApiError,
} from "@/lib/statxeo/site-project-client"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  project: SiteProjectDetail
  onRequestSubmitted: () => void
}

// ─── Scope options ────────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  { value: "site",    label: "Entire Site",     description: "Something that affects all pages" },
  { value: "page",    label: "Specific Page",   description: "A change on one particular page" },
  { value: "section", label: "Specific Section", description: "A change in one section of a page" },
]

const PAGE_OPTIONS = [
  { value: "home",    label: "Home" },
  { value: "services", label: "Services" },
  { value: "about",   label: "About" },
  { value: "contact", label: "Contact" },
]

const SECTION_OPTIONS = [
  { value: "hero",       label: "Hero / Banner" },
  { value: "about",      label: "About section" },
  { value: "services",   label: "Services section" },
  { value: "cta",        label: "Call to action" },
  { value: "footer",     label: "Footer" },
  { value: "contact",    label: "Contact form" },
  { value: "testimonials", label: "Testimonials" },
]

const EXAMPLE_REQUESTS = [
  "Change the headline to emphasize same-day service",
  "Make the tone more friendly and less formal",
  "Add our phone number to the hero section",
  "Update the services list to include duct cleaning",
  "Change the primary color to match our logo",
  "Add a mention of our 10-year warranty",
]

// ─── Change request history row ───────────────────────────────────────────────

function ChangeRequestRow({ cr }: { cr: ChangeRequest }) {
  const isPending = cr.status === "pending"
  const isResolved = cr.status === "resolved"

  return (
    <div className="rounded-lg border border-border/50 bg-card/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {isResolved
            ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            : <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />}
          <p className="text-sm leading-snug">{cr.description}</p>
        </div>
        <Badge
          variant={isResolved ? "default" : "secondary"}
          className="shrink-0 text-xs capitalize"
        >
          {cr.status}
        </Badge>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        <span className="font-mono capitalize">{cr.scope_type}</span>
        {cr.page_key ? ` → ${cr.page_key}` : ""}
        {cr.section_key ? ` → ${cr.section_key}` : ""}
        {" · "}{new Date(cr.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChangeRequestPanel({ project, onRequestSubmitted }: Props) {
  const [scopeType, setScopeType] = useState("site")
  const [pageKey, setPageKey] = useState("")
  const [sectionKey, setSectionKey] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [showForm, setShowForm] = useState(project.statxeo_site_change_requests.length === 0)

  const canSubmit = description.trim().length >= 10
  const charCount = description.trim().length

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError("")
    setSubmitSuccess(false)
    try {
      await createChangeRequest(project.id, {
        scopeType,
        pageKey: scopeType !== "site" ? pageKey || undefined : undefined,
        sectionKey: scopeType === "section" ? sectionKey || undefined : undefined,
        description: description.trim(),
      })
      setSubmitSuccess(true)
      setDescription("")
      setScopeType("site")
      setPageKey("")
      setSectionKey("")
      setShowForm(false)
      onRequestSubmitted()
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch (err) {
      setSubmitError(err instanceof SiteProjectApiError ? err.message : "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }, [project.id, scopeType, pageKey, sectionKey, description, canSubmit, onRequestSubmitted])

  const existingRequests = project.statxeo_site_change_requests
  const pendingCount = existingRequests.filter((r) => r.status === "pending").length

  return (
    <Card className="border-border/50 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquarePlus className="size-4 text-muted-foreground" />
              Request Changes
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-xs">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-0.5">
              Describe what you'd like changed and we'll regenerate your site
            </CardDescription>
          </div>
          {existingRequests.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm((v) => !v)}
              className="gap-1.5 text-xs"
            >
              {showForm ? "Hide form" : "New request"}
              <ChevronDown className={cn("size-3.5 transition-transform", showForm && "rotate-180")} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">

        {/* Submit success */}
        {submitSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <p className="text-sm text-emerald-400">Change request submitted. We'll regenerate your site shortly.</p>
          </div>
        )}

        {/* New request form */}
        {showForm && (
          <div className="flex flex-col gap-4">

            {/* Scope selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">What does this change affect?</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScopeType(opt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left transition-all",
                      scopeType === opt.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/50 bg-card/40 hover:border-border hover:bg-card/60",
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page / section selectors */}
            {scopeType !== "site" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Page</Label>
                  <Select value={pageKey} onValueChange={setPageKey}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select a page…" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {scopeType === "section" && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Section</Label>
                    <Select value={sectionKey} onValueChange={setSectionKey}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a section…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="changeDesc" className="text-sm font-medium">
                Describe the change
              </Label>
              <Textarea
                id="changeDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be as specific as possible. Instead of 'fix the text', say 'Change the headline to say: Fast, Reliable HVAC Service in Austin'"
                rows={4}
                className="resize-none text-sm"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-xs",
                  charCount < 10 ? "text-amber-500" : "text-muted-foreground/50",
                )}>
                  {charCount < 10 ? `${10 - charCount} more characters needed` : `${charCount}/1000`}
                </p>
              </div>

              {/* Example suggestions */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Quick examples:</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_REQUESTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setDescription(ex)}
                      className="rounded-md border border-dashed border-border/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                <AlertCircle className="size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="gap-2 self-start"
            >
              {submitting ? (
                <><span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />Submitting…</>
              ) : (
                <><Send className="size-3.5" />Submit Change Request</>
              )}
            </Button>
          </div>
        )}

        {/* Existing requests */}
        {existingRequests.length > 0 && (
          <>
            {showForm && <Separator />}
            <div className="flex flex-col gap-2">
              {existingRequests.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Previous requests
                </p>
              )}
              {existingRequests.map((cr) => (
                <ChangeRequestRow key={cr.id} cr={cr} />
              ))}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  )
}
