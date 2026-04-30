"use client"

import { useMemo, useState } from "react"
import { ExternalLink, MoreHorizontal, Plus, Search, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatCents, formatDate } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerClient } from "@/lib/statxeo/white-labeler-client"

export function WhiteLabelerClientsPage() {
  const {
    clients,
    clientsLoading,
    clientsError,
    canManageClients,
    canSellFromLaunch,
    overview,
    clientForm,
    setClientForm,
    clientsMutationError,
    isCreatingClient,
    handleCreateClient,
    checkoutMutationError,
    isCreatingCheckoutSession,
    activePricingPlans,
    checkoutForm,
    setCheckoutForm,
    lastCheckoutSession,
    handleCreateCheckoutSession,
  } = useWhiteLabelerPortal()

  const [addOpen, setAddOpen] = useState(false)
  const [checkoutClientId, setCheckoutClientId] = useState<string | null>(null)
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    if (!q.trim()) return clients
    const s = q.trim().toLowerCase()
    return clients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(s) ||
        (c.billing_email && c.billing_email.toLowerCase().includes(s)),
    )
  }, [clients, q])

  const showSearch = clients.length > 5

  const openCheckout = (client: WhiteLabelerClient) => {
    setCheckoutClientId(client.id)
    setCheckoutForm((f) => ({
      ...f,
      clientId: client.id,
      planOverrideId: f.planOverrideId || activePricingPlans[0]?.id || "",
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Revenue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Clients</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Managed accounts you sell to. Create checkout links when Stripe charges are enabled and go-live checks pass.
          </p>
        </div>
        {canManageClients ? (
          <Button type="button" className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add client
          </Button>
        ) : null}
      </div>

      {showSearch ? (
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input
            placeholder="Search clients…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            aria-label="Search clients"
          />
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              {clients.length} {clients.length === 1 ? "client" : "clients"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clientsError ? (
            <p className="text-destructive text-sm">{clientsError}</p>
          ) : clients.length === 0 ? (
            <Empty className="border border-border/60 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No clients yet</EmptyTitle>
                <EmptyDescription>
                  Add your first client to start issuing checkout links once Stripe and branding minimums are satisfied.
                </EmptyDescription>
              </EmptyHeader>
              {canManageClients ? (
                <Button type="button" className="mt-4" onClick={() => setAddOpen(true)}>
                  Add client
                </Button>
              ) : null}
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead className="hidden sm:table-cell">Billing email</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  {canManageClients ? <TableHead className="w-12 text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.client_name}</TableCell>
                    <TableCell className="capitalize">{row.status}</TableCell>
                    <TableCell>{row.active_site_count}</TableCell>
                    <TableCell className="hidden sm:table-cell">{row.billing_email ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(row.created_at)}</TableCell>
                    {canManageClients ? (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="size-11" aria-label="Open actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openCheckout(row)}
                              disabled={!overview?.stripe.chargesEnabled || !canSellFromLaunch || activePricingPlans.length === 0}
                            >
                              Create checkout link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add client</SheetTitle>
            <SheetDescription>Creates a managed client record for your white-label program.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <div className="space-y-2">
              <Label htmlFor="add-client-name">Client name</Label>
              <Input
                id="add-client-name"
                value={clientForm.clientName}
                onChange={(e) => setClientForm((c) => ({ ...c, clientName: e.target.value }))}
                placeholder="Acme Ventures"
                disabled={isCreatingClient}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-billing-email">Billing email</Label>
              <Input
                id="add-billing-email"
                value={clientForm.billingEmail}
                onChange={(e) => setClientForm((c) => ({ ...c, billingEmail: e.target.value }))}
                placeholder="billing@acme.com"
                disabled={isCreatingClient}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-external-id">External customer id</Label>
              <Input
                id="add-external-id"
                value={clientForm.externalCustomerId}
                onChange={(e) => setClientForm((c) => ({ ...c, externalCustomerId: e.target.value }))}
                placeholder="acme-ventures"
                disabled={isCreatingClient}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-sites">Active sites</Label>
              <Input
                id="add-sites"
                inputMode="numeric"
                value={clientForm.activeSiteCount}
                onChange={(e) => setClientForm((c) => ({ ...c, activeSiteCount: e.target.value }))}
                disabled={isCreatingClient}
              />
            </div>
            {clientsMutationError ? <p className="text-destructive text-sm">{clientsMutationError}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                const ok = await handleCreateClient()
                if (ok) setAddOpen(false)
              }}
              disabled={isCreatingClient}
            >
              {isCreatingClient ? "Creating…" : "Create client"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={Boolean(checkoutClientId)}
        onOpenChange={(o) => {
          if (!o) setCheckoutClientId(null)
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Checkout link</SheetTitle>
            <SheetDescription>Generates a Stripe Checkout session with destination charges.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={checkoutForm.clientId}
                onValueChange={(v) => setCheckoutForm((c) => ({ ...c, clientId: v }))}
                disabled={isCreatingCheckoutSession}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={checkoutForm.planOverrideId}
                onValueChange={(v) => setCheckoutForm((c) => ({ ...c, planOverrideId: v }))}
                disabled={isCreatingCheckoutSession || activePricingPlans.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {activePricingPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plan_code} · {formatCents(p.amount_sold_cents, p.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!overview?.stripe.chargesEnabled ? (
              <p className="text-muted-foreground text-sm">Enable Stripe charges under Account before creating links.</p>
            ) : !canSellFromLaunch ? (
              <p className="text-muted-foreground text-sm">
                Complete go-live requirements (Account + branding) before creating checkout links.
              </p>
            ) : null}
            {checkoutMutationError ? <p className="text-destructive text-sm">{checkoutMutationError}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={() => void handleCreateCheckoutSession()}
              disabled={
                isCreatingCheckoutSession ||
                !checkoutForm.clientId ||
                !checkoutForm.planOverrideId ||
                !overview?.stripe.chargesEnabled ||
                !canSellFromLaunch
              }
            >
              {isCreatingCheckoutSession ? "Generating…" : "Create checkout link"}
            </Button>
            {lastCheckoutSession && checkoutClientId ? (
              <div className="space-y-2 rounded-lg border border-border/60 p-3 text-sm">
                <p className="font-medium">Session ready</p>
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <a href={lastCheckoutSession.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open checkout
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
