"use client";

import type {
  ActivityLogEntry,
  AgencyTeamMember,
} from "../../server/db/schemas/agency-team";
import type {DataGridColumn} from "@heroui-pro/react";

import {EllipsisVertical, Pencil, PersonPlus, TrashBin} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {InviteTeamMemberModal} from "../../widgets/white-label/modals/invite-team-member-modal";
import {TEAM_ROLE_COLOR} from "../../server/db/schemas/agency-team";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/page-toolbar";

export interface WhiteLabelTeamPageProps {
  members: AgencyTeamMember[];
  log: ActivityLogEntry[];
}

export function WhiteLabelTeamPage({log, members}: WhiteLabelTeamPageProps) {
  const inviteState = useOverlayState();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRemoveTeammate = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    setDeletingId(memberId);
    try {
      const res = await fetch(`/api/white-label/team?memberId=${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Removed ${name} from the team`);
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to remove team member");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while removing team member");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();

    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [members, search]);

  const columns = useMemo<DataGridColumn<AgencyTeamMember>[]>(
    () => {
      const act = (member: AgencyTeamMember, action: string) => {
        notifyInfo(`${action} — ${member.name}`);
      };

      return [
        {
          accessorKey: "name",
          allowsSorting: true,
          cell: (item) => (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <Avatar.Image alt={item.name} src={item.avatar} />
                <Avatar.Fallback>
                  {item.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground text-sm font-medium leading-tight">
                  {item.name}
                </span>
                <span className="text-muted text-xs leading-tight">{item.email}</span>
              </div>
            </div>
          ),
          header: "Member",
          id: "name",
          isRowHeader: true,
          minWidth: 260,
        },
        {
          accessorKey: "role",
          allowsSorting: true,
          cell: (item) => (
            <Chip color={TEAM_ROLE_COLOR[item.role]} size="sm" variant="soft">
              {item.role}
            </Chip>
          ),
          header: "Role",
          id: "role",
          minWidth: 160,
        },
        {
          accessorKey: "customers",
          allowsSorting: true,
          cell: (item) => (
            <span className="text-foreground tabular-nums text-sm">
              {item.customers} {item.customers === 1 ? "customer" : "customers"}
            </span>
          ),
          header: "Customers",
          id: "customers",
          minWidth: 140,
        },
        {
          accessorKey: "status",
          cell: (item) => (
            <Chip
              color={
                item.status === "Active"
                  ? "success"
                  : item.status === "Invited"
                    ? "warning"
                    : "danger"
              }
              size="sm"
              variant="soft"
            >
              {item.status}
            </Chip>
          ),
          header: "Status",
          id: "status",
          minWidth: 110,
        },
        {
          accessorKey: "lastActive",
          cell: (item) => <span className="text-muted text-xs">{item.lastActive}</span>,
          header: "Last active",
          id: "lastActive",
          minWidth: 140,
        },
        {
          align: "end",
          cell: (item) => (
            <div className="flex items-center justify-end gap-0.5">
              <IconButton
                label="Edit"
                size="sm"
                variant="tertiary"
                onPress={() => act(item, "Edit")}
              >
                <Pencil className="size-4" />
              </IconButton>
              <IconButton
                label="Remove"
                size="sm"
                variant="danger-soft"
                isDisabled={deletingId !== null}
                onPress={() => handleRemoveTeammate(item.id, item.name)}
              >
                <TrashBin className="size-4" />
              </IconButton>
              <IconButton
                label="More"
                size="sm"
                variant="tertiary"
                onPress={() => act(item, "More options")}
              >
                <EllipsisVertical className="size-4" />
              </IconButton>
            </div>
          ),
          header: "Actions",
          id: "actions",
          minWidth: 140,
        },
      ];
    },
    [deletingId],
  );

  const isEmpty = members.length === 0;
  const totalSeats = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const pendingInvites = members.filter((m) => m.status === "Invited").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Manage who can access the agency dashboard, what they can do, and what they did."
        showPeriod={false}
        title="Team"
        trailing={
          <InviteTeamMemberModal
            state={inviteState}
            trigger={
              <Button size="sm">
                <PersonPlus className="size-4" />
                Invite member
              </Button>
            }
          />
        }
      />

      {isEmpty ? (
        <EmptyState
          body="Add an admin, account manager, or SEO specialist to your agency."
          cta={{label: "Invite teammate", onPress: inviteState.open}}
          icon={PersonPlus}
          title="Invite your first teammate"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total seats" value={totalSeats.toString()} />
            <SummaryCard label="Active members" value={activeMembers.toString()} />
            <SummaryCard label="Pending invites" value={pendingInvites.toString()} />
            <SummaryCard label="Roles configured" value="6" />
          </div>

          <Card className="rounded-2xl">
            <Card.Header className="flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Card.Title className="text-base">Members</Card.Title>
                <Chip size="sm" variant="soft">
                  {members.length}
                </Chip>
              </div>
              <SearchField
                aria-label="Search team members"
                className="w-full sm:w-[220px]"
                name="team-search"
                onChange={setSearch}
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search members…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </Card.Header>
            <Card.Content>
              <DataGrid
                aria-label="Team members"
                columns={columns}
                contentClassName="min-w-[840px]"
                data={filteredMembers}
                getRowId={(item) => item.id}
              />
            </Card.Content>
          </Card>
        </>
      )}

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Activity log</Card.Title>
          <Card.Description>Recent admin actions across the agency.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2">
          {log.length === 0 ? (
            <p className="text-muted py-6 text-center text-sm">
              When teammates take action, their changes appear here.
            </p>
          ) : (
            log.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="size-6">
                    <Avatar.Fallback>
                      {entry.who
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </Avatar.Fallback>
                  </Avatar>
                  <span className="text-foreground text-sm">
                    <span className="font-medium">{entry.who}</span>{" "}
                    <span className="text-muted">{entry.action}</span> {entry.target}
                  </span>
                </div>
                <span className="text-muted text-xs">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </Card.Content>
      </Card>
      <InviteTeamMemberModal state={inviteState} />
    </div>
  );
}

function SummaryCard({label, value}: {label: string; value: string}) {
  return (
    <Card className="rounded-2xl">
      <Card.Content className="flex flex-col gap-1 py-4">
        <span className="text-muted text-xs">{label}</span>
        <span className="text-foreground text-2xl font-semibold tabular-nums">{value}</span>
      </Card.Content>
    </Card>
  );
}
