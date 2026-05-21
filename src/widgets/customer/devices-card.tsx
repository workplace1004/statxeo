"use client";

import {Smartphone} from "@gravity-ui/icons";
import {Card} from "@heroui/react";
import {ChartTooltip, PieChart} from "@heroui-pro/react";

import {RouteButton} from "../../components/route-button";

const COLORS = ["var(--chart-3)", "var(--chart-2)", "var(--chart-4)"];

export interface DevicePoint {
  name: string;
  value: number;
}

export interface DevicesCardProps {
  data: DevicePoint[];
}

function formatCount(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
}

interface DeviceTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    payload?: {fill?: string};
    value?: number | string;
  }>;
}

function DeviceTooltip({active, payload}: DeviceTooltipProps) {
  const entry = payload?.[0];

  if (!active || !entry) return null;

  return (
    <ChartTooltip>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color={entry.payload?.fill} />
        <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
        <ChartTooltip.Value>{formatCount(Number(entry.value))}</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  );
}

export function DevicesCard({data}: DevicesCardProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Traffic by device</Card.Title>
          <Card.Description>How visitors reach your site.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="flex items-center justify-center">
            <div className="from-accent/10 relative flex size-40 items-center justify-center rounded-full bg-gradient-to-br to-transparent">
              <div className="border-accent/20 absolute inset-3 rounded-full border" />
              <div className="border-accent/15 absolute inset-8 rounded-full border" />
              <div className="bg-accent/10 text-accent flex size-14 items-center justify-center rounded-2xl">
                <Smartphone className="size-6" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-foreground text-sm font-semibold">Device trends unlock after your first sessions</span>
            <p className="text-muted max-w-xs text-sm">
              AI will break out mobile, desktop, and tablet traffic so you can spot where your
              site experience needs work first.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {label: "Mobile", value: "Primary"},
              {label: "Desktop", value: "Compare"},
              {label: "Tablet", value: "Track"},
            ].map((item) => (
              <div key={item.label} className="bg-content2/50 rounded-xl px-3 py-2 text-center">
                <span className="text-muted block text-[11px]">{item.label}</span>
                <span className="text-foreground text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <RouteButton href="/customer/settings" size="sm" variant="tertiary">
              Connect analytics
            </RouteButton>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="h-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Traffic by device</Card.Title>
        <Card.Description>How visitors reach your site.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="relative">
          <PieChart height={200} width={200}>
            <PieChart.Pie
              cornerRadius={8}
              cx="50%"
              cy="50%"
              data={data}
              dataKey="value"
              innerRadius="68%"
              nameKey="name"
              paddingAngle={-12}
              strokeWidth={0}
            >
              {data.map((_, idx) => (
                <PieChart.Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </PieChart.Pie>
            <PieChart.Tooltip content={<DeviceTooltip />} />
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-foreground text-xl font-semibold tabular-nums">
              {formatCount(total)}
            </span>
            <span className="text-muted text-xs">Sessions</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2">
          {data.map((entry, idx) => {
            const pct = total === 0 ? 0 : ((entry.value / total) * 100).toFixed(0);

            return (
              <div key={entry.name} className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{backgroundColor: COLORS[idx % COLORS.length]}}
                />
                <span className="text-foreground flex-1 text-sm">{entry.name}</span>
                <span className="text-foreground text-sm font-semibold tabular-nums">
                  {formatCount(entry.value)}
                </span>
                <span className="text-muted w-10 text-right text-xs tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}
