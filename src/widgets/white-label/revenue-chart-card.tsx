"use client";

import type {RevenuePoint} from "../../server/queries/agency";

import {Card, ListBox, Select} from "@heroui/react";
import {BarChart, NumberValue, TrendChip} from "@heroui-pro/react";

export interface RevenueChartCardProps {
  series: RevenuePoint[];
}

function formatThousands(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`;
}

function toChartData(series: RevenuePoint[]): Array<Record<string, string | number>> {
  return series.map((p) => ({
    churn: p.churn,
    expansion: p.expansion,
    month: p.month,
    mrr: p.mrr,
  }));
}

export function RevenueChartCard({series}: RevenueChartCardProps) {
  const total = series.reduce((sum, p) => sum + p.mrr, 0);
  const latest = series[series.length - 1];
  const isEmpty = series.length === 0;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Recurring revenue</Card.Title>
          <div className="flex items-baseline gap-2">
            <NumberValue
              className="text-foreground text-2xl font-semibold tabular-nums"
              currency="USD"
              maximumFractionDigits={0}
              style="currency"
              value={latest?.mrr ?? 0}
            />
            {!isEmpty ? <TrendChip trend="up">12.4%</TrendChip> : null}
          </div>
          <span className="text-muted text-xs">
            {isEmpty
              ? "Waiting on revenue events"
              : `${formatThousands(total)} grossed over the last 12 months`}
          </span>
        </div>
        <Select className="w-[160px]" defaultValue="last-12m" variant="secondary">
          <Select.Trigger className="h-auto min-h-0 px-3 py-1.5 text-xs font-medium">
            <Select.Value />
            <Select.Indicator className="size-3.5" />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="last-3m" textValue="Last 3 months">
                Last 3 months
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="last-6m" textValue="Last 6 months">
                Last 6 months
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="last-12m" textValue="Last 12 months">
                Last 12 months
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {isEmpty ? (
          <p className="text-muted py-12 text-center text-sm">
            No revenue events yet — connect Stripe to start tracking MRR.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <LegendDot color="var(--chart-2)" label="MRR" />
              <LegendDot color="var(--chart-3)" label="Expansion" />
              <LegendDot color="var(--chart-5)" label="Churn" />
            </div>
            <BarChart data={toChartData(series)} height={220}>
              <BarChart.Grid vertical={false} />
              <BarChart.XAxis dataKey="month" tickMargin={8} />
              <BarChart.YAxis tickFormatter={formatThousands} width={48} />
              <BarChart.Bar
                barSize={14}
                dataKey="mrr"
                fill="var(--chart-2)"
                name="MRR"
                radius={[8, 8, 0, 0]}
              />
              <BarChart.Bar
                barSize={14}
                dataKey="expansion"
                fill="var(--chart-3)"
                name="Expansion"
                radius={[8, 8, 0, 0]}
              />
              <BarChart.Bar
                barSize={14}
                dataKey="churn"
                fill="var(--chart-5)"
                name="Churn"
                radius={[8, 8, 0, 0]}
              />
              <BarChart.Tooltip content={<BarChart.TooltipContent />} />
            </BarChart>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

function LegendDot({color, label}: {color: string; label: string}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-3 rounded-full" style={{backgroundColor: color}} />
      <span className="text-muted text-xs">{label}</span>
    </div>
  );
}
