"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerPlanOverride } from "@/lib/statxeo/white-labeler-client"
import { DollarSign } from "lucide-react"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Revenue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Plan pricing</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Net payout = amount sold − (base cost + white-label fee). Toggle plans off instead of deleting history.
          </p>
        </div>
        {canManagePricing ? (
          <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add plan
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
        <Label htmlFor="show-inactive" className="text-sm font-normal">
          Show inactive plans
        </Label>
      </div>

      {pricingLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : pricingError ? (
        <p className="text-destructive text-sm">{pricingError}</p>
      ) : visiblePlans.length === 0 ? (
        <Empty className="border border-border/60 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DollarSign />
            </EmptyMedia>
            <EmptyTitle>No active plans</EmptyTitle>
            <EmptyDescription>Add a plan with sold amount, base cost, and fee to define your margin.</EmptyDescription>
          </EmptyHeader>
          {canManagePricing ? (
            <Button type="button" className="mt-4" onClick={() => setAddOpen(true)}>
              Add plan
            </Button>
          ) : null}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlans.map((row) => (
            <Card key={row.id} className={cn(!row.is_active && "opacity-80")}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div>
                  <CardTitle className="font-mono text-base">{row.plan_code}</CardTitle>
                  <CardDescription className="uppercase">{row.currency}</CardDescription>
                </div>
                {canManagePricing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{row.is_active ? "Active" : "Inactive"}</span>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={() => void handleTogglePricingOverrideStatus(row)}
                      disabled={updatingPricingId === row.id}
                      aria-label={row.is_active ? "Deactivate plan" : "Activate plan"}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">{row.is_active ? "Active" : "Inactive"}</span>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Sold</p>
                    <p className="font-semibold tabular-nums">{formatCents(row.amount_sold_cents, row.currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Net payout</p>
                    <p className="font-semibold tabular-nums">{formatCents(row.net_payout_cents, row.currency)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Margin</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-semibold tabular-nums">{marginPercent(row)}%</p>
                      </TooltipTrigger>
                      <TooltipContent>Net ÷ sold × 100</TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Fee</p>
                    <p className="tabular-nums">{formatCents(row.white_label_fee_cents, row.currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
