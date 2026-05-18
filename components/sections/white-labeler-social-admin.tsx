"use client"

import { Globe2, History, PenSquare, Share2 } from "lucide-react"
import { Chip, Tabs } from "@heroui/react"

import { EmbeddedPortalShell, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { WhiteLabelerSocialSettings } from "@/components/sections/white-labeler-social-settings"

export function WhiteLabelerSocialAdminSection() {
  return (
    <EmbeddedPortalShell className="mx-auto w-full max-w-6xl space-y-6 px-4 md:px-6">
      <section className="rounded-[16px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-transparent dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" color="default">Social Admin</Chip>
              <Chip size="sm" variant="soft" color="default">Platform controls</Chip>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Master Social Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-[var(--muted-foreground)] sm:text-[15px]">
                Manage platform-level social connections and monitor global posting activity from the same admin surface language used across the rest of the platform.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-start gap-2 rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[var(--muted-foreground)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-[var(--muted-foreground)]">Workspace state</p>
            <p className="font-medium text-slate-900 dark:text-white">Connections are managed centrally</p>
            <p>Composer and history are staged on the same route so future publishing tools stay in one place.</p>
          </div>
        </div>
      </section>

      <Tabs.Root defaultSelectedKey="connections" className="w-full space-y-6">
        <Tabs.List className="grid w-full grid-cols-3 gap-2 rounded-[14px] border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:glass-inset dark:border-white/10 dark:bg-transparent dark:shadow-none">
          <Tabs.Tab id="connections">Connections</Tabs.Tab>
          <Tabs.Tab id="compose">Composer</Tabs.Tab>
          <Tabs.Tab id="history">History</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="connections" className="mt-6">
          <WhiteLabelerSocialSettings />
        </Tabs.Panel>

        <Tabs.Panel id="compose" className="mt-6">
          <PortalSurfaceCard title="Unified Post Composer" description="Draft content to be published across multiple platforms.">
            <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:glass-inset dark:border-white/10 dark:bg-transparent">
              <PenSquare className="mx-auto mb-4 size-10 text-[var(--muted-foreground)]" />
              <p className="text-lg font-medium text-[var(--foreground)]">Composer interface is next in the migration queue.</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                The shell, motion, and admin tabs are standardized now; the multi-network composition flow is the next feature pass.
              </p>
            </div>
          </PortalSurfaceCard>
        </Tabs.Panel>

        <Tabs.Panel id="history" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <PortalSurfaceCard title="Global Post History" description="Monitor the status of all posts sent through the platform.">
              <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:glass-inset dark:border-white/10 dark:bg-transparent">
                <History className="mx-auto mb-4 size-10 text-[var(--muted-foreground)]" />
                <p className="text-lg font-medium text-[var(--foreground)]">Post history table is next.</p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  This will be migrated onto the shared HeroUI table infrastructure instead of introducing another ad hoc history view.
                </p>
              </div>
            </PortalSurfaceCard>

            <PortalSurfaceCard title="Channel Coverage" description="Current admin orchestration scope.">
              <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center justify-between rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 dark:glass-panel-muted dark:border-white/10 dark:bg-transparent">
                  <span className="inline-flex items-center gap-2"><Share2 className="size-4" />Connection management</span>
                  <Chip size="sm" variant="soft" color="success">Live</Chip>
                </div>
                <div className="flex items-center justify-between rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 dark:glass-panel-muted dark:border-white/10 dark:bg-transparent">
                  <span className="inline-flex items-center gap-2"><Globe2 className="size-4" />Platform visibility</span>
                  <Chip size="sm" variant="soft" color="accent">Standardized</Chip>
                </div>
                <div className="flex items-center justify-between rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 dark:glass-panel-muted dark:border-white/10 dark:bg-transparent">
                  <span className="inline-flex items-center gap-2"><PenSquare className="size-4" />Compose + history</span>
                  <Chip size="sm" variant="soft" color="warning">Queued</Chip>
                </div>
              </div>
            </PortalSurfaceCard>
          </div>
        </Tabs.Panel>
      </Tabs.Root>
    </EmbeddedPortalShell>
  )
}