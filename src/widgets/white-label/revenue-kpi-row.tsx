"use client";

import {KPI} from "@heroui-pro/react";

export interface RevenueKpiRowProps {
  mrr: number;
  activeCustomers: number;
  nrr: number | null;
  churn90d: number | null;
}

export function RevenueKpiRow({mrr, activeCustomers, nrr, churn90d}: RevenueKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KPI>
        <KPI.Header>
          <KPI.Title>Monthly recurring revenue</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value
            currency="USD"
            maximumFractionDigits={0}
            style="currency"
            value={mrr}
          />
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Active customers</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value maximumFractionDigits={0} value={activeCustomers} />
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Net revenue retention</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {nrr === null ? (
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          ) : (
            <KPI.Value
              maximumFractionDigits={1}
              style="percent"
              value={nrr}
            />
          )}
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>90-day churn</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          {churn90d === null ? (
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          ) : (
            <KPI.Value
              maximumFractionDigits={1}
              style="percent"
              value={churn90d}
            />
          )}
        </KPI.Content>
      </KPI>
    </div>
  );
}
