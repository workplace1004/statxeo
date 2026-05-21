"use client";

import {ChartColumn} from "@gravity-ui/icons";
import {Card} from "@heroui/react";
import {BarChart} from "@heroui-pro/react";

import {RouteButton} from "../../components/route-button";

export interface ChannelPoint {
  channel: string;
  sessions: number;
}

export interface ChannelsCardProps {
  data: ChannelPoint[];
}

function formatThousands(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
}

export function ChannelsCard({data}: ChannelsCardProps) {
  return (
    <Card className="h-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Top channels</Card.Title>
        <Card.Description>Sessions by acquisition channel.</Card.Description>
      </Card.Header>
      <Card.Content>
        {data.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-default-200 p-5">
            <div className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
              <ChartColumn className="size-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-semibold">Channel mix will map itself here</span>
              <p className="text-muted text-sm">
                Once traffic is flowing, AI will compare your strongest channels and flag where
                new leads are actually coming from.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                {label: "Organic search", width: "72%"},
                {label: "Direct", width: "48%"},
                {label: "Social", width: "32%"},
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-muted w-24 shrink-0 text-xs">{item.label}</span>
                  <div className="bg-content2 h-2 flex-1 overflow-hidden rounded-full">
                    <div className="from-accent/70 to-accent/25 h-full rounded-full bg-gradient-to-r" style={{width: item.width}} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <RouteButton href="/customer/settings" size="sm" variant="tertiary">
                Finish setup
              </RouteButton>
            </div>
          </div>
        ) : (
          <BarChart
            data={data as unknown as Array<Record<string, string | number>>}
            height={260}
            layout="vertical"
          >
            <BarChart.Grid horizontal={false} />
            <BarChart.XAxis tickFormatter={formatThousands} tickMargin={4} type="number" />
            <BarChart.YAxis dataKey="channel" tickMargin={4} type="category" width={130} />
            <BarChart.Bar
              barSize={14}
              dataKey="sessions"
              fill="var(--chart-3)"
              name="Sessions"
              radius={[0, 24, 24, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        )}
      </Card.Content>
    </Card>
  );
}
