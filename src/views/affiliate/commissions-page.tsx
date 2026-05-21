"use client";

import type {
  Commission,
  CommissionStatus,
  Payout,
  PayoutStatus,
} from "../../server/db/schemas/commissions";
import type {ChipColor} from "../../server/db/schemas/_helpers";
import type {CommissionKpiTotals} from "../../server/queries/affiliate";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowDownToLine, Check, CircleInfo} from "@gravity-ui/icons";
import {Button, Card, Chip, Tabs} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useMemo} from "react";

import {exportCommissionsCsv} from "../../lib/export/export-affiliate-csv";
import {notifySuccess} from "../../lib/ui/white-label-notify";
import {COMMISSION_STATUS_COLORS} from "../../server/db/schemas/commissions";
import {PayoutMethodButton} from "../../widgets/affiliate/modals/payout-method-modal";
import {EmptyState} from "../../widgets/empty-state";

const DATE_FMT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", DATE_FMT);
}

const PAYOUT_STATUS_COLORS: Record<PayoutStatus, ChipColor> = {
  Processing: "warning",
  Scheduled: "default",
  Sent: "success",
};

export interface AffiliateCommissionsPageProps {
  commissions: Commission[];
  payouts: Payout[];
  totals: CommissionKpiTotals;
}

export function AffiliateCommissionsPage({
  commissions,
  payouts,
  totals,
}: AffiliateCommissionsPageProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">
          Track every commission from close to bank — and pause clawbacks before they happen.
        </p>
      </div>

      <KPIGroup>
        <KpiCell label="Paid this year" showSeparator={false} value={totals.paidThisYear} />
        <KpiCell label="Pending" showSeparator value={totals.pending} />
        <KpiCell label="Upcoming" showSeparator value={totals.upcoming} />
        <KpiCell label="Clawbacks (30d)" showSeparator value={totals.clawbacks30d} />
      </KPIGroup>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Card.Title className="text-base">Commissions ledger</Card.Title>
            <Card.Description>Filter by status to drill in.</Card.Description>
          </div>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              exportCommissionsCsv(commissions);
              notifySuccess(
                commissions.length > 0
                  ? `Exported ${commissions.length} commissions`
                  : "Exported commission template (no rows yet)",
              );
            }}
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </Button>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4 px-0">
          {commissions.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                body="Once a referral converts, commissions show up here."
                cta={{href: "/affiliate/links", label: "Share a link"}}
                title="No commissions yet"
              />
            </div>
          ) : (
            <Tabs defaultSelectedKey="paid">
              <Tabs.ListContainer className="px-5">
                <Tabs.List aria-label="Commission status">
                  <Tabs.Tab id="paid">
                    Paid
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="pending">
                    Pending
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="upcoming">
                    Upcoming
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="clawback">
                    Clawbacks
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
              <Tabs.Panel id="paid">
                <CommissionsTable commissions={commissions} status="Paid" />
              </Tabs.Panel>
              <Tabs.Panel id="pending">
                <CommissionsTable commissions={commissions} status="Pending" />
              </Tabs.Panel>
              <Tabs.Panel id="upcoming">
                <CommissionsTable commissions={commissions} status="Upcoming" />
              </Tabs.Panel>
              <Tabs.Panel id="clawback">
                <CommissionsTable commissions={commissions} status="Clawback" />
              </Tabs.Panel>
            </Tabs>
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Card.Title className="text-base">Payout history</Card.Title>
            <Card.Description>
              Past and scheduled monthly payouts to your account on file.
            </Card.Description>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip color="success" size="sm" variant="soft">
              <Check className="size-3.5" />
              Bank verified
            </Chip>
            <PayoutMethodButton />
          </div>
        </Card.Header>
        <Card.Content className="px-0">
          {payouts.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                body="Payouts clear on the 1st of each month after the 30-day clearance window."
                title="No payouts scheduled"
              />
            </div>
          ) : (
            <PayoutHistoryTable payouts={payouts} />
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-start gap-3">
          <div className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-xl">
            <CircleInfo className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <Card.Title className="text-base">How clawbacks work</Card.Title>
            <Card.Description>
              Commissions become eligible after a 30-day chargeback / refund window. Cancellations
              within that window deduct from your next payout.
            </Card.Description>
          </div>
        </Card.Header>
      </Card>
    </div>
  );
}

interface KpiCellProps {
  label: string;
  value: number;
  showSeparator: boolean;
}

function KpiCell({label, showSeparator, value}: KpiCellProps) {
  return (
    <>
      {showSeparator ? <KPIGroup.Separator /> : null}
      <KPI>
        <KPI.Header>
          <KPI.Title>{label}</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            currency="USD"
            maximumFractionDigits={0}
            style="currency"
            value={value}
          />
        </KPI.Content>
      </KPI>
    </>
  );
}

interface CommissionsTableProps {
  commissions: Commission[];
  status: CommissionStatus;
}

function CommissionsTable({commissions, status}: CommissionsTableProps) {
  const data = useMemo<Commission[]>(
    () => commissions.filter((c) => c.status === status),
    [commissions, status],
  );

  const columns = useMemo<DataGridColumn<Commission>[]>(
    () => [
      {
        accessorKey: "reference",
        cell: (item: Commission) => (
          <span className="font-medium tabular-nums">{item.reference}</span>
        ),
        header: "Reference",
        id: "reference",
        isRowHeader: true,
        minWidth: 130,
      },
      {
        accessorKey: "company",
        cell: (item: Commission) => (
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm font-medium">{item.company}</span>
            <span className="text-muted truncate text-xs">{item.plan}</span>
          </div>
        ),
        header: "Customer",
        id: "company",
        minWidth: 220,
      },
      {
        accessorKey: "amount",
        allowsSorting: true,
        cell: (item: Commission) => (
          <NumberValue
            className={`tabular-nums ${item.amount < 0 ? "text-danger" : ""}`}
            currency={item.currency}
            maximumFractionDigits={2}
            style="currency"
            value={item.amount}
          />
        ),
        header: "Amount",
        id: "amount",
        minWidth: 120,
      },
      {
        accessorKey: "status",
        cell: (item: Commission) => (
          <Chip color={COMMISSION_STATUS_COLORS[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 110,
      },
      {
        accessorKey: "closedDate",
        allowsSorting: true,
        cell: (item: Commission) => (
          <span className="text-muted tabular-nums">{formatDate(item.closedDate)}</span>
        ),
        header: "Closed",
        id: "closedDate",
        minWidth: 130,
      },
      {
        accessorKey: "payoutDate",
        cell: (item: Commission) =>
          item.payoutDate ? (
            <span className="text-muted tabular-nums">{formatDate(item.payoutDate)}</span>
          ) : item.reason ? (
            <span className="text-muted text-xs">{item.reason}</span>
          ) : (
            <span className="text-muted text-xs">—</span>
          ),
        header: "Payout / Reason",
        id: "payoutDate",
        minWidth: 180,
      },
    ],
    [],
  );

  return (
    <DataGrid
      aria-label={`${status} commissions`}
      columns={columns}
      contentClassName="min-w-[860px]"
      data={data}
      getRowId={(item: Commission) => item.id}
    />
  );
}

function PayoutHistoryTable({payouts}: {payouts: Payout[]}) {
  const columns = useMemo<DataGridColumn<Payout>[]>(
    () => [
      {
        accessorKey: "reference",
        cell: (item: Payout) => (
          <span className="font-medium tabular-nums">{item.reference}</span>
        ),
        header: "Reference",
        id: "reference",
        isRowHeader: true,
        minWidth: 130,
      },
      {
        accessorKey: "date",
        allowsSorting: true,
        cell: (item: Payout) => (
          <span className="text-muted tabular-nums">{formatDate(item.date)}</span>
        ),
        header: "Date",
        id: "date",
        minWidth: 130,
      },
      {
        accessorKey: "method",
        cell: (item: Payout) => (
          <Chip color="default" size="sm" variant="soft">
            {item.method}
          </Chip>
        ),
        header: "Method",
        id: "method",
        minWidth: 110,
      },
      {
        accessorKey: "status",
        cell: (item: Payout) => (
          <Chip color={PAYOUT_STATUS_COLORS[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        accessorKey: "amount",
        allowsSorting: true,
        cell: (item: Payout) => (
          <NumberValue
            className="tabular-nums"
            currency={item.currency}
            maximumFractionDigits={2}
            style="currency"
            value={item.amount}
          />
        ),
        header: "Amount",
        id: "amount",
        minWidth: 130,
      },
    ],
    [],
  );

  return (
    <DataGrid
      aria-label="Payout history"
      columns={columns}
      contentClassName="min-w-[640px]"
      data={payouts}
      getRowId={(item: Payout) => item.id}
    />
  );
}
