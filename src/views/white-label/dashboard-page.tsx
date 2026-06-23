"use client";

import type {AiActivity} from "../../server/db/schemas/ai-activity";
import type {Approval} from "../../server/db/schemas/approvals";
import type {Customer} from "../../server/db/schemas/customers";
import type {RevenuePoint} from "../../server/queries/agency";

import {ArrowDownToLine} from "@gravity-ui/icons";
import {Button} from "@heroui/react";

import {exportCustomersCsv} from "../../lib/export/export-customers-csv";
import {notifySuccess} from "../../lib/ui/white-label-notify";
import {AiActivityFeedCard} from "../../widgets/white-label/ai-activity-feed-card";
import {InviteCustomerModal} from "../../widgets/white-label/modals/invite-customer-modal";
import {NewCustomerButton} from "../../widgets/white-label/modals/new-customer-modal";
import {CampaignPerformanceCard} from "../../widgets/white-label/campaign-performance-card";
import {CustomersPreviewCard} from "../../widgets/white-label/customers-preview-card";
import {PageToolbar} from "../../widgets/page-toolbar";
import {PendingApprovalsCard} from "../../widgets/white-label/pending-approvals-card";
import {RevenueChartCard} from "../../widgets/white-label/revenue-chart-card";
import {RevenueKpiRow} from "../../widgets/white-label/revenue-kpi-row";

export interface WhiteLabelDashboardPageProps {
  customers: Customer[];
  approvals: Approval[];
  activity: AiActivity[];
  revenue: RevenuePoint[];
  mrr: number;
  activeCustomers: number;
}

export function WhiteLabelDashboardPage({
  activeCustomers,
  activity,
  approvals,
  customers,
  mrr,
  revenue,
}: WhiteLabelDashboardPageProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="An at-a-glance view of revenue, customers, and what your AI agents shipped today."
        title="Agency overview"
        trailing={
          <>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportCustomersCsv(customers);
                notifySuccess(
                  customers.length > 0
                    ? `Exported ${customers.length} customers`
                    : "Exported customer template (no rows yet)",
                );
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
            <NewCustomerButton />
            <InviteCustomerModal
              trigger={
                <Button size="sm" variant="tertiary">
                  Invite
                </Button>
              }
            />
          </>
        }
      />

      <RevenueKpiRow
        activeCustomers={activeCustomers}
        churn90d={null}
        mrr={mrr}
        nrr={null}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChartCard series={revenue} />
        </div>
        <AiActivityFeedCard entries={activity} />
      </div>

      <CampaignPerformanceCard />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CustomersPreviewCard customers={customers} />
        </div>
        <div className="lg:col-span-2">
          <PendingApprovalsCard approvals={approvals} />
        </div>
      </div>
    </div>
  );
}
