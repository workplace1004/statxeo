"use client";

import type {Approval, ApprovalKind} from "../../server/db/schemas/approvals";
import type {ComponentType} from "react";

import {
  Display,
  Envelope,
  FileText,
  Megaphone,
  Stopwatch,
  Target,
} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip} from "@heroui/react";
import {RouteButton} from "../../components/route-button";
import {notifyInfo} from "../../lib/ui/white-label-notify";

export interface PendingApprovalsCardProps {
  approvals: Approval[];
}

const KIND_META: Record<
  ApprovalKind,
  {icon: ComponentType<{className?: string}>; label: string}
> = {
  ads: {icon: Target, label: "Ads"},
  content: {icon: FileText, label: "Content"},
  email: {icon: Envelope, label: "Email"},
  social: {icon: Megaphone, label: "Social"},
  website: {icon: Display, label: "Website"},
};

export function PendingApprovalsCard({approvals}: PendingApprovalsCardProps) {
  const total = approvals.reduce((sum, a) => sum + a.count, 0);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Card.Title className="text-base">Pending approvals</Card.Title>
          <Chip color={total > 0 ? "warning" : "default"} size="sm" variant="soft">
            {total}
          </Chip>
        </div>
        <RouteButton href="/white-label/social" size="sm" variant="tertiary">
          Review queue
        </RouteButton>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {approvals.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">
            When AI agents draft work that needs your eyes, it appears here.
          </p>
        ) : (
          approvals.map((approval) => {
            const meta = KIND_META[approval.kind];
            const Icon = meta.icon;

            return (
              <div
                key={approval.id}
                className="hover:bg-content2 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
              >
                <Avatar className="size-9">
                  <Avatar.Image alt={approval.customer} src={approval.customerAvatar} />
                  <Avatar.Fallback>
                    {approval.customer
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </Avatar.Fallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {approval.customer}
                    </span>
                    <Chip size="sm" variant="soft">
                      <Icon className="size-3" />
                      {meta.label}
                    </Chip>
                  </div>
                  <span className="text-muted text-xs">
                    {approval.count} {approval.summary}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted inline-flex items-center gap-1 text-xs">
                    <Stopwatch className="size-3" />
                    {approval.due}
                  </span>
                  <Button
                    size="sm"
                    onPress={() =>
                      notifyInfo(`Opening ${approval.count} ${approval.summary} for ${approval.customer}`)
                    }
                  >
                    Review
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card.Content>
    </Card>
  );
}
