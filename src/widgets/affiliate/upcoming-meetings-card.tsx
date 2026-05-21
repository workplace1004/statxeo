"use client";

import type {Meeting} from "../../server/db/schemas/meetings";

import {ArrowUpRightFromSquare, Calendar, Video} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip} from "@heroui/react";

import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {MEETING_STATUS_COLORS} from "../../server/db/schemas/meetings";
import {BookDemoModal} from "./modals/book-demo-modal";
import {EmptyState} from "../empty-state";

export interface UpcomingMeetingsCardProps {
  meetings: readonly Meeting[];
}

export function UpcomingMeetingsCard({meetings}: UpcomingMeetingsCardProps) {
  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Card.Title className="text-base">Upcoming meetings</Card.Title>
          <Card.Description>Demos & discovery calls this week.</Card.Description>
        </div>
        <BookDemoModal
          trigger={
            <Button size="sm">
              <Calendar className="size-4" />
              Book demo
            </Button>
          }
        />
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {meetings.length === 0 ? (
          <EmptyState
            body="Demos and discovery calls scheduled with your reps appear here."
            cta={{
              label: "Open booking link",
              onPress: () =>
                copyToClipboard("https://statxeo.com/book/demo?ref=partner", "Booking link copied"),
            }}
            title="No meetings on the books"
          />
        ) : (
          meetings.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className="border-content2 bg-content1 flex items-center gap-3 rounded-xl border p-3"
            >
              <Avatar className="size-9 shrink-0">
                <Avatar.Image alt={m.attendeeName} src={m.attendeeAvatar} />
                <Avatar.Fallback>
                  {m.attendeeName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate text-sm font-medium">{m.title}</span>
                  <Chip color={MEETING_STATUS_COLORS[m.status]} size="sm" variant="soft">
                    {m.status}
                  </Chip>
                </div>
                <span className="text-muted truncate text-xs">
                  {m.company} · {m.display} · w/ {m.rep.name}
                </span>
              </div>
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => {
                  const url = m.joinUrl || "https://meet.statxeo.com/demo";
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                <Video className="size-4" />
                Join
                <ArrowUpRightFromSquare className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </Card.Content>
    </Card>
  );
}
