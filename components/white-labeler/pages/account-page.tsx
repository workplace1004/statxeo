"use client"

import { AlertCircle } from "lucide-react"
import { Chip } from "@heroui/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PortalErrorState, PortalHero, PortalLoadingState, PortalStatCard, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatDateTime } from "@/components/white-labeler/portal-utils"
import { cn } from "@/lib/utils"

export function WhiteLabelerAccountPage() {
  const {
    overview,
    overviewLoading,
    overviewError,
    loadOverview,
    accountCurrency,
    canManageClients,
    stripeMutationError,
    isOpeningStripeOnboarding,
    handleOpenStripeDashboard,
    handleOpenStripeOnboarding,
  } = useWhiteLabelerPortal()

  if (overviewLoading && !overview) {
    return <PortalLoadingState label="Loading account workspace..." />
  }

  if (overviewError) {
    return (
      <PortalErrorState
        title="Couldn't load account"
        message={overviewError}
        action={
          <Button type="button" size="sm" variant="outline" onClick={() => void loadOverview()}>
            Retry
          </Button>
        }
      />
    )
  }

  if (!overview) return null

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Settings Workspace"
        initials="AC"
        title="Account"
        description="Identity, Stripe Connect, and go-live requirements for your white-label workspace."
        status={
          <>
            <Chip size="sm" variant="soft" color={overview.onboarding.isComplete ? "success" : "warning"}>
              {overview.onboarding.isComplete ? "Onboarding complete" : "Setup in progress"}
            </Chip>
            <Chip size="sm" variant="soft" color={overview.stripe.status === "active" ? "success" : "default"}>
              Stripe {overview.stripe.status.replace(/_/g, " ")}
            </Chip>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Role" value={overview.account.role} meta="Workspace permission scope" />
        <PortalStatCard label="Account status" value={overview.account.status ?? "active"} meta="Current partner workspace status" />
        <PortalStatCard label="Currency" value={accountCurrency.toUpperCase()} meta="Settlement and reporting currency" />
        <PortalStatCard label="Settlement month" value={overview.period.settlementMonth} meta="Reporting window for payouts" />
      </div>

      <PortalSurfaceCard title="Workspace profile" description="How STATXEO recognizes this partner account.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <p className="text-muted-foreground">Display name</p>
            <p className="font-medium">{overview.account.displayName || "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <p className="text-muted-foreground">Your role</p>
            <p className="font-medium capitalize">{overview.account.role}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <p className="text-muted-foreground">Account status</p>
            <p className="font-medium capitalize">{overview.account.status ?? "active"}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3 text-sm">
            <p className="text-muted-foreground">Currency</p>
            <p className="font-medium uppercase">{accountCurrency}</p>
          </div>
        </div>
      </PortalSurfaceCard>

      <PortalSurfaceCard title="Settlement" description="Reporting period for payouts and statements.">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge variant="secondary">Settlement month: {overview.period.settlementMonth}</Badge>
          <span className="text-muted-foreground">Revenue and payouts use this period for reporting.</span>
        </div>
      </PortalSurfaceCard>

      {overview.launchReadiness && !overview.launchReadiness.canSell ? (
        <Alert variant="destructive">
          <AlertTitle>Go-live requirements incomplete</AlertTitle>
          <AlertDescription>
            <p className="mb-2 text-sm">Finish the items below before creating live checkout links for clients.</p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {overview.launchReadiness.blockers.map((blocker) => (
                <li key={blocker.code}>{blocker.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <PortalSurfaceCard
        title="Stripe Connect"
        description="Connect an Express account so destination charges and payouts can go live."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant={overview.stripe.status === "active" ? "secondary" : "outline"}>
              {overview.stripe.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={overview.stripe.chargesEnabled ? "secondary" : "outline"}>
                  Charges {overview.stripe.chargesEnabled ? "enabled" : "pending"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {overview.stripe.chargesEnabled
                  ? "Your account can accept payments via destination charges."
                  : "Complete Stripe onboarding to enable charges."}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={overview.stripe.payoutsEnabled ? "secondary" : "outline"}>
                  Payouts {overview.stripe.payoutsEnabled ? "enabled" : "pending"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {overview.stripe.payoutsEnabled
                  ? "Stripe can send payouts to your bank account."
                  : "Complete identity verification to enable payouts."}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={overview.stripe.detailsSubmitted ? "secondary" : "outline"}>
                  Details {overview.stripe.detailsSubmitted ? "submitted" : "needed"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {overview.stripe.detailsSubmitted
                  ? "Business details and identity have been submitted."
                  : "Submit required business details to complete onboarding."}
              </TooltipContent>
            </Tooltip>
            {overview.stripe.accountId ? <Badge variant="outline">{overview.stripe.accountId}</Badge> : null}
          </div>
          {!overview.stripe.isConfigured ? (
            <p className="text-destructive text-sm">
              Stripe env vars are missing on this deployment. Add the secret key before onboarding partners.
            </p>
          ) : null}
          {overview.stripe.requirements.disabledReason ? (
            <p className="text-destructive text-sm">Disabled reason: {overview.stripe.requirements.disabledReason}</p>
          ) : null}
          {overview.stripe.requirements.currentlyDue.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Outstanding Stripe requirements</p>
              <div className="flex flex-wrap gap-2">
                {overview.stripe.requirements.currentlyDue.map((requirement) => (
                  <Badge key={requirement} variant="outline">
                    {requirement}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {overview.stripe.requirements.pendingVerification.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pending verification</p>
              <div className="flex flex-wrap gap-2">
                {overview.stripe.requirements.pendingVerification.map((requirement) => (
                  <Badge key={requirement} variant="outline">
                    {requirement}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={overview.stripe.status === "active" ? handleOpenStripeDashboard : handleOpenStripeOnboarding}
              disabled={isOpeningStripeOnboarding || !overview.stripe.isConfigured || !canManageClients}
            >
              {isOpeningStripeOnboarding
                ? "Opening Stripe..."
                : overview.stripe.accountId
                  ? overview.stripe.status === "active"
                    ? "Open Express dashboard"
                    : "Resume Stripe onboarding"
                  : "Connect Stripe"}
            </Button>
            {overview.stripe.accountId && overview.stripe.status !== "active" ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenStripeOnboarding}
                disabled={isOpeningStripeOnboarding || !overview.stripe.isConfigured || !canManageClients}
              >
                Restart onboarding
              </Button>
            ) : null}
            {overview.stripe.lastSyncedAt ? (
              <p className="text-muted-foreground text-sm">Last synced {formatDateTime(overview.stripe.lastSyncedAt)}</p>
            ) : null}
          </div>
          {stripeMutationError ? <p className="text-destructive text-sm">{stripeMutationError}</p> : null}
        </div>
      </PortalSurfaceCard>

      <PortalSurfaceCard
        title="Onboarding progress"
        description={`Current step: ${
          overview.onboarding.currentStep === "completed"
            ? "Completed"
            : overview.onboarding.steps.find((step) => step.key === overview.onboarding.currentStep)?.label ?? "In progress"
        }`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant={overview.onboarding.isComplete ? "secondary" : "outline"}>
              {overview.onboarding.completedSteps}/{overview.onboarding.totalSteps} complete
            </Badge>
          </div>
          <Progress value={overview.onboarding.percentComplete} className="h-2.5" />
          <p className="text-muted-foreground text-right text-xs">{overview.onboarding.percentComplete}% complete</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overview.onboarding.steps.map((step) => (
              <div
                key={step.key}
                className={cn(
                  "rounded-lg border p-3",
                  step.complete
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border/70 bg-background/70",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{step.label}</p>
                  <Badge variant={step.complete ? "secondary" : "outline"}>{step.complete ? "Done" : "Pending"}</Badge>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </PortalSurfaceCard>

      <PortalSurfaceCard
        title={
          <span className="text-rose-700 dark:text-rose-300 flex items-center gap-2 text-lg">
            <AlertCircle className="size-5" />
            Danger zone
          </span>
        }
        description="Stripe actions can affect live money movement."
        className="border-rose-200/80 dark:border-rose-400/20"
      >
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenStripeOnboarding}
            disabled={isOpeningStripeOnboarding || !overview.stripe.isConfigured || !canManageClients}
          >
            Restart Stripe onboarding
          </Button>
        </div>
      </PortalSurfaceCard>
    </div>
  )
}
