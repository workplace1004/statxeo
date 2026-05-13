"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CreditCard,
  Home,
  LayoutGrid,
  Palette,
  Share2,
  Settings2,
  Users,
  Wallet,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { pathnameToSegment, type PortalSegment } from "@/components/white-labeler/portal-utils"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"

const base = "/white-labeler"

const nav: Array<{
  segment: PortalSegment
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: "dashboard" | "revenue" | "workspace" | "settings"
}> = [
  { segment: "home", href: base, label: "Home", icon: Home, group: "dashboard" },
  { segment: "clients", href: `${base}/clients`, label: "Clients", icon: Building2, group: "revenue" },
  { segment: "pricing", href: `${base}/pricing`, label: "Plan pricing", icon: LayoutGrid, group: "revenue" },
  { segment: "billing", href: `${base}/billing`, label: "Billing", icon: CreditCard, group: "revenue" },
  { segment: "payouts", href: `${base}/payouts`, label: "Payouts", icon: Wallet, group: "revenue" },
  { segment: "branding", href: `${base}/branding`, label: "Branding", icon: Palette, group: "workspace" },
  { segment: "social", href: `${base}/social`, label: "Social", icon: Share2, group: "workspace" },
  { segment: "team", href: `${base}/team`, label: "Team", icon: Users, group: "workspace" },
  { segment: "account", href: `${base}/account`, label: "Account", icon: Settings2, group: "settings" },
]

const groupLabel: Record<string, string> = {
  dashboard: "Dashboard",
  revenue: "Revenue",
  workspace: "Workspace",
  settings: "Settings",
}

export function WhiteLabelerSidebarNav() {
  const pathname = usePathname() ?? ""
  const segment = pathnameToSegment(pathname)
  const { overview } = useWhiteLabelerPortal()
  const display = overview?.account.displayName?.trim() || "White-label"

  return (
    <>
      <div className="px-2 py-1">
        <p className="truncate px-2 text-sm font-semibold leading-tight tracking-tight">{display}</p>
        <p className="text-sidebar-foreground/60 truncate px-2 text-xs">Partner portal</p>
      </div>
      {(["dashboard", "revenue", "workspace", "settings"] as const).map((g) => {
        const items = nav.filter((n) => n.group === g)
        if (items.length === 0) return null
        return (
          <SidebarGroup key={g}>
            <SidebarGroupLabel>{groupLabel[g]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon
                  const active = item.segment === segment
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
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
