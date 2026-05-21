"use client";

import type {ComponentProps} from "react";

import {KPI} from "@heroui-pro/react";

type TrendDir = ComponentProps<typeof KPI.Trend>["trend"];

export interface DashboardTotals {
  visitors: number;
  avgRank: number | null;
  campaigns: number;
}

export interface DashboardKpiRowProps {
  totals: DashboardTotals;
  /** Optional sparkline series for each tile, in order: visitors, avgRank, campaigns. */
  spark?: {
    visitors?: number[];
    avgRank?: number[];
    campaigns?: number[];
  };
}

interface KpiTileProps {
  label: string;
  value: number | null;
  numberProps?: Omit<ComponentProps<typeof KPI.Value>, "children" | "value">;
  trend?: TrendDir;
  trendValue?: string;
  spark?: number[];
  chartColor: string;
}

function KpiTile({chartColor, label, numberProps, spark, trend, trendValue, value}: KpiTileProps) {
  const sparkData = spark?.map((v, i) => ({i, v})) ?? [];

  return (
    <KPI>
      <KPI.Header>
        <KPI.Title>{label}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {value === null ? (
          <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
        ) : (
          <KPI.Value value={value} {...numberProps} />
        )}
        {trend && trendValue ? <KPI.Trend trend={trend}>{trendValue}</KPI.Trend> : null}
      </KPI.Content>
      {sparkData.length > 0 ? (
        <KPI.Chart color={chartColor} data={sparkData} height={56} strokeWidth={1.5} />
      ) : null}
    </KPI>
  );
}

export function DashboardKpiRow({spark, totals}: DashboardKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <KpiTile
        chartColor="var(--color-accent)"
        label="Website traffic"
        numberProps={{maximumFractionDigits: 0}}
        spark={spark?.visitors}
        value={totals.visitors === 0 ? null : totals.visitors}
      />
      <KpiTile
        chartColor="var(--color-success)"
        label="Avg keyword rank"
        numberProps={{maximumFractionDigits: 1}}
        spark={spark?.avgRank}
        value={totals.avgRank}
      />
      <KpiTile
        chartColor="var(--chart-3)"
        label="Active campaigns"
        numberProps={{maximumFractionDigits: 0}}
        spark={spark?.campaigns}
        value={totals.campaigns === 0 ? null : totals.campaigns}
      />
    </div>
  );
}
