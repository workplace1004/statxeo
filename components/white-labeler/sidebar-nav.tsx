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
  { segment: "home", href: base, label: "Home", icon: Home, group: "dashboard", description: "Workspace summary" },
  { segment: "clients", href: `${base}/clients`, label: "Clients", icon: Building2, group: "revenue", description: "Accounts and site volume" },
  { segment: "pricing", href: `${base}/pricing`, label: "Plan pricing", icon: LayoutGrid, group: "revenue", description: "Packages and margins" },
  { segment: "billing", href: `${base}/billing`, label: "Billing", icon: CreditCard, group: "revenue", description: "Charges and receipts" },
  { segment: "payouts", href: `${base}/payouts`, label: "Payouts", icon: Wallet, group: "revenue", description: "Settlement status" },
  { segment: "branding", href: `${base}/branding`, label: "Branding", icon: Palette, group: "workspace", description: "Identity and domains" },
  { segment: "social", href: `${base}/social`, label: "Social", icon: Share2, group: "workspace", description: "Publishing connections" },
  { segment: "team", href: `${base}/team`, label: "Team", icon: Users, group: "workspace", description: "Roles and access" },
  { segment: "account", href: `${base}/account`, label: "Account", icon: Settings2, group: "settings", description: "Portal settings" },
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
  const roleLabel = overview?.account.role ? `${overview.account.role[0].toUpperCase()}${overview.account.role.slice(1)}` : "Partner"
  const initials = display
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("") || "WL"

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/80 px-3 py-3 dark:border-white/8">
        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">{initials}</div>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">{display}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)] dark:bg-white/10 dark:text-slate-200 dark:shadow-none">Partner portal</span>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">{roleLabel}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Clients</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{overview?.kpis.activeClients ?? 0}</p>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Sites</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{overview?.kpis.activeSites ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-2">
      {(["dashboard", "revenue", "workspace", "settings"] as const).map((g) => {
        const items = nav.filter((n) => n.group === g)
        if (items.length === 0) return null
        return (
          <SidebarGroup key={g} className="px-1 py-2">
            <SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{groupLabel[g]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon
                  const active = item.segment === segment
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="h-auto rounded-[16px] px-3 py-3 text-slate-600 hover:bg-slate-100 hover:text-slate-950 data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:shadow-[0_10px_22px_rgba(15,23,42,0.16)] dark:text-inherit dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground dark:data-[active=true]:bg-sidebar-accent dark:data-[active=true]:text-sidebar-accent-foreground dark:data-[active=true]:shadow-none">
                        <Link href={item.href}>
                          <span className={active ? "flex size-10 items-center justify-center rounded-[12px] bg-white/14 text-white dark:bg-white/10" : "flex size-10 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200"}>
                            <Icon className="size-4.5" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-semibold leading-tight">{item.label}</span>
                            <span className={active ? "truncate pt-1 text-xs text-white/72 dark:text-slate-300" : "truncate pt-1 text-xs text-slate-500 dark:text-slate-400"}>{item.description}</span>
                          </span>
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

      </div>
    </div>
  )
}
