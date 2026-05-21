"use client";

import type {Call, CallType, PhoneNumber} from "../../server/db/schemas/calls";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowDown, ArrowUp, Handset, Play, Plus, Xmark} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid, KPI} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {notifyInfo} from "../../lib/ui/white-label-notify";
import {AutomationBanner} from "../../widgets/customer/automation-banner";
import {CALL_TAG_COLORS} from "../../server/db/schemas/calls";
import {AddPhoneButton, AddPhoneModal} from "../../widgets/customer/modals/add-phone-modal";
import {OutboundCallButton} from "../../widgets/customer/modals/outbound-call-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerCallingPageProps {
  calls: Call[];
  phones: PhoneNumber[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

const DIRECTION_ICON: Record<CallType, "up" | "down" | "x"> = {
  Inbound: "down",
  Missed: "x",
  Outbound: "up",
};

function DirectionIcon({direction}: {direction: CallType}) {
  const type = DIRECTION_ICON[direction];
  const color =
    direction === "Missed"
      ? "bg-danger/10 text-danger"
      : direction === "Inbound"
        ? "bg-success/10 text-success"
        : "bg-accent/10 text-accent";

  return (
    <span className={`flex size-7 items-center justify-center rounded-full ${color}`}>
      {type === "down" ? (
        <ArrowDown className="size-3.5" />
      ) : type === "up" ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <Xmark className="size-3.5" />
      )}
    </span>
  );
}

export function CustomerCallingPage({calls, phones}: CustomerCallingPageProps) {
  const addPhoneState = useOverlayState();
  const [search, setSearch] = useState("");

  const callsToday = useMemo(() => {
    const start = new Date();

    start.setHours(0, 0, 0, 0);
    return calls.filter((c) => new Date(c.startedAt) >= start);
  }, [calls]);

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;

    return calls.filter(
      (c) =>
        c.callerName.toLowerCase().includes(q) ||
        c.callerPhone.toLowerCase().includes(q) ||
        c.aiSummary.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q),
    );
  }, [calls, search]);

  const columns = useMemo<DataGridColumn<Call>[]>(
    () => [
      {
        accessorKey: "callerName",
        cell: (item) => (
          <div className="flex items-center gap-3">
            <DirectionIcon direction={item.direction} />
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-medium">{item.callerName}</span>
              <span className="text-muted text-xs tabular-nums">{item.callerPhone}</span>
            </div>
          </div>
        ),
        header: "Caller",
        id: "callerName",
        isRowHeader: true,
        minWidth: 240,
      },
      {
        accessorKey: "tag",
        cell: (item) => (
          <Chip color={CALL_TAG_COLORS[item.tag]} size="sm" variant="soft">
            {item.tag}
          </Chip>
        ),
        header: "AI tag",
        id: "tag",
        minWidth: 160,
      },
      {
        accessorKey: "aiSummary",
        cell: (item) => (
          <span className="text-muted line-clamp-2 max-w-md text-xs leading-snug">
            {item.aiSummary}
          </span>
        ),
        header: "AI summary",
        id: "aiSummary",
        minWidth: 320,
      },
      {
        accessorKey: "durationSeconds",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">
            {formatDuration(item.durationSeconds)}
          </span>
        ),
        header: "Length",
        id: "durationSeconds",
        minWidth: 90,
      },
      {
        accessorKey: "startedAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">{formatDate(item.startedAt)}</span>
        ),
        header: "When",
        id: "startedAt",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) =>
          item.recordingUrl ? (
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo(`Playing recording for ${item.callerName}`)}
            >
              <Play className="size-3.5" />
              Play
            </Button>
          ) : (
            <span className="text-muted text-xs">—</span>
          ),
        header: "",
        id: "actions",
        minWidth: 100,
      },
    ],
    [],
  );

  const bookedCount = calls.filter((c) => c.bookedJob).length;
  const totalMinutes = Math.round(calls.reduce((s, c) => s + c.durationSeconds, 0) / 60);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <AutomationBanner message="AI summarizes every call and tags it automatically" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Inbound calls handled by your AI assistant, recordings, and summaries.
        </p>
        <OutboundCallButton />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI>
          <KPI.Header>
            <KPI.Title>Calls today</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={callsToday.length} />
          </KPI.Content>
        </KPI>
        <KPI>
          <KPI.Header>
            <KPI.Title>Booked from calls</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={bookedCount} />
          </KPI.Content>
        </KPI>
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg answer time</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPI>
          <KPI.Header>
            <KPI.Title>Talk minutes</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={totalMinutes} />
          </KPI.Content>
        </KPI>
      </div>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">Call log</Card.Title>
            <Card.Description>
              AI-summarized calls from your tracked phone numbers.
            </Card.Description>
          </div>
          <SearchField
            aria-label="Search calls"
            className="w-[220px]"
            name="calls-search"
            value={search}
            variant="secondary"
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search calls..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Card.Header>
        <Card.Content>
          {filteredCalls.length === 0 ? (
            <EmptyState
              body="Inbound, outbound, and missed calls — with AI summaries — appear here."
              cta={{label: "Set up call tracking", onPress: addPhoneState.open}}
              icon={Handset}
              title="No calls yet"
            />
          ) : (
            <DataGrid
              aria-label="Call log"
              columns={columns}
              contentClassName="min-w-[1080px]"
              data={calls}
              getRowId={(item) => item.id}
            />
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">Your phone numbers</Card.Title>
            <Card.Description>Local and tracking numbers managed by StatXEO.</Card.Description>
          </div>
          <AddPhoneButton />
        </Card.Header>
        <Card.Content className="flex flex-col gap-2">
          {phones.length === 0 ? (
            <EmptyState
              body="Add a tracking number to start logging calls."
              cta={{label: "Add number", onPress: addPhoneState.open}}
              icon={Handset}
              title="No phone numbers yet"
            />
          ) : (
            phones.map((num) => (
              <div
                key={num.number}
                className="hover:bg-content2 flex items-center justify-between gap-3 rounded-xl px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="bg-content2 size-9">
                    <Avatar.Fallback>
                      <Handset className="text-muted size-4" />
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-sm font-semibold tabular-nums">
                        {num.number}
                      </span>
                      {num.isPrimary ? (
                        <Chip color="success" size="sm" variant="soft">
                          Primary
                        </Chip>
                      ) : null}
                      <Chip size="sm" variant="soft">
                        {num.type}
                      </Chip>
                    </div>
                    <span className="text-muted text-xs">
                      {num.label} · forwards to {num.forwardingTo}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => copyToClipboard(num.number, "Phone number copied")}
                >
                  Copy number
                </Button>
              </div>
            ))
          )}
        </Card.Content>
      </Card>
      <AddPhoneModal state={addPhoneState} />
    </div>
  );
}
