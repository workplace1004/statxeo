"use client"

import { useMemo, useState } from "react"
import { Plus, UserPlus } from "lucide-react"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Workspace</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Team</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Invite teammates by Supabase user UUID. Email invites are planned—share UUID from Account settings for now.
          </p>
        </div>
        {canManageTeam ? (
          <Button type="button" className="gap-2" onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite member
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {team.length} {team.length === 1 ? "member" : "members"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {teamMutationError ? <p className="text-destructive mb-3 text-sm">{teamMutationError}</p> : null}
          {teamLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : teamError ? (
            <p className="text-destructive text-sm">{teamError}</p>
          ) : sortedTeam.length === 0 ? (
            <Empty className="border border-border/60 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserPlus />
                </EmptyMedia>
                <EmptyTitle>No team members</EmptyTitle>
                <EmptyDescription>Add collaborators with owner or admin roles.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  {canManageTeam ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeam.map((row) => {
                  const isSelf = row.user_id === overview?.account.userId
                  return (
                    <TableRow key={`${row.user_id}-${row.created_at}`}>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs">{row.user_id}</TableCell>
                      <TableCell>
                        {canManageTeam && !isSelf ? (
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
                          <span className="capitalize">{row.role}</span>
                        )}
                      </TableCell>
                      <TableCell>{row.is_active ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(row.created_at)}</TableCell>
                      {canManageTeam ? (
                        <TableCell className="text-right">
                          {isSelf ? (
                            <span className="text-muted-foreground text-xs">You</span>
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
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
