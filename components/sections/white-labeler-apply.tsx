"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Building2, Globe, ShieldCheck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  WhiteLabelerApiError,
  createWhiteLabelerApplication,
  type CreateWhiteLabelerApplicationInput,
} from "@/lib/statxeo/white-labeler-client"

const FLOW_STEPS = [
  "Partner signup",
  "Create organization",
  "Upload branding",
  "Connect Stripe account",
  "Verify domain",
  "Create reseller workspace",
  "Invite team",
  "Create first client",
]

function describeError(error: unknown) {
  if (error instanceof WhiteLabelerApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Unable to submit your application right now."
}

export function WhiteLabelerApplySection() {
  const [form, setForm] = useState<CreateWhiteLabelerApplicationInput>({
    contactFullName: "",
    contactEmail: "",
    companyName: "",
    companyWebsite: "",
    desiredSlug: "",
    referredBy: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successId, setSuccessId] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccessId("")
    setIsSubmitting(true)

    try {
      const response = await createWhiteLabelerApplication(form)
      setSuccessId(response.application.id)
      setForm({
        contactFullName: "",
        contactEmail: "",
        companyName: "",
        companyWebsite: "",
        desiredSlug: "",
        referredBy: "",
        notes: "",
      })
    } catch (submitError) {
      setError(describeError(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-12 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Badge variant="outline" className="w-fit border-slate-300 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em]">
            White-label partner intake
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Apply to run your own branded reseller workspace on Statxeo.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
              Start with a simple approval flow now. After approval, your onboarding moves through branding,
              Stripe Connect, domain verification, team setup, and your first client launch.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200/80 bg-white/80 shadow-sm">
              <CardHeader>
                <Building2 className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-lg">Single partner org</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Each approved partner gets an isolated white-label organization with its own pricing, team, and payout ledger.
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 shadow-sm">
              <CardHeader>
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-lg">Approval first</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Applications are reviewed before access is granted so partner setup stays controlled and compliant.
              </CardContent>
            </Card>
            <Card className="border-slate-200/80 bg-white/80 shadow-sm">
              <CardHeader>
                <Globe className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-lg">Custom brand surface</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Partners move into a guided path for branding, connected payments, and custom domain readiness.
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200/80 bg-slate-950 text-slate-50 shadow-xl">
            <CardHeader>
              <CardTitle>Onboarding flow</CardTitle>
              <CardDescription className="text-slate-300">
                This is the exact path every approved partner will follow.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {FLOW_STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm text-slate-100">{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Partner application</CardTitle>
            <CardDescription>
              Submit your company details. Approved partners receive a white-label onboarding link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {successId ? (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
                <AlertTitle>Application submitted</AlertTitle>
                <AlertDescription>
                  <p>Application ID: {successId}</p>
                  <p>Our team can now review and approve your reseller setup.</p>
                </AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Submission failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-contact-name">Full name</Label>
                  <Input
                    id="wl-apply-contact-name"
                    value={form.contactFullName}
                    onChange={(event) => setForm((current) => ({ ...current, contactFullName: event.target.value }))}
                    placeholder="Jane Doe"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-contact-email">Work email</Label>
                  <Input
                    id="wl-apply-contact-email"
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
                    placeholder="jane@agency.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-company-name">Company name</Label>
                  <Input
                    id="wl-apply-company-name"
                    value={form.companyName}
                    onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                    placeholder="Agency North"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-company-website">Company website</Label>
                  <Input
                    id="wl-apply-company-website"
                    value={form.companyWebsite ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, companyWebsite: event.target.value }))}
                    placeholder="agencynorth.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-desired-slug">Desired workspace slug</Label>
                  <Input
                    id="wl-apply-desired-slug"
                    value={form.desiredSlug ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, desiredSlug: event.target.value }))}
                    placeholder="agency-north"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-apply-referred-by">Referred by</Label>
                  <Input
                    id="wl-apply-referred-by"
                    value={form.referredBy ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, referredBy: event.target.value }))}
                    placeholder="Internal team or partner name"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-apply-notes">Notes</Label>
                <Textarea
                  id="wl-apply-notes"
                  value={form.notes ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Tell us about your clients, expected volume, and what you want from the reseller workspace."
                  rows={6}
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? "Submitting application..." : "Submit partner application"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <p>Already approved and have credentials?</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/white-labeler/login">Go to white-label sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}