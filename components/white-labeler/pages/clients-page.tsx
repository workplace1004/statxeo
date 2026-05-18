"use client"

import { useMemo, useState } from "react"
import { ExternalLink, MoreHorizontal, Plus, Users } from "lucide-react"
import { Chip } from "@heroui/react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PortalActionButton, PortalHero, PortalStatCard, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { PortalDataTable, type PortalTableColumn } from "@/components/portal/portal-data-table"
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
  const openCheckout = (client: WhiteLabelerClient) => {
    setCheckoutClientId(client.id)
    setCheckoutForm((f) => ({
      ...f,
      clientId: client.id,
      planOverrideId: f.planOverrideId || activePricingPlans[0]?.id || "",
    }))
  }

  const activeClients = useMemo(() => clients.filter((client) => client.status === "active").length, [clients])

  const clientColumns = useMemo<PortalTableColumn<WhiteLabelerClient>[]>(() => {
    const columns: PortalTableColumn<WhiteLabelerClient>[] = [
      {
        key: "client",
        label: "Client",
        rowHeader: true,
        sortable: true,
        sortValue: (row) => row.client_name,
        render: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900 dark:text-white">{row.client_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.billing_email ?? "No billing email"}</p>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sortValue: (row) => row.status,
        render: (row) => (
          <Chip
            size="sm"
            variant="soft"
            color={row.status === "active" ? "success" : row.status === "paused" ? "warning" : "default"}
            className="capitalize"
          >
            {row.status}
          </Chip>
        ),
      },
      {
        key: "sites",
        label: "Sites",
        sortable: true,
        sortValue: (row) => row.active_site_count,
        render: (row) => <span className="tabular-nums">{row.active_site_count}</span>,
      },
      {
        key: "created",
        label: "Created",
        sortable: true,
        sortValue: (row) => row.created_at,
        render: (row) => <span>{formatDate(row.created_at)}</span>,
      },
    ]

    if (canManageClients) {
      columns.push({
        key: "actions",
        label: "Actions",
        className: "text-right",
        headerClassName: "text-right",
        render: (row) => (
          <div className="flex justify-end">
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
          </div>
        ),
      })
    }

    return columns
  }, [activePricingPlans.length, canManageClients, canSellFromLaunch, overview?.stripe.chargesEnabled])

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Revenue Workspace"
        initials="CL"
        title="Client Roster"
        description="Managed accounts you sell to. Create checkout links when Stripe charges are enabled and go-live checks pass."
        status={
          <Chip size="sm" variant="soft" color={canSellFromLaunch ? "success" : "warning"}>
            {canSellFromLaunch ? "Launch ready" : "Go-live pending"}
          </Chip>
        }
        actions={canManageClients ? (
          <PortalActionButton onPress={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add client
          </PortalActionButton>
        ) : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Total clients" value={String(clients.length)} meta={clients.length === 1 ? "1 managed account" : `${clients.length} managed accounts`} />
        <PortalStatCard label="Active clients" value={String(activeClients)} meta="Accounts currently live" />
        <PortalStatCard label="Charges status" value={overview?.stripe.chargesEnabled ? "Enabled" : "Pending"} meta="Stripe destination charges" />
        <PortalStatCard label="Pricing plans" value={String(activePricingPlans.length)} meta="Available checkout configurations" />
      </div>

      {!canSellFromLaunch ? (
        <PortalSurfaceCard title="Checkout readiness" description="Go-live blockers still prevent live checkout links.">
          <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Users className="mt-0.5 size-4 shrink-0" />
            <p>Complete Account and Branding requirements before issuing live checkout links to clients.</p>
          </div>
        </PortalSurfaceCard>
      ) : null}

      <PortalDataTable
        title="Roster"
        description={`${clients.length} ${clients.length === 1 ? "client" : "clients"} across your white-label revenue workspace.`}
        rows={clients}
        columns={clientColumns}
        getRowId={(row) => row.id}
        loading={clientsLoading}
        loadingLabel="Loading client roster..."
        error={clientsError}
        searchPlaceholder="Search clients"
        searchMatcher={(row, query) => row.client_name.toLowerCase().includes(query) || (row.billing_email?.toLowerCase().includes(query) ?? false)}
        emptyTitle="No clients yet"
        emptyDescription="Add your first client to start issuing checkout links once Stripe and branding minimums are satisfied."
        filteredEmptyTitle="No clients match this search"
        filteredEmptyDescription="Try a different client name or billing email."
      />

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
