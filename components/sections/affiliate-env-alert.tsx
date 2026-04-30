import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AffiliateEnvAlertProps {
  title: string
  description: string
}

export function AffiliateEnvAlert({ title, description }: AffiliateEnvAlertProps) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_48%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-20 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.16),_transparent_42%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
        <Card className="neo-surface w-full border-white/70 bg-white/80 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_28px_90px_rgba(2,6,23,0.55)]">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200">
              Affiliate portal
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="neo" size="xl">
              <Link href="/affiliate">View affiliate guide</Link>
            </Button>
            <Button asChild variant="neo-secondary" size="xl">
              <Link href="/affiliate/help">Open affiliate help</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}