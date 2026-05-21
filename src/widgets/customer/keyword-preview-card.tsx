"use client";

import type {CustomerKeyword} from "../../server/db/schemas/customer-keywords";

import {ArrowDown, ArrowUp, ArrowUpRightFromSquare, Sparkles, Target} from "@gravity-ui/icons";
import {Card, Chip} from "@heroui/react";
import {RouteButton} from "../../components/route-button";

function ChangeBadge({change}: {change: number}) {
  if (change === 0) {
    return <span className="text-muted text-xs tabular-nums">–</span>;
  }

  const isUp = change > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
        isUp ? "text-success" : "text-danger"
      }`}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(change)}
    </span>
  );
}

export interface KeywordPreviewCardProps {
  keywords: CustomerKeyword[];
}

export function KeywordPreviewCard({keywords}: KeywordPreviewCardProps) {
  if (keywords.length === 0) {
    return (
      <Card className="rounded-2xl">
        <Card.Header>
          <div className="flex flex-col gap-1">
            <Card.Title className="text-base">Keyword rankings</Card.Title>
            <Card.Description>Top tracked keywords this week.</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="from-accent/8 flex flex-col gap-4 rounded-xl bg-gradient-to-br to-transparent p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
                <Target className="size-5" />
              </div>
              <span className="bg-success/10 text-success rounded-full px-2.5 py-1 text-[11px] font-medium">
                AI discovery ready
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-foreground text-sm font-semibold">Start with AI-recommended keywords</span>
              <p className="text-muted text-sm">
                Tell StatXEO what you sell and it will suggest local, high-intent phrases worth
                tracking first.
              </p>
            </div>
            <div className="bg-background rounded-xl border border-default-200 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="text-accent size-3.5" />
                <span className="text-foreground font-medium">Examples it can surface</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["near me", "service + city", "emergency", "best rated"].map((hint) => (
                  <Chip key={hint} size="sm" variant="soft">
                    {hint}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <RouteButton href="/customer/seo" size="sm">
                Set up keyword tracking
              </RouteButton>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  const preview = keywords.slice(0, 6);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Keyword rankings</Card.Title>
          <Card.Description>Top tracked keywords this week.</Card.Description>
        </div>
        <RouteButton href="/customer/seo" size="sm" variant="tertiary">
          View all
          <ArrowUpRightFromSquare className="size-3.5" />
        </RouteButton>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1.5">
        <div className="text-muted grid grid-cols-[1fr_auto_auto] items-center gap-3 px-1 pb-1 text-xs">
          <span>Keyword</span>
          <span className="w-12 text-right tabular-nums">Pos</span>
          <span className="w-12 text-right tabular-nums">Δ</span>
        </div>
        {preview.map((kw) => (
          <div
            key={kw.id}
            className="hover:bg-content2 grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl px-1 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-sm font-medium">{kw.keyword}</span>
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="soft">
                  {kw.intent}
                </Chip>
                <span className="text-muted text-xs tabular-nums">
                  {kw.searchVolume.toLocaleString()} /mo
                </span>
              </div>
            </div>
            <span className="text-foreground w-12 text-right text-sm font-semibold tabular-nums">
              #{kw.position}
            </span>
            <div className="w-12 text-right">
              <ChangeBadge change={kw.change} />
            </div>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
