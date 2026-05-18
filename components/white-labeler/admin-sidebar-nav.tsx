"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, LayoutDashboard, ShieldCheck, Share2 } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"

const nav = [
  {
    label: "Admin overview",
    href: "/white-labeler/admin",
    icon: LayoutDashboard,
    group: "admin",
  },
  {
    label: "Applications",
    href: "/white-labeler/admin/applications",
    icon: ShieldCheck,
    group: "admin",
  },
  {
    label: "Social admin",
    href: "/white-labeler/admin/social",
    icon: Share2,
    group: "admin",
  },
  {
    label: "Back to tenant portal",
    href: "/white-labeler",
    icon: ArrowLeft,
    group: "workspace",
  },
] as const

const groupLabels = {
  admin: "Administration",
  workspace: "Workspace",
} as const

export function WhiteLabelerAdminSidebarNav() {
  const pathname = usePathname() ?? ""
  const { overview } = useWhiteLabelerPortal()
  const displayName = overview?.account.displayName?.trim() || "White-label"

  return (
    <>
      <div className="border-b border-slate-200/80 px-3 py-3 dark:border-white/8">
        <p className="truncate text-sm font-semibold leading-tight tracking-tight text-slate-900 dark:text-inherit">{displayName}</p>
        <p className="truncate pt-1 text-xs text-slate-500 dark:text-sidebar-foreground/60">Admin workspace</p>
      </div>

      {(["admin", "workspace"] as const).map((group) => {
        const items = nav.filter((item) => item.group === group)
        if (items.length === 0) return null

        return (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{groupLabels[group]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.href === "/white-labeler"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className="rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-slate-900 data-[active=true]:text-white dark:text-inherit dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-sidebar-accent-foreground">
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </>
  )
}