"use client";

import {Avatar, Card, Chip} from "@heroui/react";
import {NumberValue, TrendChip} from "@heroui-pro/react";

import {EmptyState} from "../empty-state";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  handle: string;
  avatar: string;
  earnings: number;
  deals: number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  isYou?: boolean;
}

export interface LeaderboardCardProps {
  entries: readonly LeaderboardEntry[];
}

const RANK_BADGES: Record<number, {bg: string; text: string}> = {
  1: {bg: "bg-warning-soft", text: "text-warning"},
  2: {bg: "bg-content2", text: "text-foreground"},
  3: {bg: "bg-danger-soft", text: "text-danger"},
};

export function LeaderboardCard({entries}: LeaderboardCardProps) {
  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Sales leaderboard</Card.Title>
        <Card.Description>Top affiliates by closed-won this month.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1">
        {entries.length === 0 ? (
          <EmptyState
            body="Once partners start closing deals, the monthly leaderboard will rank up here."
            title="Leaderboard warming up"
          />
        ) : (
          entries.slice(0, 5).map((entry) => <LeaderboardRow key={entry.id} entry={entry} />)
        )}
      </Card.Content>
    </Card>
  );
}

function LeaderboardRow({entry}: {entry: LeaderboardEntry}) {
  const badge = RANK_BADGES[entry.rank] ?? {bg: "bg-content2", text: "text-muted"};

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
        entry.isYou ? "bg-accent-soft/40" : ""
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${badge.bg} ${badge.text}`}
      >
        {entry.rank}
      </span>
      <Avatar className="size-8 shrink-0">
        <Avatar.Image alt={entry.name} src={entry.avatar} />
        <Avatar.Fallback>
          {entry.name
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </Avatar.Fallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">{entry.name}</span>
          {entry.isYou ? (
            <Chip color="accent" size="sm" variant="soft">
              You
            </Chip>
          ) : null}
        </div>
        <span className="text-muted truncate text-xs">
          {entry.handle} · {entry.deals} deals
        </span>
      </div>
      <div className="flex items-center gap-3">
        <NumberValue
          className="text-foreground text-sm font-semibold tabular-nums"
          currency="USD"
          maximumFractionDigits={0}
          style="currency"
          value={entry.earnings}
        />
        <TrendChip trend={entry.trend}>{entry.trendValue}</TrendChip>
      </div>
    </div>
  );
}
