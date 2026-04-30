import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WhiteLabelerEnvAlertProps {
  title: string
  description: string
}

export function WhiteLabelerEnvAlert({ title, description }: WhiteLabelerEnvAlertProps) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] px-6 py-20 text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_42%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
        <Card className="neo-surface w-full border-white/70 bg-white/80 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_28px_90px_rgba(2,6,23,0.55)]">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-200">
              White-labeler portal
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild variant="neo" size="xl">
              <Link href="/help">Get help</Link>
            </Button>
            <Button asChild variant="neo-secondary" size="xl">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
