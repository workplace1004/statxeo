"use client";

import type {Meeting} from "../../server/db/schemas/meetings";

import {ArrowUpRightFromSquare, Calendar, Video} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, Tabs} from "@heroui/react";
import {KPI, KPIGroup} from "@heroui-pro/react";

import {notifyInfo} from "../../lib/ui/white-label-notify";
import {MEETING_STATUS_COLORS} from "../../server/db/schemas/meetings";
import {BookDemoButton} from "../../widgets/affiliate/modals/book-demo-modal";
import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {EmptyState} from "../../widgets/empty-state";

export interface AffiliateMeetingsPageProps {
  meetings: Meeting[];
}

export function AffiliateMeetingsPage({meetings}: AffiliateMeetingsPageProps) {
  const isEmpty = meetings.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Book demos, manage your calendar, and meet your assigned reps.
        </p>
        <BookDemoButton />
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Upcoming</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={meetings.length} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Completed · 30d</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Show rate</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg. close rate</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Calendar</Card.Title>
          <Card.Description>Switch between agenda and slot views.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Tabs defaultSelectedKey="agenda">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Calendar view">
                <Tabs.Tab id="agenda">
                  Agenda
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="slots">
                  Available slots
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel className="pt-4" id="agenda">
              {isEmpty ? (
                <EmptyState
                  body="Demos and discovery calls scheduled with your reps appear here."
                  cta={{
                    label: "Open booking link",
                    onPress: () =>
                      copyToClipboard(
                        "https://statxeo.com/book/demo?ref=partner",
                        "Booking link copied",
                      ),
                  }}
                  title="No meetings on the books"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {meetings.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
                  ))}
                </div>
              )}
            </Tabs.Panel>
            <Tabs.Panel className="pt-4" id="slots">
              <div className="border-content2 bg-content1 flex flex-col items-center gap-2 rounded-xl border p-6 text-center">
                <span className="text-foreground text-sm font-medium">No open slots yet</span>
                <p className="text-muted text-xs">
                  Your reps&apos; bookable hours will appear here once their calendars are connected.
                </p>
              </div>
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Assigned reps</Card.Title>
          <Card.Description>
            Your dedicated AEs — book a demo with the right vertical lead.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="border-content2 bg-content1 flex flex-col items-center gap-2 rounded-xl border p-6 text-center">
            <span className="text-foreground text-sm font-medium">
              Reps will be assigned once your application is approved
            </span>
            <p className="text-muted text-xs">
              Each affiliate gets a dedicated AE per vertical so demos go to the right hands.
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function MeetingRow({meeting}: {meeting: Meeting}) {
  return (
    <div className="border-content2 bg-content1 flex items-center gap-3 rounded-xl border p-3">
      <div className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
        <Calendar className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-medium">{meeting.title}</span>
          <Chip color={MEETING_STATUS_COLORS[meeting.status]} size="sm" variant="soft">
            {meeting.status}
          </Chip>
          <Chip color="default" size="sm" variant="soft">
            {meeting.type}
          </Chip>
        </div>
        <span className="text-muted truncate text-xs">
          {meeting.company} · {meeting.display} · w/ {meeting.rep.name}
        </span>
      </div>
      <Avatar className="size-7">
        <Avatar.Image alt={meeting.attendeeName} src={meeting.attendeeAvatar} />
        <Avatar.Fallback>
          {meeting.attendeeName
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </Avatar.Fallback>
      </Avatar>
      <Button
        size="sm"
        variant="tertiary"
        onPress={() => {
          const url = meeting.joinUrl || "https://meet.statxeo.com/demo";
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      >
        <Video className="size-4" />
        Join
        <ArrowUpRightFromSquare className="size-3.5" />
      </Button>
    </div>
  );
}
