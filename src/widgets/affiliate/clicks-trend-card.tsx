"use client";

import {Card} from "@heroui/react";
import {LineChart, NumberValue} from "@heroui-pro/react";

import {EmptyState} from "../empty-state";

export type ClicksOverTime = {
  day: string;
  clicks: number;
  conversions: number;
};

export interface ClicksTrendCardProps {
  data: ClicksOverTime[];
}

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

export function ClicksTrendCard({data}: ClicksTrendCardProps) {
  const totalClicks = data.reduce((sum, p) => sum + p.clicks, 0);
  const totalConversions = data.reduce((sum, p) => sum + p.conversions, 0);
  const hasData = data.length > 0;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Clicks & conversions · 30 days</Card.Title>
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-2">
              {hasData ? (
                <NumberValue
                  className="text-foreground text-2xl font-semibold tabular-nums"
                  maximumFractionDigits={0}
                  value={totalClicks}
                />
              ) : (
                <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
              )}
              <span className="text-muted text-xs">clicks</span>
            </div>
            <span className="text-muted">·</span>
            <div className="flex items-baseline gap-2">
              {hasData ? (
                <NumberValue
                  className="text-foreground text-2xl font-semibold tabular-nums"
                  maximumFractionDigits={0}
                  value={totalConversions}
                />
              ) : (
                <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
              )}
              <span className="text-muted text-xs">conversions</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LegendDot color="var(--chart-2)" label="Clicks" />
          <LegendDot color="var(--color-success)" label="Conversions" />
        </div>
      </Card.Header>
      <Card.Content>
        {hasData ? (
          <LineChart data={data as Array<Record<string, string | number>>} height={260}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="day" minTickGap={32} tickMargin={8} />
            <LineChart.YAxis tickFormatter={formatThousands} width={40} yAxisId="clicks" />
            <LineChart.YAxis
              orientation="right"
              tickFormatter={formatThousands}
              width={40}
              yAxisId="conv"
            />
            <LineChart.Line
              dataKey="clicks"
              dot={false}
              name="Clicks"
              stroke="var(--chart-2)"
              strokeWidth={2}
              type="monotone"
              yAxisId="clicks"
            />
            <LineChart.Line
              dataKey="conversions"
              dot={false}
              name="Conversions"
              stroke="var(--color-success)"
              strokeWidth={2}
              type="monotone"
              yAxisId="conv"
            />
            <LineChart.Tooltip content={<LineChart.TooltipContent />} />
          </LineChart>
        ) : (
          <EmptyState
            body="Daily click and conversion trends populate as your links pick up traffic."
            title="No traffic to chart yet"
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
