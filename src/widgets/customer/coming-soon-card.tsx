"use client";

import type {ComponentType, ReactNode} from "react";

import {Bell} from "@gravity-ui/icons";
import {Button, Card, Chip} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";

interface ComingSoonCardProps {
  icon: ComponentType<{className?: string}>;
  title: string;
  description: string;
  badgeLabel: string;
  preview: ReactNode;
}

export function ComingSoonCard({
  badgeLabel,
  description,
  icon: Icon,
  preview,
  title,
}: ComingSoonCardProps) {
  const [notified, setNotified] = useState(false);

  return (
    <Card className="relative overflow-hidden rounded-2xl">
      <Card.Header className="flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl">
            <Icon className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <Card.Title className="text-base">{title}</Card.Title>
            <Card.Description>{description}</Card.Description>
          </div>
        </div>
        <Chip color="accent" size="sm" variant="soft">
          {badgeLabel}
        </Chip>
      </Card.Header>
      <Card.Content className="relative">
        <div className="relative">
          <div className="flex flex-col gap-2 opacity-60">{preview}</div>
          <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-default-200 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="soft">
              Q3 2026
            </Chip>
            <span className="text-muted text-xs">Coming soon</span>
          </div>
          <Button
            isDisabled={notified}
            size="sm"
            variant="tertiary"
            onPress={() => {
              setNotified(true);
              notifySuccess(`You're on the list — we'll let you know when ${title} launches`);
            }}
          >
            <Bell className="size-3.5" />
            {notified ? "You're on the list" : "Notify me"}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
