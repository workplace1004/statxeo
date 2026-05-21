"use client";

import {Card} from "@heroui/react";
import {NumberValue} from "@heroui-pro/react";

import {EmptyState} from "../empty-state";

export interface FunnelStep {
  id: string;
  label: string;
  value: number;
}

export interface ConversionFunnelCardProps {
  data: readonly FunnelStep[];
}

const FUNNEL_BARS = [
  "from-accent to-accent/70",
  "from-accent/90 to-accent/60",
  "from-success to-success/60",
  "from-warning to-warning/60",
  "from-danger to-danger/60",
];

export function ConversionFunnelCard({data}: ConversionFunnelCardProps) {
  const top = data[0]?.value ?? 1;
  const hasData = data.length > 0;

  return (
    <Card className="h-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Conversion funnel</Card.Title>
        <Card.Description>Click → close, last 90 days.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {hasData ? (
          data.map((step, idx) => {
            const widthPct = Math.max(8, (step.value / top) * 100);
            const prevValue = data[idx - 1]?.value;
            const dropPct =
              idx === 0 || prevValue === undefined || prevValue === 0
                ? null
                : ((prevValue - step.value) / prevValue) * 100;

            return (
              <div key={step.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-medium">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <NumberValue
                      className="text-foreground text-sm font-semibold tabular-nums"
                      maximumFractionDigits={0}
                      value={step.value}
                    />
                    {dropPct !== null ? (
                      <span className="text-muted w-16 text-right text-xs tabular-nums">
                        −{dropPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="w-16 text-right" />
                    )}
                  </div>
                </div>
                <div className="bg-content2 relative h-3 overflow-hidden rounded-full">
                  <div
                    className={`bg-linear-to-r ${FUNNEL_BARS[idx % FUNNEL_BARS.length]} h-full rounded-full`}
                    style={{width: `${widthPct}%`}}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            body="Click → close drop-off ranks each stage of your funnel once data lands."
            title="No funnel data yet"
          />
        )}
      </Card.Content>
    </Card>
  );
}
