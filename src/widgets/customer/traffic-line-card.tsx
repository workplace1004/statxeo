"use client";

import {ChartLine, EllipsisVertical} from "@gravity-ui/icons";
import {Card} from "@heroui/react";
import {LineChart, NumberValue, TrendChip} from "@heroui-pro/react";

import {RouteButton} from "../../components/route-button";
import {notifyInfo} from "../../lib/ui/white-label-notify";
import {IconButton} from "../../components/icon-button";

export interface TrafficPoint {
  day: string;
  visitors: number;
  organic: number;
  direct: number;
}

export interface TrafficLineCardProps {
  data: TrafficPoint[];
}

const Y_TICKS = [0, 200, 400, 600, 800];

function formatTick(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

function LegendDot({color, label}: {color: string; label: string}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{backgroundColor: color}} />
      <span className="text-muted text-xs">{label}</span>
    </div>
  );
}

export function TrafficLineCard({data}: TrafficLineCardProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Website traffic</Card.Title>
          <Card.Description>Daily visitors split by acquisition source.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="from-accent/8 to-accent/0 flex flex-col gap-4 rounded-xl bg-gradient-to-br p-5">
            <div className="bg-accent/10 text-accent flex size-11 items-center justify-center rounded-xl">
              <ChartLine className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-semibold">Traffic intelligence is ready</span>
              <p className="text-muted text-sm">
                Connect analytics and this card will start surfacing your top traffic swings,
                channel mix, and daily visit trend automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="border-default-200 bg-background rounded-xl border px-3 py-2.5">
                <span className="text-muted text-xs">Analytics sync</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="bg-warning/15 text-warning rounded-full px-2 py-0.5 text-[11px] font-medium">
                    Pending
                  </span>
                  <span className="text-foreground text-xs">Waiting for first connection</span>
                </div>
              </div>
              <div className="border-default-200 bg-background rounded-xl border px-3 py-2.5">
                <span className="text-muted text-xs">Autopilot summary</span>
                <p className="text-foreground mt-1 text-xs">
                  AI will call out spikes, dips, and strongest acquisition days.
                </p>
              </div>
            </div>
            <div>
              <RouteButton href="/customer/settings" size="sm">
                Connect analytics
              </RouteButton>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const total = data.reduce((sum, p) => sum + p.visitors, 0);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Website traffic</Card.Title>
          <div className="flex items-baseline gap-2">
            <NumberValue
              className="text-foreground text-2xl font-semibold tabular-nums"
              maximumFractionDigits={0}
              value={total}
            />
            <TrendChip trend="neutral">last 30 days</TrendChip>
          </div>
          <span className="text-muted text-xs">Last 30 days</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <LegendDot color="var(--chart-2)" label="Organic" />
            <LegendDot color="var(--chart-4)" label="Direct" />
          </div>
          <IconButton
            label="More options"
            size="sm"
            variant="tertiary"
            onPress={() => notifyInfo("Export traffic from Analytics")}
          >
            <EllipsisVertical className="size-4" />
          </IconButton>
        </div>
      </Card.Header>
      <Card.Content>
        <LineChart data={data as unknown as Array<Record<string, string | number>>} height={240}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="day" minTickGap={40} tickMargin={8} />
          <LineChart.YAxis tickFormatter={formatTick} ticks={Y_TICKS} width={34} />
          <LineChart.Line
            dataKey="organic"
            dot={false}
            name="Organic"
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Line
            dataKey="direct"
            dot={false}
            name="Direct"
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Tooltip content={<LineChart.TooltipContent />} />
        </LineChart>
      </Card.Content>
    </Card>
  );
}
