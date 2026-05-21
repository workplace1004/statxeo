"use client";

import type {Customer} from "../../server/db/schemas/customers";
import type {DataGridColumn, DataGridSortDescriptor} from "@heroui-pro/react";

import {
  BarsDescendingAlignCenter,
  Eye,
  FileText,
  Funnel,
  LayoutColumns3,
  Pencil,
  PersonPlus,
  Sliders,
} from "@gravity-ui/icons";
import {Avatar, Button, Chip, Dropdown, Label, ProgressBar, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useRouter} from "next/navigation";
import {useCallback, useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {InviteCustomerModal} from "../../widgets/white-label/modals/invite-customer-modal";
import {
  CUSTOMER_PLAN_COLOR,
  CUSTOMER_STATUS_COLOR,
} from "../../server/db/schemas/customers";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", {numeric: "auto"});

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) return RELATIVE_FORMATTER.format(diffMinutes, "minute");
  const hours = Math.round(diffMinutes / 60);

  if (Math.abs(hours) < 24) return RELATIVE_FORMATTER.format(hours, "hour");
  const days = Math.round(hours / 24);

  return RELATIVE_FORMATTER.format(days, "day");
}

export interface WhiteLabelCustomersPageProps {
  customers: Customer[];
}

export function WhiteLabelCustomersPage({customers}: WhiteLabelCustomersPageProps) {
  const router = useRouter();
  const inviteState = useOverlayState();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "mrr",
    direction: "descending",
  });

  const filtered = useMemo<Customer[]>(() => {
    let rows = [...customers];
    if (statusFilter) rows = rows.filter((c) => c.status === statusFilter);
    if (!search) return rows;
    const q = search.toLowerCase();

    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q),
    );
  }, [customers, search, statusFilter]);

  const sorted = useMemo<Customer[]>(() => {
    if (!sortDescriptor.column) return filtered;
    const column = sortDescriptor.column as keyof Customer;

    return [...filtered].sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      const direction = sortDescriptor.direction === "descending" ? -1 : 1;

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;

      return String(av ?? "").localeCompare(String(bv ?? "")) * direction;
    });
  }, [filtered, sortDescriptor]);

  const totals = useMemo(() => {
    const active = customers.filter((c) => c.status === "Active").length;
    const mrr = customers.reduce((sum, c) => sum + c.mrr, 0);
    const onboarding = customers.filter(
      (c) => c.status === "Onboarding" || c.status === "Trial",
    ).length;
    const churnRisk = customers.filter((c) => c.health < 70 && c.status === "Active").length;

    return {active, churnRisk, mrr, onboarding};
  }, [customers]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  const columns = useMemo<DataGridColumn<Customer>[]>(
    () => {
      const openCustomer = (id: string, action: string) => {
        notifyInfo(`${action} — ${customers.find((c) => c.id === id)?.name ?? "customer"}`);
      };

      return [
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <Avatar.Image alt={item.name} src={item.avatar} />
              <Avatar.Fallback>
                {item.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-medium leading-tight">
                {item.name}
              </span>
              <span className="text-muted text-xs leading-tight">
                {item.contactName} · {item.contactEmail}
              </span>
            </div>
          </div>
        ),
        header: "Customer",
        id: "name",
        isRowHeader: true,
        minWidth: 260,
      },
      {
        accessorKey: "industry",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex flex-col">
            <span className="text-foreground text-xs font-medium">{item.industry}</span>
            <span className="text-muted text-xs">{item.city}</span>
          </div>
        ),
        header: "Industry",
        id: "industry",
        minWidth: 160,
      },
      {
        accessorKey: "plan",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={CUSTOMER_PLAN_COLOR[item.plan]} size="sm" variant="soft">
            {item.plan}
          </Chip>
        ),
        header: "Plan",
        id: "plan",
        minWidth: 110,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={CUSTOMER_STATUS_COLOR[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        accessorKey: "mrr",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="tabular-nums"
            currency="USD"
            maximumFractionDigits={0}
            style="currency"
            value={item.mrr}
          />
        ),
        header: "MRR",
        id: "mrr",
        minWidth: 100,
      },
      {
        accessorKey: "sites",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">
            {item.sites} {item.sites === 1 ? "site" : "sites"}
          </span>
        ),
        header: "Sites",
        id: "sites",
        minWidth: 90,
      },
      {
        accessorKey: "keywords",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{item.keywords.toLocaleString()}</span>
        ),
        header: "Keywords",
        id: "keywords",
        minWidth: 110,
      },
      {
        accessorKey: "health",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <ProgressBar
              aria-label="Health"
              className="w-20"
              color={item.health >= 80 ? "success" : item.health >= 65 ? "warning" : "danger"}
              size="sm"
              value={item.health}
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <span className="text-muted w-7 text-right text-xs tabular-nums">{item.health}</span>
          </div>
        ),
        header: "Health",
        id: "health",
        minWidth: 150,
      },
      {
        accessorKey: "lastActivity",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs">{relativeTime(item.lastActivity)}</span>
        ),
        header: "Last activity",
        id: "lastActivity",
        minWidth: 120,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-0.5" data-customer-id={item.id}>
            <IconButton
              label="Open profile"
              size="sm"
              variant="tertiary"
              onPress={() => openCustomer(item.id, "Profile")}
            >
              <Eye className="size-4" />
            </IconButton>
            <IconButton
              label="Edit customer"
              size="sm"
              variant="tertiary"
              onPress={() => openCustomer(item.id, "Edit")}
            >
              <Pencil className="size-4" />
            </IconButton>
            <IconButton
              label="Open invoices"
              size="sm"
              variant="tertiary"
              onPress={() => router.push("/white-label/billing")}
            >
              <FileText className="size-4" />
            </IconButton>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 140,
      },
    ];
    },
    [customers, router],
  );

  const isEmpty = customers.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Search, segment, and manage every customer on your white-label."
        showPeriod={false}
        title="Customers"
        trailing={
          <InviteCustomerModal
            state={inviteState}
            trigger={
              <Button size="sm">
                <PersonPlus className="size-4" />
                Invite customer
              </Button>
            }
          />
        }
      />

      {isEmpty ? (
        <EmptyState
          body="Customers you invite to your white-label will appear here."
          cta={{label: "Invite customer", onPress: inviteState.open}}
          icon={PersonPlus}
          title="No customers yet"
        />
      ) : (
        <>
          <KPIGroup>
            <KPI>
              <KPI.Header>
                <KPI.Title>Active customers</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={totals.active} />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Total MRR</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={totals.mrr}
                />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Onboarding / trial</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={totals.onboarding} />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Churn risk</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={totals.churnRisk} />
              </KPI.Content>
            </KPI>
          </KPIGroup>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Dropdown>
                <Button size="sm" variant="tertiary">
                  <Funnel className="size-4" />
                  {statusFilter ? `Status: ${statusFilter}` : "Filter"}
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "all") setStatusFilter(null);
                      else setStatusFilter(String(key));
                    }}
                  >
                    <Dropdown.Item id="all" textValue="All statuses">
                      <Label>All statuses</Label>
                    </Dropdown.Item>
                    {(["Active", "Onboarding", "Trial", "Paused", "Churned"] as const).map((s) => (
                      <Dropdown.Item key={s} id={s} textValue={s}>
                        <Label>{s}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
              <Button
                size="sm"
                variant="tertiary"
                onPress={() =>
                  setSortDescriptor({column: "mrr", direction: "descending"})
                }
              >
                <BarsDescendingAlignCenter className="size-4" />
                Sort by MRR
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => notifyInfo("Column visibility saved for this session")}
              >
                <LayoutColumns3 className="size-4" />
                Columns
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => notifySuccess("View saved")}
              >
                <Sliders className="size-4" />
                Saved views
              </Button>
            </div>
            <SearchField
              aria-label="Search customers"
              className="w-full sm:w-[260px]"
              name="customers-search"
              onChange={handleSearchChange}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search by name, city, contact…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          <DataGrid
            aria-label="Customers"
            columns={columns}
            contentClassName="min-w-[1180px]"
            data={sorted}
            getRowId={(item) => item.id}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          />
        </>
      )}
      <InviteCustomerModal state={inviteState} />
    </div>
  );
}
