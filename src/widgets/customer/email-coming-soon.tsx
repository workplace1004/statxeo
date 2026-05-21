"use client";

import {Envelope} from "@gravity-ui/icons";

import {ComingSoonCard} from "./coming-soon-card";

const PREVIEW_CAMPAIGNS = [
  {open: "62%", sends: 482, subject: "5 signs your AC needs a tune-up"},
  {open: "58%", sends: 318, subject: "Heat pump rebates available"},
  {open: "71%", sends: 226, subject: "We're $129 off Memorial Day weekend"},
];

export function EmailComingSoon() {
  return (
    <ComingSoonCard
      badgeLabel="STATXE integration"
      description="AI-drafted email campaigns, automated drips, and customer segments."
      icon={Envelope}
      preview={
        <div className="flex flex-col gap-2.5">
          {PREVIEW_CAMPAIGNS.map((c) => (
            <div
              key={c.subject}
              className="flex items-center justify-between gap-3 rounded-xl bg-content2/40 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-sm font-medium">{c.subject}</span>
                <span className="text-muted text-xs tabular-nums">
                  {c.sends} sent · open rate
                </span>
              </div>
              <span className="text-success text-xs font-medium">{c.open}</span>
            </div>
          ))}
        </div>
      }
      title="Email campaigns"
    />
  );
}
