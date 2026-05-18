import type { ReactNode } from "react"
import { Avatar, Button as HeroButton, Card as HeroCard, Chip } from "@heroui/react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type PortalHeroProps = {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  initials: string
  status?: ReactNode
  actions?: ReactNode
}

export function PortalShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass-page min-h-screen px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8", className)}>
      <div className="mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  )
}

export function EmbeddedPortalShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-6 text-[var(--foreground)]", className)}>{children}</div>
}

export function PortalHero({ eyebrow, title, description, initials, status, actions }: PortalHeroProps) {
  return (
    <HeroCard variant="secondary" className="overflow-hidden rounded-[16px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_28px_rgba(15,23,42,0.06)] dark:glass-panel-strong dark:border-white/12 dark:bg-transparent dark:shadow-none">
      <HeroCard.Content className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size="lg" variant="soft">
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft" color="accent">
                  {eyebrow}
                </Chip>
                {status}
              </div>
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</div>
                <p className="mt-2 max-w-3xl text-sm text-[var(--muted-foreground)] sm:text-base">{description}</p>
              </div>
            </div>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">{actions}</div> : null}
      </HeroCard.Content>
    </HeroCard>
  )
}

export function PortalSurfaceCard({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <HeroCard variant="secondary" className={cn("rounded-[14px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)] dark:glass-panel dark:border-white/10 dark:bg-transparent dark:shadow-none", className)}>
      <HeroCard.Header>
        <HeroCard.Title>{title}</HeroCard.Title>
        {description ? <HeroCard.Description>{description}</HeroCard.Description> : null}
      </HeroCard.Header>
      <HeroCard.Content>{children}</HeroCard.Content>
    </HeroCard>
  )
}

export function PortalStatCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <HeroCard variant="tertiary" className="rounded-[12px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.05)] dark:glass-panel dark:border-white/10 dark:bg-transparent dark:shadow-none">
      <HeroCard.Header>
        <HeroCard.Description>{label}</HeroCard.Description>
        <HeroCard.Title>{value}</HeroCard.Title>
      </HeroCard.Header>
      {meta ? <HeroCard.Content className="pt-0 text-sm text-[var(--muted-foreground)]">{meta}</HeroCard.Content> : null}
    </HeroCard>
  )
}

export function PortalLoadingState({ label }: { label: string }) {
  return (
    <PortalSurfaceCard title={label}>
      <div className="flex items-center justify-center gap-3 py-12 text-sm text-[var(--muted-foreground)]">
        <Spinner />
        <span>{label}</span>
      </div>
    </PortalSurfaceCard>
  )
}

export function PortalErrorState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <PortalSurfaceCard title={title}>
      <div className="space-y-4 py-1">
        <p className="text-sm text-rose-300">{message}</p>
        {action ? <div>{action}</div> : null}
      </div>
    </PortalSurfaceCard>
  )
}

export function PortalEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <PortalSurfaceCard title={title}>
      <div className="space-y-4 py-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        {action ? <div className="flex justify-center">{action}</div> : null}
      </div>
    </PortalSurfaceCard>
  )
}

export function PortalActionButton({ children, ...props }: React.ComponentProps<typeof HeroButton>) {
  return <HeroButton size="sm" {...props}>{children}</HeroButton>
}