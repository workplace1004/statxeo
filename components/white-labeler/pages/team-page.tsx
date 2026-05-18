"use client"

import { useMemo, useState } from "react"
import { Plus, UserPlus } from "lucide-react"
import { Chip } from "@heroui/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PortalActionButton, PortalEmptyState, PortalHero, PortalLoadingState, PortalStatCard, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { PortalDataTable } from "@/components/portal/portal-data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { formatDate } from "@/components/white-labeler/portal-utils"
import type { WhiteLabelerTeamMember } from "@/lib/statxeo/white-labeler-client"

export function WhiteLabelerTeamPage() {
  const {
    team,
    teamLoading,
    teamError,
    teamMutationError,
    canManageTeam,
    overview,
    teamForm,
    setTeamForm,
    isAddingMember,
    handleAddTeamMember,
    updatingMemberId,
    updatingMemberRoleId,
    handleToggleMemberStatus,
    handleUpdateMemberRole,
  } = useWhiteLabelerPortal()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleConfirm, setRoleConfirm] = useState<{ row: WhiteLabelerTeamMember; next: "owner" | "admin" | "member" } | null>(
    null,
  )

  const sortedTeam = useMemo(() => {
    const uid = overview?.account.userId
    return [...team].sort((a, b) => {
      if (uid) {
        if (a.user_id === uid) return -1
        if (b.user_id === uid) return 1
      }
      return a.created_at.localeCompare(b.created_at)
    })
  }, [team, overview?.account.userId])

  const inviteMember = async () => {
    const ok = await handleAddTeamMember()
    if (ok) setInviteOpen(false)
  }

  const activeMembers = useMemo(() => sortedTeam.filter((member) => member.is_active).length, [sortedTeam])
  const elevatedMembers = useMemo(() => sortedTeam.filter((member) => member.role === "owner" || member.role === "admin").length, [sortedTeam])

  const teamColumns = useMemo(() => [
    {
      key: "user",
      label: "User",
      rowHeader: true,
      sortable: true,
      sortValue: (row: WhiteLabelerTeamMember) => row.user_id,
      render: (row: WhiteLabelerTeamMember) => {
        const isSelf = row.user_id === overview?.account.userId

        return (
          <div className="space-y-1">
            <p className="font-mono text-xs text-slate-900 dark:text-white">{row.user_id}</p>
            {isSelf ? <p className="text-xs text-slate-500 dark:text-slate-400">Current workspace user</p> : null}
          </div>
        )
      },
      className: "max-w-[280px]",
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      sortValue: (row: WhiteLabelerTeamMember) => row.role,
      render: (row: WhiteLabelerTeamMember) => {
        const isSelf = row.user_id === overview?.account.userId

        return canManageTeam && !isSelf ? (
          <Select
            value={row.role}
            onValueChange={(v) => {
              const next = v as "owner" | "admin" | "member"
              if (next === row.role) return
              if (next === "owner") {
                setRoleConfirm({ row, next })
              } else {
                void handleUpdateMemberRole(row, next)
              }
            }}
            disabled={updatingMemberRoleId === row.user_id}
          >
            <SelectTrigger className="h-11 w-[140px]" aria-label={`Role for ${row.user_id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              {overview?.account.role === "owner" ? <SelectItem value="owner">Owner</SelectItem> : null}
            </SelectContent>
          </Select>
        ) : (
          <Chip size="sm" variant="soft" color={row.role === "owner" ? "accent" : row.role === "admin" ? "warning" : "default"} className="capitalize">
            {row.role}
          </Chip>
        )
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (row: WhiteLabelerTeamMember) => (row.is_active ? 1 : 0),
      render: (row: WhiteLabelerTeamMember) => (
        <Chip size="sm" variant="soft" color={row.is_active ? "success" : "default"}>
          {row.is_active ? "Active" : "Inactive"}
        </Chip>
      ),
    },
    {
      key: "joined",
      label: "Joined",
      sortable: true,
      sortValue: (row: WhiteLabelerTeamMember) => row.created_at,
      render: (row: WhiteLabelerTeamMember) => formatDate(row.created_at),
    },
    ...(canManageTeam
      ? [{
          key: "actions",
          label: "Actions",
          className: "text-right",
          headerClassName: "text-right",
          render: (row: WhiteLabelerTeamMember) => {
            const isSelf = row.user_id === overview?.account.userId

            return (
              <div className="flex justify-end">
                {isSelf ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">You</span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleToggleMemberStatus(row)}
                    disabled={updatingMemberId === row.user_id}
                  >
                    {updatingMemberId === row.user_id ? "Updating…" : row.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </div>
            )
          },
        }]
      : []),
  ], [canManageTeam, handleToggleMemberStatus, handleUpdateMemberRole, overview?.account.role, overview?.account.userId, updatingMemberId, updatingMemberRoleId])

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Workspace Settings"
        initials="TM"
        title="Team"
        description="Invite teammates by Supabase user UUID. Email invites are planned, so share UUIDs from Account settings for now."
        status={<Chip size="sm" variant="soft" color={canManageTeam ? "accent" : "default"}>{canManageTeam ? "Team management enabled" : "Read-only team access"}</Chip>}
        actions={canManageTeam ? (
          <PortalActionButton onPress={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite member
          </PortalActionButton>
        ) : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalStatCard label="Total members" value={String(sortedTeam.length)} meta="All workspace collaborators" />
        <PortalStatCard label="Active members" value={String(activeMembers)} meta="Currently enabled accounts" />
        <PortalStatCard label="Admins + owners" value={String(elevatedMembers)} meta="Financial and workspace operators" />
        <PortalStatCard label="Your role" value={overview?.account.role ?? "member"} meta="Current user permission level" />
      </div>

      {teamMutationError ? (
        <PortalSurfaceCard title="Team update error">
          <p className="text-sm text-rose-700 dark:text-rose-300">{teamMutationError}</p>
        </PortalSurfaceCard>
      ) : null}

      {teamLoading ? <PortalLoadingState label="Loading team workspace..." /> : null}
      {!teamLoading && teamError ? (
        <PortalSurfaceCard title="Team unavailable">
          <p className="text-sm text-rose-700 dark:text-rose-300">{teamError}</p>
        </PortalSurfaceCard>
      ) : null}

      {!teamLoading && !teamError && sortedTeam.length === 0 ? (
        <PortalEmptyState
          title="No team members"
          description="Add collaborators with owner or admin roles."
          action={<UserPlus className="mx-auto size-5" />}
        />
      ) : null}

      {!teamLoading && !teamError && sortedTeam.length > 0 ? (
        <PortalDataTable
          title="Members"
          description={`${team.length} ${team.length === 1 ? "member" : "members"} in this workspace.`}
          rows={sortedTeam}
          columns={teamColumns}
          getRowId={(row) => `${row.user_id}-${row.created_at}`}
          searchPlaceholder="Search team members"
          searchMatcher={(row, query) => [row.user_id, row.role, row.is_active ? "active" : "inactive"].some((value) => String(value).toLowerCase().includes(query))}
          emptyTitle="No team members"
          emptyDescription="Invite collaborators to start distributing ownership and admin workflows."
          filteredEmptyTitle="No team members match this search"
          filteredEmptyDescription="Try a different user id or role search."
        />
      ) : null}

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invite member</SheetTitle>
            <SheetDescription>
              Paste the teammate&apos;s Supabase auth user UUID. Optional note if you track invites by email internally.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <p className="text-muted-foreground text-sm">
              The API adds an existing Supabase user by UUID. Ask your teammate for their user id from their Account page if needed.
            </p>
            <div className="space-y-2">
              <Label htmlFor="invite-uuid">Supabase user UUID</Label>
              <Input
                id="invite-uuid"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={teamForm.userId}
                onChange={(e) => setTeamForm((s) => ({ ...s, userId: e.target.value }))}
                disabled={isAddingMember}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={teamForm.role}
                onValueChange={(v) =>
                  setTeamForm((s) => ({
                    ...s,
                    role: v as "owner" | "admin" | "member",
                  }))
                }
                disabled={isAddingMember}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {overview?.account.role === "owner" ? <SelectItem value="owner">Owner</SelectItem> : null}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="w-full" onClick={inviteMember} disabled={isAddingMember || !teamForm.userId.trim()}>
              {isAddingMember ? "Adding…" : "Add member"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={roleConfirm !== null} onOpenChange={(o) => !o && setRoleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign owner role?</AlertDialogTitle>
            <AlertDialogDescription>
              Owners have full financial and workspace control. Only confirm if this person should replace or share top-level
              ownership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (roleConfirm) {
                  void handleUpdateMemberRole(roleConfirm.row, roleConfirm.next).then(() => setRoleConfirm(null))
                }
              }}
            >
              Confirm owner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
