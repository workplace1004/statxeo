"use client";

import {Comment} from "@gravity-ui/icons";
import {Avatar} from "@heroui/react";

import {ComingSoonCard} from "./coming-soon-card";

const PREVIEW_MESSAGES = [
  {
    body: "Hey can you do a tune-up this week?",
    from: "Linda M.",
    initial: "L",
    time: "2m",
  },
  {
    body: "How much for a new heat pump?",
    from: "Marcus W.",
    initial: "M",
    time: "14m",
  },
  {
    body: "Thanks for the fast service yesterday!",
    from: "Priya S.",
    initial: "P",
    time: "1h",
  },
];

export function MessagesComingSoon() {
  return (
    <ComingSoonCard
      badgeLabel="STATXT integration"
      description="Two-way SMS with your customers, AI-assisted replies, and booking links."
      icon={Comment}
      preview={
        <div className="flex flex-col gap-2.5">
          {PREVIEW_MESSAGES.map((m) => (
            <div key={m.from} className="flex items-start gap-3">
              <Avatar className="size-8">
                <Avatar.Fallback>{m.initial}</Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-medium">{m.from}</span>
                  <span className="text-muted text-xs">{m.time}</span>
                </div>
                <span className="text-muted truncate text-xs">{m.body}</span>
              </div>
            </div>
          ))}
        </div>
      }
      title="Messages"
    />
  );
}
