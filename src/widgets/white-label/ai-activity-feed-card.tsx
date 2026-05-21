"use client";

import type {ActivityKind, AiActivity} from "../../server/db/schemas/ai-activity";
import type {ComponentType} from "react";

import {
  ChartLine,
  Display,
  FileText,
  Headphones,
  Magnifier,
  Megaphone,
  PersonPlus,
  Rocket,
  Star,
} from "@gravity-ui/icons";
import {Button, Card} from "@heroui/react";

export interface AiActivityFeedCardProps {
  entries: AiActivity[];
}

const KIND_META: Record<
  ActivityKind,
  {icon: ComponentType<{className?: string}>; bg: string; fg: string}
> = {
  automation: {bg: "bg-warning-soft", fg: "text-warning", icon: Rocket},
  call: {bg: "bg-success-soft", fg: "text-success", icon: Headphones},
  content: {bg: "bg-success-soft", fg: "text-success", icon: FileText},
  lead: {bg: "bg-accent-soft", fg: "text-accent", icon: PersonPlus},
  review: {bg: "bg-warning-soft", fg: "text-warning", icon: ChartLine},
  seo: {bg: "bg-accent-soft", fg: "text-accent", icon: Magnifier},
  social: {bg: "bg-success-soft", fg: "text-success", icon: Megaphone},
  website: {bg: "bg-accent-soft", fg: "text-accent", icon: Display},
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

export function AiActivityFeedCard({entries}: AiActivityFeedCardProps) {
  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl">
            <Star className="size-4" />
          </span>
          <div className="flex flex-col">
            <Card.Title className="text-base">AI activity</Card.Title>
            <Card.Description>What the agents shipped today.</Card.Description>
          </div>
        </div>
        <Button size="sm" variant="tertiary">
          View all
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">
            Once your AI agents start shipping work for customers, you&apos;ll see it streaming here.
          </p>
        ) : (
          <ol className="flex flex-col gap-3">
            {entries.slice(0, 8).map((entry) => {
              const meta = KIND_META[entry.kind];
              const Icon = meta.icon;

              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span
                    className={`${meta.bg} ${meta.fg} mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-foreground text-sm font-medium leading-snug">
                      {entry.title}
                    </span>
                    <span className="text-muted text-xs">
                      {entry.agent} · {entry.customer} · {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card.Content>
    </Card>
  );
}
