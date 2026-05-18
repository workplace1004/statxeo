"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Wallet } from "lucide-react"
import { Chip } from "@heroui/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PortalActionButton, PortalEmptyState, PortalHero, PortalLoadingState, PortalStatCard, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { PortalDataTable } from "@/components/portal/portal-data-table"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents, formatDateTime } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerPayoutBatch } from "@/lib/statxeo/white-labeler-client"

export function WhiteLabelerPayoutsPage() {
  const {
    payouts,
    payoutsLoading,
    payoutsError,
    canManagePricing,
    payoutMutationError,
    updatingPayoutId,
    handleAdvancePayoutStatus,
  } = useWhiteLabelerPortal()

  const [showAll, setShowAll] = useState(false)
  const [confirmRow, setConfirmRow] = useState<WhiteLabelerPayoutBatch | null>(null)

  const sorted = useMemo(() => [...payouts].sort((a, b) => b.settlement_month.localeCompare(a.settlement_month)), [payouts])

  const nextPayout = useMemo(() => {
    const draft = sorted.find((p) => p.status === "draft")
    if (draft) return draft
    return sorted.find((p) => p.status === "finalized") ?? sorted[0] ?? null
  }, [sorted])

  const byStatus = useMemo(() => {
    return {
      draft: sorted.filter((p) => p.status === "draft"),
      finalized: sorted.filter((p) => p.status === "finalized"),
      paid: sorted.filter((p) => p.status === "paid"),
    }
  }, [sorted])

  const confirmLabel =
    confirmRow?.status === "draft"
      ? "Finalize this batch? It will move to finalized and be ready to mark as paid."
      : "Mark this batch as paid? Ensure funds have been sent in Stripe."

  const totalNet = useMemo(
    () => sorted.reduce((sum, row) => sum + row.net_amount_cents, 0),
    [sorted],
  )

  const payoutColumns = useMemo(
    () => [
      {
        key: "month",
        label: "Month",
        rowHeader: true,
        sortable: true,
        sortValue: (row: WhiteLabelerPayoutBatch) => row.settlement_month,
        render: (row: WhiteLabelerPayoutBatch) => row.settlement_month,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sortValue: (row: WhiteLabelerPayoutBatch) => row.status,
        render: (row: WhiteLabelerPayoutBatch) => (
          <Chip
            size="sm"
            variant="soft"
            color={row.status === "paid" ? "success" : row.status === "finalized" ? "accent" : "warning"}
            className="capitalize"
          >
            {row.status}
          </Chip>
        ),
      },
      {
        key: "gross",
        label: "Gross",
        sortable: true,
        sortValue: (row: WhiteLabelerPayoutBatch) => row.gross_amount_cents,
        render: (row: WhiteLabelerPayoutBatch) => <span className="tabular-nums">{formatCents(row.gross_amount_cents, row.currency)}</span>,
      },
      {
        key: "net",
        label: "Net",
        sortable: true,
        sortValue: (row: WhiteLabelerPayoutBatch) => row.net_amount_cents,
        render: (row: WhiteLabelerPayoutBatch) => <span className="tabular-nums">{formatCents(row.net_amount_cents, row.currency)}</span>,
      },
      {
        key: "generated",
        label: "Generated",
        sortable: true,
        sortValue: (row: WhiteLabelerPayoutBatch) => row.generated_at,
        render: (row: WhiteLabelerPayoutBatch) => formatDateTime(row.generated_at),
      },
      ...(canManagePricing
        ? [{
            key: "actions",
            label: "Actions",
            className: "text-right",
            headerClassName: "text-right",
            render: (row: WhiteLabelerPayoutBatch) => (
              <div className="flex justify-end">
                {row.status === "draft" || row.status === "finalized" ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRow(row)}>
                    {row.status === "draft" ? "Finalize" : "Mark paid"}
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                )}
              </div>
            ),
          }]
        : []),
    ],
    [canManagePricing],
  )

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Revenue Workspace"
        initials="PO"
        title="Payouts"
        description="Monthly settlement batches. Move drafts forward when you're ready to lock and pay."
        status={
          <Chip size="sm" variant="soft" color={nextPayout?.status === "draft" ? "warning" : nextPayout?.status === "finalized" ? "accent" : "success"}>
            {nextPayout ? `${nextPayout.status} focus` : "No payout batches"}
          </Chip>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Total batches" value={String(sorted.length)} meta="All settlement batches" />
        <PortalStatCard label="Draft batches" value={String(byStatus.draft.length)} meta="Awaiting lock before payout" />
        <PortalStatCard label="Paid batches" value={String(byStatus.paid.length)} meta="Completed settlement months" />
        <PortalStatCard label="Net total" value={formatCents(totalNet, sorted[0]?.currency ?? "usd")} meta="Across all recorded batches" />
      </div>

      {payoutMutationError ? <p className="text-destructive text-sm">{payoutMutationError}</p> : null}

      {payoutsLoading ? <PortalLoadingState label="Loading payout batches..." /> : null}
      {!payoutsLoading && payoutsError ? (
        <PortalSurfaceCard title="Payouts unavailable">
          <p className="text-sm text-rose-700 dark:text-rose-300">{payoutsError}</p>
        </PortalSurfaceCard>
      ) : null}

      {!payoutsLoading && !payoutsError && nextPayout ? (
        <PortalSurfaceCard title="Next focus" description={
          <span>
              {nextPayout.settlement_month} · <span className="capitalize">{nextPayout.status}</span>
              {nextPayout.finalized_at ? ` · Finalized ${formatDateTime(nextPayout.finalized_at)}` : ""}
          </span>
        }>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
              {formatCents(nextPayout.net_amount_cents, nextPayout.currency)}
            </p>
            {canManagePricing && (nextPayout.status === "draft" || nextPayout.status === "finalized") ? (
              <Button
                type="button"
                onClick={() => setConfirmRow(nextPayout)}
                disabled={updatingPayoutId === nextPayout.id}
              >
                {nextPayout.status === "draft" ? "Finalize batch" : "Mark paid"}
              </Button>
            ) : null}
          </div>
        </PortalSurfaceCard>
      ) : null}

      {!payoutsLoading && !payoutsError && payouts.length === 0 ? (
        <PortalEmptyState
          title="No payout batches yet"
          description="Batches are generated from billing activity. Sell through checkout to populate payouts."
          action={<Wallet className="mx-auto size-5" />}
        />
      ) : null}

      {!payoutsLoading && !payoutsError && payouts.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(["draft", "finalized", "paid"] as const).map((status) => (
              <PortalSurfaceCard key={status} title={<span className="capitalize">{status}</span>} description={`${byStatus[status].length} batches`}>
                <div className="space-y-2">
                  {byStatus[status].slice(0, 4).map((row) => (
                    <div key={row.id} className="rounded-md border border-border/60 px-3 py-2 text-sm">
                      <div className="flex justify-between gap-2 font-medium">
                        <span>{row.settlement_month}</span>
                        <span className="tabular-nums">{formatCents(row.net_amount_cents, row.currency)}</span>
                      </div>
                    </div>
                  ))}
                  {byStatus[status].length === 0 ? (
                    <p className="text-muted-foreground text-sm">None</p>
                  ) : null}
                </div>
              </PortalSurfaceCard>
            ))}
          </div>

          <Collapsible open={showAll} onOpenChange={setShowAll}>
            <CollapsibleTrigger asChild>
              <PortalActionButton variant="outline">
                {showAll ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                {showAll ? "Hide full ledger" : "Show full ledger"}
              </PortalActionButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <PortalDataTable
                title="Full ledger"
                description="All payout batches for this workspace."
                rows={sorted}
                getRowId={(row) => row.id}
                columns={payoutColumns}
                emptyTitle="No payout history"
                emptyDescription="Payout batches will appear here once billing activity is processed."
              />
            </CollapsibleContent>
          </Collapsible>
        </>
      ) : null}

      <AlertDialog open={confirmRow !== null} onOpenChange={(o) => !o && setConfirmRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payout action</AlertDialogTitle>
            <AlertDialogDescription>{confirmLabel}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (confirmRow) void handleAdvancePayoutStatus(confirmRow).then(() => setConfirmRow(null))
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
