"use client";

import type {InvoiceAgency} from "../../server/db/schemas/invoices";
import type {Organization} from "../../server/db/schemas/organizations";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowDownToLine, CreditCard, Eye, FileText, Plus} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, useOverlayState} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {exportInvoicesCsv} from "../../lib/export/export-invoices-csv";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {NewInvoiceModal} from "../../widgets/white-label/modals/new-invoice-modal";
import {INVOICE_STATUS_COLOR} from "../../server/db/schemas/invoices";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

export interface WhiteLabelBillingPageProps {
  invoices: InvoiceAgency[];
  organization: Organization | null;
}

export function WhiteLabelBillingPage({invoices, organization}: WhiteLabelBillingPageProps) {
  const invoiceState = useOverlayState();

  const columns = useMemo<DataGridColumn<InvoiceAgency>[]>(
    () => [
      {
        accessorKey: "number",
        cell: (item) => (
          <span className="text-foreground tabular-nums text-sm font-medium">{item.number}</span>
        ),
        header: "Invoice",
        id: "number",
        isRowHeader: true,
        minWidth: 160,
      },
      {
        accessorKey: "customer",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <Avatar.Image alt={item.customer} src={item.customerAvatar} />
              <Avatar.Fallback>
                {item.customer
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
            <span className="text-foreground text-sm">{item.customer}</span>
          </div>
        ),
        header: "Customer",
        id: "customer",
        minWidth: 220,
      },
      {
        accessorKey: "amount",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="tabular-nums"
            currency={item.currency}
            maximumFractionDigits={0}
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
        allowsSorting: true,
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
        accessorKey: "issuedAt",
        cell: (item) => <span className="text-muted text-xs">{item.issuedAt}</span>,
        header: "Issued",
        id: "issuedAt",
        minWidth: 110,
      },
      {
        accessorKey: "dueAt",
        cell: (item) => <span className="text-muted text-xs">{item.dueAt}</span>,
        header: "Due",
        id: "dueAt",
        minWidth: 110,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-0.5">
            <IconButton
              label="View invoice"
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo(`Invoice ${item.number} — ${item.customer}`)}
            >
              <Eye className="size-4" />
            </IconButton>
            <IconButton
              label="Download"
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportInvoicesCsv([item], `invoice-${item.number}.csv`);
                notifySuccess(`Downloaded ${item.number}`);
              }}
            >
              <ArrowDownToLine className="size-4" />
            </IconButton>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 100,
      },
    ],
    [],
  );

  const totalReceivable = invoices
    .filter((i) => i.status === "Open" || i.status === "Overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);

  const isEmpty = invoices.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Subscriptions, invoices, usage, payment methods, and reseller margins."
        showPeriod={false}
        title="Billing"
        trailing={
          <>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportInvoicesCsv(invoices);
                notifySuccess(
                  invoices.length > 0
                    ? `Exported ${invoices.length} invoices`
                    : "Exported invoice template",
                );
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
            <NewInvoiceModal
              state={invoiceState}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New invoice
                </Button>
              }
            />
          </>
        }
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Receivable</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value
              currency="USD"
              maximumFractionDigits={0}
              style="currency"
              value={totalReceivable}
            />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Collected (30d)</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value
              currency="USD"
              maximumFractionDigits={0}
              style="currency"
              value={totalPaid}
            />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Gross margin (mo)</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg reseller margin</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Plan usage</Card.Title>
            <Card.Description>Reseller plan limits.</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-muted py-6 text-center text-sm">
              Usage metrics will appear once your plan is connected.
            </p>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Payment methods</Card.Title>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Payment method setup opens in secure portal")}
            >
              <Plus className="size-4" />
              Add card
            </Button>
          </Card.Header>
          <Card.Content className="flex flex-col items-center gap-2 py-6">
            <span className="bg-content2 text-muted flex size-10 items-center justify-center rounded-xl">
              <CreditCard className="size-5" />
            </span>
            <span className="text-muted text-center text-sm">
              No payment methods on file yet.
            </span>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Reseller margins</Card.Title>
            <Card.Description>Retail price vs wholesale cost.</Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-muted py-6 text-center text-sm">
              Margins appear once customers are subscribed to your plans.
            </p>
          </Card.Content>
        </Card>


      </div>

      {isEmpty ? (
        <EmptyState
          body="Invoices issued to your customers will appear here once billing is live."
          cta={{label: "Create invoice", onPress: invoiceState.open}}
          icon={FileText}
          title="No invoices yet"
        />
      ) : (
        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title className="text-base">Invoices</Card.Title>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Showing all invoices")}
            >
              View all
            </Button>
          </Card.Header>
          <Card.Content>
            <DataGrid
              aria-label="Invoices"
              columns={columns}
              contentClassName="min-w-[820px]"
              data={invoices}
              getRowId={(item) => item.id}
            />
          </Card.Content>
        </Card>
      )}
      <NewInvoiceModal state={invoiceState} />
    </div>
  );
}
