"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents, formatDateTime } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerPayoutBatch } from "@/lib/statxeo/white-labeler-client"
import { Wallet } from "lucide-react"

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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Revenue</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Payouts</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Monthly settlement batches. Move drafts forward when you&apos;re ready to lock and pay.
        </p>
      </div>

      {payoutMutationError ? <p className="text-destructive text-sm">{payoutMutationError}</p> : null}

      {payoutsLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : payoutsError ? (
        <p className="text-destructive text-sm">{payoutsError}</p>
      ) : nextPayout ? (
        <Card className="border-primary/25 bg-primary/5">
          <CardHeader>
            <CardDescription>Next focus</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCents(nextPayout.net_amount_cents, nextPayout.currency)}
            </CardTitle>
            <CardDescription>
              {nextPayout.settlement_month} · <span className="capitalize">{nextPayout.status}</span>
              {nextPayout.finalized_at ? ` · Finalized ${formatDateTime(nextPayout.finalized_at)}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canManagePricing && (nextPayout.status === "draft" || nextPayout.status === "finalized") ? (
              <Button
                type="button"
                onClick={() => setConfirmRow(nextPayout)}
                disabled={updatingPayoutId === nextPayout.id}
              >
                {nextPayout.status === "draft" ? "Finalize batch" : "Mark paid"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {!payoutsLoading && !payoutsError && payouts.length === 0 ? (
        <Empty className="border border-border/60 py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>No payout batches yet</EmptyTitle>
            <EmptyDescription>Batches are generated from billing activity—sell through checkout to populate payouts.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(["draft", "finalized", "paid"] as const).map((status) => (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{status}</CardTitle>
                  <CardDescription>{byStatus[status].length} batches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
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
                </CardContent>
              </Card>
            ))}
          </div>

          <Collapsible open={showAll} onOpenChange={setShowAll}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                {showAll ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                {showAll ? "Hide full ledger" : "Show full ledger"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full ledger</CardTitle>
                  <CardDescription>All payout batches for this workspace.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Net</TableHead>
                        <TableHead>Generated</TableHead>
                        {canManagePricing ? <TableHead>Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.settlement_month}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                          <TableCell className="tabular-nums">{formatCents(row.gross_amount_cents, row.currency)}</TableCell>
                          <TableCell className="tabular-nums">{formatCents(row.net_amount_cents, row.currency)}</TableCell>
                          <TableCell>{formatDateTime(row.generated_at)}</TableCell>
                          {canManagePricing ? (
                            <TableCell>
                              {row.status === "draft" || row.status === "finalized" ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRow(row)}>
                                  {row.status === "draft" ? "Finalize" : "Mark paid"}
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

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
