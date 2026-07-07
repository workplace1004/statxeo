"use client";

import {ArrowRightFromSquare, Check, PlugWire, ShieldCheck} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip} from "@heroui/react";
import {DataGrid} from "@heroui-pro/react";
import type {DataGridColumn} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import type {AgencyData} from "../../server/queries/platform";
import type {Lead} from "../../server/db/schemas/leads";
import {PageToolbar} from "../../widgets/page-toolbar";

export interface PlatformAdminDashboardPageProps {
  agencies: AgencyData[];
  totalMrr: number;
  leads: Lead[];
}

export function PlatformAdminDashboardPage({
  agencies,
  leads,
  totalMrr,
}: PlatformAdminDashboardPageProps) {
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  
  const handleImpersonate = async (agencyId: string) => {
    setImpersonatingId(agencyId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({agencyId}),
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = "/white-label";
      } else {
        alert(data.error?.message || "Failed to impersonate agency");
        setImpersonatingId(null);
      }
    } catch (err) {
      console.error("Impersonation error:", err);
      alert("An unexpected error occurred during impersonation");
      setImpersonatingId(null);
    }
  };

  const leadColumns = useMemo<DataGridColumn<Lead>[]>(
    () => [
      {
        accessorKey: "contactName",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <Avatar.Image alt={item.contactName} src={item.contactAvatar} />
              <Avatar.Fallback>
                {item.contactName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{item.contactName}</span>
              <span className="text-muted text-xs">{item.contactRole}</span>
            </div>
          </div>
        ),
        header: "Contact",
        id: "contactName",
        isRowHeader: true,
        minWidth: 200,
      },
      {
        accessorKey: "company",
        cell: (item) => (
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{item.company}</span>
            <span className="text-muted text-xs">{item.industry}</span>
          </div>
        ),
        header: "Company",
        id: "company",
        minWidth: 150,
      },
      {
        accessorKey: "dealValue",
        cell: (item) => (
          <span className="text-foreground text-sm font-semibold tabular-nums">
            ${item.dealValue.toLocaleString()}
          </span>
        ),
        header: "Value",
        id: "dealValue",
        minWidth: 100,
      },
      {
        accessorKey: "stage",
        cell: (item) => (
          <Chip color={item.tag.color} size="sm" variant="soft">
            {item.stage}
          </Chip>
        ),
        header: "Stage",
        id: "stage",
        minWidth: 120,
      },
      {
        accessorKey: "source",
        cell: (item) => <span className="text-muted text-xs">{item.source}</span>,
        header: "Source",
        id: "source",
        minWidth: 120,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-10 pt-4">
      <PageToolbar
        description="Global command center for StatXEO. Monitor platform health, manage agencies, and oversee revenue."
        title="Platform God Mode"
        trailing={
          <Button size="sm" variant="danger">
            <ShieldCheck className="size-4" />
            Lockdown Mode
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Global MRR Card */}
        <Card className="lg:col-span-2 rounded-2xl">
          <Card.Header className="flex flex-col items-start gap-1 pb-0 pt-5 px-6">
            <h2 className="text-sm font-medium text-default-500">Global Monthly Recurring Revenue</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">
                ${totalMrr.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-success">+12% MoM</span>
            </div>
          </Card.Header>
          <Card.Content className="px-6 py-4">
            <div className="flex items-center gap-4 text-sm text-default-500">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary" />
                Agency Subscriptions
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-success" />
                Ad Spend Margin
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-warning" />
                AI Generation Credits
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* API Provider Health Card */}
        <Card className="rounded-2xl">
          <Card.Header className="px-6 pt-5 pb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">API Provider Health</h3>
            <PlugWire className="size-4 text-default-400" />
          </Card.Header>
          <Card.Content className="px-6 pb-5 flex flex-col gap-3">
            {[
              { name: "OpenAI (GPT-4o)", status: "Operational", ping: "24ms" },
              { name: "Meta Graph API", status: "Operational", ping: "45ms" },
              { name: "Google Ads API", status: "Operational", ping: "38ms" },
              { name: "Outstand API", status: "Operational", ping: "89ms" },
            ].map((provider) => (
              <div key={provider.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex size-4 items-center justify-center rounded-full bg-success/20 text-success">
                    <Check className="size-3" />
                  </div>
                  <span className="font-medium">{provider.name}</span>
                </div>
                <span className="text-default-400 font-mono text-xs">{provider.ping}</span>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>

      {/* Agencies List Card */}
      <Card className="rounded-2xl">
        <Card.Header className="px-6 pt-5 pb-3">
          <h3 className="text-lg font-semibold">Active Agencies</h3>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2 px-6 pb-6">
          {agencies.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">
              No agencies have been provisioned yet.
            </p>
          ) : (
            agencies.map((agency) => (
              <div
                key={agency.id}
                className="hover:bg-content2 -mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors border-b border-default-100 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{agency.name}</span>
                  <span className="text-xs text-default-400">Created {new Date(agency.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex shrink-0 items-center gap-4">
                  <Chip size="sm" variant="soft" color="default">
                    {agency.customerCount} Clients
                  </Chip>
                  <Chip size="sm" variant="soft" color="success">
                    {agency.activeCampaigns} Ads
                  </Chip>
                  
                  <Button 
                    size="sm" 
                    variant="tertiary"
                    isDisabled={impersonatingId !== null}
                    onPress={() => handleImpersonate(agency.id)}
                  >
                    {impersonatingId === agency.id ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <ArrowRightFromSquare className="size-4" />
                    )}
                    {impersonatingId === agency.id ? "Switching…" : "Impersonate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Leads List Card */}
      <Card className="rounded-2xl">
        <Card.Header className="px-6 pt-5 pb-3">
          <h3 className="text-lg font-semibold">Recent Leads</h3>
        </Card.Header>
        <Card.Content className="px-6 pb-6">
          {leads.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">
              No leads have been registered yet.
            </p>
          ) : (
            <DataGrid
              aria-label="Recent Leads"
              columns={leadColumns}
              contentClassName="min-w-[800px]"
              data={leads}
              getRowId={(item) => item.id}
            />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

