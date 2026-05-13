"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { WhiteLabelerMobileBottomNav } from "@/components/white-labeler/mobile-bottom-nav"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { type PortalSegment } from "@/components/white-labeler/portal-utils"
import { cn } from "@/lib/utils"

import { WhiteLabelerSidebarNav } from "./sidebar-nav"

const segmentTitle: Record<PortalSegment, string> = {
  home: "Home",
  clients: "Clients",
  pricing: "Plan pricing",
  billing: "Billing",
  payouts: "Payouts",
  branding: "Branding",
  social: "Social",
  team: "Team",
  account: "Account",
}

export function WhiteLabelerAppShell({ children }: { children: React.ReactNode }) {
  const {
    segment,
    refreshCurrentPage,
    isRefreshing,
    handleSignOut,
    isSigningOut,
    canManageTeam,
  } = useWhiteLabelerPortal()

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <WhiteLabelerSidebarNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="size-9 shrink-0" aria-label="Open navigation menu" />
          <Separator orientation="vertical" className="mr-1 h-6" />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">
            {segmentTitle[segment]}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {canManageTeam ? (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/white-labeler/admin" data-icon="inline-start">
                  <LayoutDashboard className="size-4" />
                  Admin
                </Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshCurrentPage()}
              disabled={isRefreshing}
              className="gap-1.5"
              aria-busy={isRefreshing}
            >
              <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} aria-hidden />
              <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="gap-1.5"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">{isSigningOut ? "Signing out…" : "Sign out"}</span>
            </Button>
          </div>
        </header>
        <div className="flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col">
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 md:pb-10">{children}</div>
        </div>
        <WhiteLabelerMobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
