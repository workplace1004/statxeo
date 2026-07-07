import {KPI, KPIGroup} from "@heroui-pro/react";
import React from "react";

export interface DashboardKpiTotals {
  /** Lifetime gross earnings (USD whole dollars). */
  totalEarnings: number;
  /** Pending payout balance (USD whole dollars). */
  pendingPayout: number;
  /** New referrals in the trailing window. */
  newReferrals: number;
  /** Click → signup conversion rate (0-1). */
  conversionRate: number;
  /** Meetings booked in the trailing window. */
  meetingsBooked: number;
  /** Active referral link count. */
  activeCampaigns: number;
}

export interface DashboardKpiRowProps {
  totals: DashboardKpiTotals;
}

interface KpiConfig {
  label: string;
  value: number;
  format: "currency" | "percent" | "decimal";
}

function buildKpis(totals: DashboardKpiTotals): readonly KpiConfig[] {
  return [
    {format: "currency", label: "Total earnings", value: totals.totalEarnings},
    {format: "currency", label: "Pending payout", value: totals.pendingPayout},
    {format: "decimal", label: "New referrals", value: totals.newReferrals},
    {format: "percent", label: "Conversion rate", value: totals.conversionRate},
    {format: "decimal", label: "Meetings booked", value: totals.meetingsBooked},
    {format: "decimal", label: "Active campaigns", value: totals.activeCampaigns},
  ];
}

export function DashboardKpiRow({totals}: DashboardKpiRowProps) {
  const kpis = buildKpis(totals);

  return (
    <KPIGroup>
      {kpis.map((kpi, index) => (
        <React.Fragment key={kpi.label}>
          {index > 0 ? <KPIGroup.Separator /> : null}
          <KPI>
            <KPI.Header>
              <KPI.Title>{kpi.label}</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              {kpi.value === 0 ? (
                <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
              ) : (
                <KPI.Value
                  currency={kpi.format === "currency" ? "USD" : undefined}
                  maximumFractionDigits={kpi.format === "percent" ? 1 : 0}
                  style={kpi.format}
                  value={kpi.value}
                />
              )}
            </KPI.Content>
          </KPI>
        </React.Fragment>
      ))}
    </KPIGroup>
  );
}
