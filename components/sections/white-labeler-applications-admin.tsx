"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ClipboardList, LogOut, RefreshCcw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  WhiteLabelerApiError,
  fetchWhiteLabelerApplicationsAdmin,
  reviewWhiteLabelerApplication,
  sendWhiteLabelerApplicationInvite,
  type WhiteLabelerAdminApplication,
  type WhiteLabelerApplicationApprovalResponse,
} from "@/lib/statxeo/white-labeler-client"
import { cn } from "@/lib/utils"

type FilterValue = "pending_review" | "approved" | "invited" | "rejected" | "all"

function describeError(error: unknown, fallback: string) {
  if (error instanceof WhiteLabelerApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return "-"
  return new Date(parsed).toLocaleString()
}

export function WhiteLabelerApplicationsAdminSection() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>("pending_review")
  const [applications, setApplications] = useState<WhiteLabelerAdminApplication[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mutationError, setMutationError] = useState("")
  const [mutationSuccess, setMutationSuccess] = useState("")
  const [approvalResult, setApprovalResult] = useState<WhiteLabelerApplicationApprovalResponse["approval"] | null>(null)
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    reviewNotes: "",
    displayName: "",
    slug: "",
    ownerPassword: "",
    planCode: "statxeo_core",
  })

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetchWhiteLabelerApplicationsAdmin({
        status: filter === "all" ? undefined : filter,
        limit: 100,
      })
      const nextApplications = Array.isArray(response.applications) ? response.applications : []
      setApplications(nextApplications)

      if (nextApplications.length === 0) {
        setSelectedApplicationId("")
      } else if (!nextApplications.some((application) => application.id === selectedApplicationId)) {
        setSelectedApplicationId(nextApplications[0]?.id ?? "")
      }
    } catch (loadError) {
      setApplications([])
      setSelectedApplicationId("")
      setError(describeError(loadError, "Unable to load partner applications."))
    } finally {
      setLoading(false)
    }
  }, [filter, selectedApplicationId])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  const selectedApplication = useMemo(() => {
    return applications.find((application) => application.id === selectedApplicationId) ?? null
  }, [applications, selectedApplicationId])

  useEffect(() => {
    if (!selectedApplication) {
      setReviewForm({
        reviewNotes: "",
        displayName: "",
        slug: "",
        ownerPassword: "",
        planCode: "statxeo_core",
      })
      return
    }

    setReviewForm((current) => ({
      reviewNotes: selectedApplication.review_notes ?? current.reviewNotes,
      displayName: selectedApplication.company_name,
      slug: selectedApplication.desired_slug ?? "",
      ownerPassword: "",
      planCode: current.planCode || "statxeo_core",
    }))
  }, [selectedApplication])

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      await loadApplications()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      router.replace("/white-labeler/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!selectedApplication) {
      setMutationError("Select an application first.")
      return
    }

    setMutationError("")
    setMutationSuccess("")
    setApprovalResult(null)
    setIsSubmittingDecision(true)

    try {
      const response = await reviewWhiteLabelerApplication({
        application_id: selectedApplication.id,
        decision,
        review_notes: reviewForm.reviewNotes || undefined,
        display_name: decision === "approve" ? reviewForm.displayName || undefined : undefined,
        slug: decision === "approve" ? reviewForm.slug || undefined : undefined,
        owner_password: decision === "approve" ? reviewForm.ownerPassword || undefined : undefined,
        plan_code: decision === "approve" ? reviewForm.planCode || undefined : undefined,
      })

      setMutationSuccess(response.message)
      setApprovalResult(response.approval ?? null)
      await loadApplications()
    } catch (decisionError) {
      setMutationError(describeError(decisionError, "Unable to submit application review decision."))
    } finally {
      setIsSubmittingDecision(false)
    }
  }

  const handleSendInvite = async () => {
    if (!selectedApplication) {
      setMutationError("Select an application first.")
      return
    }

    if (selectedApplication.status !== "approved" && selectedApplication.status !== "invited") {
      setMutationError("Approve the application before sending the partner invite email.")
      return
    }

    setMutationError("")
    setMutationSuccess("")
    setApprovalResult(null)
    setIsSendingInvite(true)

    try {
      const response = await sendWhiteLabelerApplicationInvite({
        application_id: selectedApplication.id,
      })

      setMutationSuccess(response.message)
      await loadApplications()
    } catch (inviteError) {
      setMutationError(describeError(inviteError, "Unable to send partner invite email."))
    } finally {
      setIsSendingInvite(false)
    }
  }

  const pendingCount = applications.filter((application) => application.status === "pending_review").length

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge className="bg-slate-900 text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950">Platform Admin</Badge>
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
                  <ClipboardList className="h-8 w-8" />
                  Partner applications
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Review inbound white-label applications and provision workspaces only after approval.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/white-labeler/admin">Back to tenant admin</Link>
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
                <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {(["pending_review", "approved", "invited", "rejected", "all"] as FilterValue[]).map((value) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
              className="justify-start"
            >
              {value === "all" ? "All applications" : value.replace(/_/g, " ")}
            </Button>
          ))}
        </div>

        {mutationSuccess ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <AlertTitle>Review updated</AlertTitle>
            <AlertDescription>
              <p>{mutationSuccess}</p>
              {approvalResult?.temporaryPassword ? <p>Temporary password: {approvalResult.temporaryPassword}</p> : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {mutationError ? (
          <Alert variant="destructive">
            <AlertTitle>Decision failed</AlertTitle>
            <AlertDescription>{mutationError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Application queue</CardTitle>
              <CardDescription>
                {pendingCount} pending applications in the current view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Spinner />
                  Loading applications...
                </div>
              ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No applications found for this filter.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow
                        key={application.id}
                        className={cn(
                          "cursor-pointer",
                          selectedApplicationId === application.id && "bg-slate-100 dark:bg-slate-800",
                        )}
                        onClick={() => setSelectedApplicationId(application.id)}
                      >
                        <TableCell>
                          <div className="font-medium">{application.company_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{application.desired_slug || "No slug requested"}</div>
                        </TableCell>
                        <TableCell>
                          <div>{application.contact_full_name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{application.contact_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              application.status === "approved" || application.status === "invited"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {application.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(application.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
            <CardHeader>
              <CardTitle>Review workspace application</CardTitle>
              <CardDescription>
                Approve to create the reseller organization and owner account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedApplication ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Select an application to review its details.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selectedApplication.company_name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApplication.contact_full_name} · {selectedApplication.contact_email}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Website: {selectedApplication.company_website || "-"}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Referred by: {selectedApplication.referred_by || "-"}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Submitted: {formatDateTime(selectedApplication.created_at)}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200">
                    {selectedApplication.notes || "No notes provided."}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wl-app-review-display-name">Display name</Label>
                    <Input
                      id="wl-app-review-display-name"
                      value={reviewForm.displayName}
                      onChange={(event) => setReviewForm((current) => ({ ...current, displayName: event.target.value }))}
                      disabled={isSubmittingDecision}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="wl-app-review-slug">Workspace slug</Label>
                      <Input
                        id="wl-app-review-slug"
                        value={reviewForm.slug}
                        onChange={(event) => setReviewForm((current) => ({ ...current, slug: event.target.value }))}
                        disabled={isSubmittingDecision}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wl-app-review-plan-code">Default plan code</Label>
                      <Input
                        id="wl-app-review-plan-code"
                        value={reviewForm.planCode}
                        onChange={(event) => setReviewForm((current) => ({ ...current, planCode: event.target.value }))}
                        disabled={isSubmittingDecision}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wl-app-review-owner-password">Owner password</Label>
                    <Input
                      id="wl-app-review-owner-password"
                      type="text"
                      value={reviewForm.ownerPassword}
                      onChange={(event) => setReviewForm((current) => ({ ...current, ownerPassword: event.target.value }))}
                      placeholder="Optional. Leave blank to auto-generate."
                      disabled={isSubmittingDecision}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wl-app-review-notes">Review notes</Label>
                    <Textarea
                      id="wl-app-review-notes"
                      value={reviewForm.reviewNotes}
                      onChange={(event) => setReviewForm((current) => ({ ...current, reviewNotes: event.target.value }))}
                      rows={5}
                      disabled={isSubmittingDecision}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleDecision("approve")}
                      disabled={isSubmittingDecision || selectedApplication.status !== "pending_review"}
                    >
                      {isSubmittingDecision ? "Submitting..." : "Approve and provision"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void handleSendInvite()}
                      disabled={
                        isSubmittingDecision ||
                        isSendingInvite ||
                        (selectedApplication.status !== "approved" && selectedApplication.status !== "invited")
                      }
                    >
                      {isSendingInvite ? "Sending invite..." : "Send partner invite email"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void handleDecision("reject")}
                      disabled={isSubmittingDecision || selectedApplication.status !== "pending_review"}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}