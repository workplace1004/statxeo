"use client"

import { useMemo, useState } from "react"
import { DollarSign, Plus } from "lucide-react"
import { Chip } from "@heroui/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PortalActionButton, PortalEmptyState, PortalHero, PortalLoadingState, PortalStatCard, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerPlanOverride } from "@/lib/statxeo/white-labeler-client"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function marginPercent(row: WhiteLabelerPlanOverride) {
  if (!row.amount_sold_cents) return 0
  return Math.round((row.net_payout_cents / row.amount_sold_cents) * 1000) / 10
}

export function WhiteLabelerPricingPage() {
  const {
    pricing,
    pricingLoading,
    pricingError,
    canManagePricing,
    pricingForm,
    setPricingForm,
    pricingMutationError,
    isCreatingPricingOverride,
    handleCreatePricingOverride,
    handleTogglePricingOverrideStatus,
    updatingPricingId,
    pricingPreviewNetPayoutCents,
    accountCurrency,
  } = useWhiteLabelerPortal()

  const [addOpen, setAddOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const visiblePlans = useMemo(
    () => (showInactive ? pricing : pricing.filter((p) => p.is_active)),
    [pricing, showInactive],
  )

  const activePlans = useMemo(() => pricing.filter((plan) => plan.is_active), [pricing])
  const averageMargin = useMemo(() => {
    if (activePlans.length === 0) return "0%"
    const totalMargin = activePlans.reduce((sum, plan) => sum + marginPercent(plan), 0)
    return `${Math.round((totalMargin / activePlans.length) * 10) / 10}%`
  }, [activePlans])

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Revenue Workspace"
        initials="PP"
        title="Plan Pricing"
        description="Net payout = amount sold − (base cost + white-label fee). Toggle plans off instead of deleting history."
        status={
          <Chip size="sm" variant="soft" color={activePlans.length > 0 ? "success" : "warning"}>
            {activePlans.length > 0 ? `${activePlans.length} active plans` : "No active plans"}
          </Chip>
        }
        actions={canManagePricing ? (
          <PortalActionButton onPress={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add plan
          </PortalActionButton>
        ) : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Total plans" value={String(pricing.length)} meta="All pricing overrides" />
        <PortalStatCard label="Active plans" value={String(activePlans.length)} meta="Sellable checkout configurations" />
        <PortalStatCard label="Average margin" value={averageMargin} meta="Across active pricing plans" />
        <PortalStatCard label="Default currency" value={accountCurrency.toUpperCase()} meta="Workspace payout currency" />
      </div>

      <PortalSurfaceCard title="Plan visibility" description="Use inactive mode to review archived pricing without changing history.">
        <div className="flex flex-wrap items-center gap-3">
          <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
          <Label htmlFor="show-inactive" className="text-sm font-normal">
            Show inactive plans
          </Label>
        </div>
      </PortalSurfaceCard>

      {pricingLoading ? <PortalLoadingState label="Loading plan pricing..." /> : null}
      {!pricingLoading && pricingError ? (
        <PortalSurfaceCard title="Pricing unavailable">
          <p className="text-sm text-rose-700 dark:text-rose-300">{pricingError}</p>
        </PortalSurfaceCard>
      ) : null}

      {!pricingLoading && !pricingError && visiblePlans.length === 0 ? (
        <PortalEmptyState
          title="No active plans"
          description="Add a plan with sold amount, base cost, and fee to define your margin."
          action={canManagePricing ? (
            <PortalActionButton onPress={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add plan
            </PortalActionButton>
          ) : null}
        />
      ) : null}

      {!pricingLoading && !pricingError && visiblePlans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlans.map((row) => (
            <PortalSurfaceCard
              key={row.id}
              title={<span className="font-mono text-base uppercase tracking-[0.12em]">{row.plan_code}</span>}
              description={<span className="uppercase">{row.currency}</span>}
              className={cn(!row.is_active && "opacity-80")}
            >
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <Chip size="sm" variant="soft" color={row.is_active ? "success" : "default"}>
                    {row.is_active ? "Active" : "Inactive"}
                  </Chip>
                  {canManagePricing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{row.is_active ? "Live" : "Disabled"}</span>
                      <Switch
                        checked={row.is_active}
                        onCheckedChange={() => void handleTogglePricingOverrideStatus(row)}
                        disabled={updatingPricingId === row.id}
                        aria-label={row.is_active ? "Deactivate plan" : "Activate plan"}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sold</p>
                    <p className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCents(row.amount_sold_cents, row.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Net payout</p>
                    <p className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCents(row.net_payout_cents, row.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Margin</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-semibold tabular-nums text-slate-900 dark:text-white">{marginPercent(row)}%</p>
                      </TooltipTrigger>
                      <TooltipContent>Net ÷ sold × 100</TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fee</p>
                    <p className="tabular-nums text-slate-700 dark:text-slate-200">{formatCents(row.white_label_fee_cents, row.currency)}</p>
                  </div>
                </div>
              </div>
            </PortalSurfaceCard>
          ))}
        </div>
      ) : null}

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add plan pricing</SheetTitle>
            <SheetDescription>Set sold price, platform costs, and your fee. Preview updates live.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-plan">Plan code</Label>
                <Input
                  id="p-plan"
                  placeholder="statxeo_core"
                  value={pricingForm.planCode}
                  onChange={(e) => setPricingForm((c) => ({ ...c, planCode: e.target.value }))}
                  disabled={isCreatingPricingOverride}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-cur">Currency</Label>
                <Input
                  id="p-cur"
                  placeholder="usd"
                  value={pricingForm.currency}
                  onChange={(e) => setPricingForm((c) => ({ ...c, currency: e.target.value }))}
                  disabled={isCreatingPricingOverride}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="p-sold">Amount sold</Label>
                <Input
                  id="p-sold"
                  inputMode="decimal"
                  value={pricingForm.amountSold}
                  onChange={(e) => setPricingForm((c) => ({ ...c, amountSold: e.target.value }))}
                  disabled={isCreatingPricingOverride}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-base">Base cost</Label>
                <Input
                  id="p-base"
                  inputMode="decimal"
                  value={pricingForm.baseCost}
                  onChange={(e) => setPricingForm((c) => ({ ...c, baseCost: e.target.value }))}
                  disabled={isCreatingPricingOverride}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-fee">White-label fee</Label>
                <Input
                  id="p-fee"
                  inputMode="decimal"
                  value={pricingForm.whiteLabelFee}
                  onChange={(e) => setPricingForm((c) => ({ ...c, whiteLabelFee: e.target.value }))}
                  disabled={isCreatingPricingOverride}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Preview net payout</span>
              <span className="font-semibold tabular-nums">
                {pricingPreviewNetPayoutCents === null
                  ? "—"
                  : formatCents(pricingPreviewNetPayoutCents, pricingForm.currency || accountCurrency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="p-active">Active on create</Label>
              <Switch
                id="p-active"
                checked={pricingForm.isActive}
                onCheckedChange={(v) => setPricingForm((c) => ({ ...c, isActive: v }))}
                disabled={isCreatingPricingOverride}
              />
            </div>
            {pricingMutationError ? <p className="text-destructive text-sm">{pricingMutationError}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                const ok = await handleCreatePricingOverride()
                if (ok) setAddOpen(false)
              }}
              disabled={isCreatingPricingOverride}
            >
              {isCreatingPricingOverride ? "Saving…" : "Save plan"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
