"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, LogOut, RefreshCcw, ShieldCheck } from "lucide-react"
import { Avatar, Button as HeroButton, Chip } from "@heroui/react"

import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { cn } from "@/lib/utils"

import { WhiteLabelerAdminSidebarNav } from "./admin-sidebar-nav"

const routeMeta = {
  "/white-labeler/admin": {
    label: "Command center",
    eyebrow: "White-label admin",
  },
  "/white-labeler/admin/applications": {
    label: "Applications",
    eyebrow: "Partner approvals",
  },
  "/white-labeler/admin/social": {
    label: "Social admin",
    eyebrow: "Platform publishing",
  },
} as const

function getRouteMeta(pathname: string) {
  const matched = Object.entries(routeMeta).find(([href]) => pathname === href || pathname.startsWith(`${href}/`))
  return matched?.[1] ?? routeMeta["/white-labeler/admin"]
}

export function WhiteLabelerAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/white-labeler/admin"
  const router = useRouter()
  const {
    overview,
    refreshCurrentPage,
    isRefreshing,
    handleSignOut,
    isSigningOut,
  } = useWhiteLabelerPortal()

  const meta = getRouteMeta(pathname)
  const displayName = overview?.account.displayName?.trim() || "White-label"
  const roleLabel = overview?.account.role ? `${overview.account.role[0].toUpperCase()}${overview.account.role.slice(1)}` : "Admin"
  const initials = useMemo(() => {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase() ?? "")
      .join("") || "WL"
  }, [displayName])

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="border-r border-slate-200/80 bg-white/96 dark:border-white/10 dark:bg-transparent">
        <SidebarContent>
          <WhiteLabelerAdminSidebarNav />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/94 shadow-[0_1px_0_rgba(15,23,42,0.05)] supports-[backdrop-filter]:bg-white/86 dark:border-white/8 dark:bg-background/80 dark:shadow-none dark:supports-[backdrop-filter]:bg-background/55">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
            <SidebarTrigger className="size-8 shrink-0" aria-label="Open admin navigation menu" />
            <Separator orientation="vertical" className="mr-1 hidden h-8 sm:block" />

            <div className="min-w-0 flex flex-1 items-center gap-3">
              <Avatar size="sm" variant="soft" className="hidden shrink-0 sm:flex">
                <Avatar.Fallback>{initials}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">{displayName}</p>
                  <Chip size="sm" variant="soft" color="default">
                    {roleLabel}
                  </Chip>
                  <Chip size="sm" variant="soft" color="default">
                    <ShieldCheck className="size-3.5" />
                    Admin
                  </Chip>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">{meta.eyebrow}</p>
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">{meta.label}</p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HeroButton
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
                onPress={() => router.push("/white-labeler")}
              >
                <ArrowLeft className="size-4" />
                Tenant portal
              </HeroButton>
              <HeroButton
                size="sm"
                variant="outline"
                onPress={() => void refreshCurrentPage()}
                isDisabled={isRefreshing}
              >
                <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} aria-hidden />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </HeroButton>
              <HeroButton
                size="sm"
                variant="danger-soft"
                onPress={() => void handleSignOut()}
                isDisabled={isSigningOut}
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">{isSigningOut ? "Signing out..." : "Sign out"}</span>
              </HeroButton>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100svh-3.5rem)] flex-1 flex-col">
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-10 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}