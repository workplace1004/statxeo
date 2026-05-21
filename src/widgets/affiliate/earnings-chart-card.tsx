"use client";

import {Card, ListBox, Select} from "@heroui/react";
import {BarChart, NumberValue} from "@heroui-pro/react";

import {EmptyState} from "../empty-state";

export type EarningsChartPoint = {
  month: string;
  commission: number;
  bonus: number;
};

export interface EarningsChartCardProps {
  data: EarningsChartPoint[];
}

function formatThousands(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`;
}

export function EarningsChartCard({data}: EarningsChartCardProps) {
  const total = data.reduce((sum, p) => sum + p.commission + p.bonus, 0);
  const hasData = data.length > 0;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Earnings · last 12 months</Card.Title>
          <div className="flex items-baseline gap-2">
            {hasData ? (
              <NumberValue
                className="text-foreground text-2xl font-semibold tabular-nums"
                currency="USD"
                maximumFractionDigits={0}
                style="currency"
                value={total}
              />
            ) : (
              <span className="text-foreground text-2xl font-semibold tabular-nums">$0</span>
            )}
          </div>
          <span className="text-muted text-xs">
            Commission + spiff bonuses, before clawbacks
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LegendDot color="var(--chart-3)" label="Commission" />
          <LegendDot color="var(--color-accent)" label="Bonus" />
          <Select className="w-[140px]" defaultValue="ytd" variant="secondary">
            <Select.Trigger className="h-auto min-h-0 px-3 py-1.5 text-xs font-medium">
              <Select.Value />
              <Select.Indicator className="size-3.5" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="ytd" textValue="YTD">
                  YTD
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="12m" textValue="12 months">
                  12 months
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="all" textValue="All time">
                  All time
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Card.Header>
      <Card.Content>
        {hasData ? (
          <BarChart data={data as Array<Record<string, string | number>>} height={260}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="month" tickMargin={8} />
            <BarChart.YAxis tickFormatter={formatThousands} width={50} />
            <BarChart.Bar
              barSize={20}
              dataKey="commission"
              fill="var(--chart-3)"
              name="Commission"
              radius={[8, 8, 0, 0]}
              stackId="earnings"
            />
            <BarChart.Bar
              barSize={20}
              dataKey="bonus"
              fill="var(--color-accent)"
              name="Bonus"
              radius={[8, 8, 0, 0]}
              stackId="earnings"
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        ) : (
          <EmptyState
            body="Once a referral converts, your monthly earnings will chart here."
            title="No earnings to chart yet"
          />
        )}
      </Card.Content>
    </Card>
  );
}

function LegendDot({color, label}: {color: string; label: string}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{backgroundColor: color}} />
      <span className="text-muted text-xs">{label}</span>
    </div>
  );
}
