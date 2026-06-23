"use client";

import type {InvoiceCustomer} from "../../server/db/schemas/invoices";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowDownToLine, CreditCard, Receipt, Tachometer} from "@gravity-ui/icons";
import {Button, Card, Chip} from "@heroui/react";
import {DataGrid, NumberValue} from "@heroui-pro/react";
import {useMemo} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {INVOICE_STATUS_COLOR} from "../../server/db/schemas/invoices";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/page-toolbar";

export interface CustomerBillingPageProps {
  invoices: InvoiceCustomer[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomerBillingPage({invoices}: CustomerBillingPageProps) {
  const columns = useMemo<DataGridColumn<InvoiceCustomer>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        cell: (item) => (
          <span className="text-foreground text-sm font-medium tabular-nums">
            {item.invoiceNumber}
          </span>
        ),
        header: "Invoice",
        id: "invoiceNumber",
        isRowHeader: true,
        minWidth: 180,
      },
      {
        accessorKey: "period",
        cell: (item) => (
          <span className="text-muted text-sm">{item.period === "" ? "—" : item.period}</span>
        ),
        header: "Period",
        id: "period",
        minWidth: 140,
      },
      {
        accessorKey: "date",
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">{formatDate(item.date)}</span>
        ),
        header: "Issued",
        id: "date",
        minWidth: 120,
      },
      {
        accessorKey: "amount",
        cell: (item) => (
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
        minWidth: 110,
      },
      {
        accessorKey: "status",
        cell: (item) => (
          <Chip color={INVOICE_STATUS_COLOR[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 110,
      },
      {
        align: "end",
        cell: (item) => (
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => notifySuccess(`Downloaded ${item.invoiceNumber}`)}
          >
            <ArrowDownToLine className="size-3.5" />
            PDF
          </Button>
        ),
        header: "",
        id: "actions",
        minWidth: 90,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        title="Billing"
        description="Manage your StatXEO subscription, track usage, and download invoices."
        showPeriod={false}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <Card.Header>
            <Card.Title className="text-base">No active subscription on file</Card.Title>
            <Card.Description>
              Pick a plan to unlock the full StatXEO toolkit for your business.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="bg-content2/40 flex items-center gap-3 rounded-xl p-4">
              <div className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
                <CreditCard className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-sm font-medium">No plan selected</span>
                <span className="text-muted text-xs">
                  You can upgrade anytime — all plans include a 14-day trial.
                </span>
              </div>
            </div>
          </Card.Content>
          <Card.Footer>
            <Button size="sm" onPress={() => notifyInfo("Plan selection opens in checkout portal")}>
              Choose a plan
            </Button>
          </Card.Footer>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Payment method</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <span className="text-muted text-sm">No payment method on file.</span>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Payment method setup opens in secure portal")}
            >
              Add payment method
            </Button>
          </Card.Content>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Usage this billing cycle</Card.Title>
          <Card.Description>Track how much of your plan you're using.</Card.Description>
        </Card.Header>
        <Card.Content>
          <EmptyState
            body="Usage meters appear here once you're on a plan and the system starts logging activity."
            icon={Tachometer}
            title="No usage data yet"
          />
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Invoices</Card.Title>
          <Card.Description>Past invoices for your StatXEO subscription.</Card.Description>
        </Card.Header>
        <Card.Content>
          {invoices.length === 0 ? (
            <EmptyState
              body="Monthly invoices for your StatXEO subscription appear here."
              icon={Receipt}
              title="No invoices yet"
            />
          ) : (
            <DataGrid
              aria-label="Invoices"
              columns={columns}
              contentClassName="min-w-[720px]"
              data={invoices}
              getRowId={(item) => item.id}
            />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
