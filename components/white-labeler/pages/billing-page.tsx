"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents, formatDateTime } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerCharge } from "@/lib/statxeo/white-labeler-client"
import { cn } from "@/lib/utils"

type SortKey = "charged_at" | "plan_code" | "amount_sold_cents" | "charge_status"

const SORT_KEYS: SortKey[] = ["charged_at", "plan_code", "amount_sold_cents", "charge_status"]

export function WhiteLabelerBillingPage() {
  const { billing, billingLoading, billingError, overview, accountCurrency } = useWhiteLabelerPortal()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const statusFilter = searchParams.get("status")
  const planFilter = searchParams.get("plan")
  const rawSort = searchParams.get("sort")
  const sortKey: SortKey =
    rawSort && (SORT_KEYS as readonly string[]).includes(rawSort) ? (rawSort as SortKey) : "charged_at"
  const sortDir = searchParams.get("dir") === "asc" ? "asc" : "desc"

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k)
        else next.set(k, v)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const [detail, setDetail] = useState<WhiteLabelerCharge | null>(null)

  const statuses = useMemo(() => {
    const s = new Set<string>()
    billing.forEach((c) => s.add(c.charge_status))
    return Array.from(s).sort()
  }, [billing])

  const plans = useMemo(() => {
    const s = new Set<string>()
    billing.forEach((c) => s.add(c.plan_code))
    return Array.from(s).sort()
  }, [billing])

  const filtered = useMemo(() => {
    let rows = [...billing]
    if (statusFilter) rows = rows.filter((c) => c.charge_status === statusFilter)
    if (planFilter) rows = rows.filter((c) => c.plan_code === planFilter)
    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortKey === "charged_at") return (Date.parse(a.charged_at) - Date.parse(b.charged_at)) * dir
      if (sortKey === "plan_code") return a.plan_code.localeCompare(b.plan_code) * dir
      if (sortKey === "amount_sold_cents") return (a.amount_sold_cents - b.amount_sold_cents) * dir
      return a.charge_status.localeCompare(b.charge_status) * dir
    })
    return rows
  }, [billing, statusFilter, planFilter, sortKey, sortDir])

  const mtdLabel = overview?.period.settlementMonth ?? "This period"

  const exportCsv = () => {
    const headers = ["charged_at", "plan_code", "event_id", "sold", "net", "status", "currency"]
    const lines = [
      headers.join(","),
      ...filtered.map((r) =>
        [
          JSON.stringify(formatDateTime(r.charged_at)),
          JSON.stringify(r.plan_code),
          JSON.stringify(r.source_event_id),
          (r.amount_sold_cents / 100).toFixed(2),
          (r.net_payout_cents / 100).toFixed(2),
          JSON.stringify(r.charge_status),
          JSON.stringify(r.currency),
        ].join(","),
      ),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      patchQuery({ dir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      patchQuery({ sort: key, dir: key === "charged_at" ? "desc" : "asc" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Revenue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Billing</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Charges that roll into payouts. Filter and export for reconciliation.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{mtdLabel} revenue</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {overview ? formatCents(overview.kpis.monthRevenueCents, accountCurrency) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Charges shown</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{filtered.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total net (filtered)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCents(
                filtered.reduce((acc, r) => acc + r.net_payout_cents, 0),
                filtered[0]?.currency ?? accountCurrency,
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-muted-foreground mr-1 text-sm">Status:</span>
        <Button
          type="button"
          variant={statusFilter === null ? "secondary" : "outline"}
          size="sm"
          onClick={() => patchQuery({ status: null })}
        >
          All
        </Button>
        {statuses.map((st) => (
          <Button
            key={st}
            type="button"
            variant={statusFilter === st ? "secondary" : "outline"}
            size="sm"
            className="capitalize"
            onClick={() => patchQuery({ status: st })}
          >
            {st}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-muted-foreground mr-1 text-sm">Plan:</span>
        <Button type="button" variant={planFilter === null ? "secondary" : "outline"} size="sm" onClick={() => patchQuery({ plan: null })}>
          All
        </Button>
        {plans.map((p) => (
          <Button
            key={p}
            type="button"
            variant={planFilter === p ? "secondary" : "outline"}
            size="sm"
            onClick={() => patchQuery({ plan: p })}
          >
            {p}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
          <CardDescription>Sorted {sortDir === "asc" ? "ascending" : "descending"} by {sortKey.replace("_", " ")}.</CardDescription>
        </CardHeader>
        <CardContent>
          {billingLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : billingError ? (
            <p className="text-destructive text-sm">{billingError}</p>
          ) : filtered.length === 0 ? (
            <Empty className="border border-border/60 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCard />
                </EmptyMedia>
                <EmptyTitle>No charges match</EmptyTitle>
                <EmptyDescription>Adjust filters or complete client checkouts to see revenue.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("charged_at")}>
                      Charged {sortKey === "charged_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("plan_code")}>
                      Plan {sortKey === "plan_code" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("amount_sold_cents")}>
                      Sold {sortKey === "amount_sold_cents" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="cursor-pointer select-none capitalize" onClick={() => toggleSort("charge_status")}>
                      Status {sortKey === "charge_status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn("cursor-pointer")}
                      onClick={() => setDetail(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setDetail(row)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Charge detail ${row.plan_code}`}
                    >
                      <TableCell>{formatDateTime(row.charged_at)}</TableCell>
                      <TableCell>{row.plan_code}</TableCell>
                      <TableCell className="font-mono text-xs">{row.source_event_id}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCents(row.amount_sold_cents, row.currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCents(row.net_payout_cents, row.currency)}</TableCell>
                      <TableCell className="capitalize">{row.charge_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Charge detail</SheetTitle>
            <SheetDescription>Stripe-linked billing event for payouts.</SheetDescription>
          </SheetHeader>
          {detail ? (
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Charged at</dt>
                <dd>{formatDateTime(detail.charged_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plan</dt>
                <dd>{detail.plan_code}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source event id</dt>
                <dd className="font-mono text-xs break-all">{detail.source_event_id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Settlement month</dt>
                <dd>{detail.settlement_month}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sold</dt>
                <dd className="tabular-nums">{formatCents(detail.amount_sold_cents, detail.currency)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Net payout</dt>
                <dd className="tabular-nums">{formatCents(detail.net_payout_cents, detail.currency)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{detail.charge_status}</dd>
              </div>
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
