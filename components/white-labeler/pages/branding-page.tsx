"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useWhiteLabelerPortal } from "@/components/white-labeler/portal-context"
import { cn } from "@/lib/utils"

function ScoreRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        className="stroke-primary transition-all duration-300"
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WhiteLabelerBrandingPage() {
  const {
    branding,
    brandingLoading,
    brandingError,
    brandingMutationError,
    canManageBranding,
    brandingForm,
    setBrandingForm,
    isSavingBranding,
    handleSaveBranding,
    newDomainInput,
    setNewDomainInput,
    isAddingDomain,
    removingDomainId,
    handleAddDomain,
    handleRemoveDomain,
  } = useWhiteLabelerPortal()

  const [idOpen, setIdOpen] = useState(true)
  const [colorOpen, setColorOpen] = useState(true)
  const [contactOpen, setContactOpen] = useState(true)

  const isDirty = useMemo(() => {
    if (!branding) return false
    return (
      brandingForm.brandName !== (branding.brand_name ?? "") ||
      brandingForm.primaryColor !== (branding.primary_color ?? "") ||
      brandingForm.secondaryColor !== (branding.secondary_color ?? "") ||
      brandingForm.logoUrl !== (branding.logo_url ?? "") ||
      brandingForm.supportEmail !== (branding.support_email ?? "") ||
      brandingForm.supportPhone !== (branding.support_phone ?? "")
    )
  }, [branding, brandingForm])

  useEffect(() => {
    if (!isDirty) return
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [isDirty])

  const score = branding?.brand_score_percent ?? 0

  return (
    <div className="space-y-6 pb-24 md:pb-28">
      <div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Workspace</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Branding</h2>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          How your white-label experience looks to end customers. Changes apply to your hosted surfaces.
        </p>
      </div>

      {brandingLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : brandingError ? (
        <p className="text-destructive text-sm">{brandingError}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Quick read of your current public-facing brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="rounded-xl border border-border/60 p-4"
                style={{
                  background: `linear-gradient(135deg, ${brandingForm.primaryColor || "#0f172a"}22, ${brandingForm.secondaryColor || "#334155"}18)`,
                }}
              >
                <p className="text-lg font-semibold">{brandingForm.brandName || "Your brand name"}</p>
                <p className="text-muted-foreground text-sm">Support: {brandingForm.supportEmail || "email@…"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="h-9 w-14 rounded-md border" style={{ backgroundColor: brandingForm.primaryColor || "#64748b" }} />
                <span className="h-9 w-14 rounded-md border" style={{ backgroundColor: brandingForm.secondaryColor || "#94a3b8" }} />
              </div>
              {brandingForm.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandingForm.logoUrl} alt="" className="max-h-16 object-contain" />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center gap-4 space-y-0">
              <ScoreRing percent={Math.min(100, Math.max(0, score))} />
              <div>
                <CardTitle>Brand readiness</CardTitle>
                <CardDescription>Completeness for checkout experience requirements.</CardDescription>
                <Progress value={score} className="mt-2 h-2" />
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">{score}%</p>
              </div>
            </CardHeader>
            <CardContent>
              {Array.isArray(branding?.brand_checklist) && branding.brand_checklist.length > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ul className="text-sm space-y-1.5">
                      {branding.brand_checklist.slice(0, 3).map((item) => (
                        <li key={item.key} className="flex items-center gap-2">
                          {item.complete ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden />
                          ) : (
                            <Circle className="text-muted-foreground size-4 shrink-0" aria-hidden />
                          )}
                          <span className={item.complete ? "" : "text-muted-foreground"}>{item.label}</span>
                        </li>
                      ))}
                      {branding.brand_checklist.length > 3 ? (
                        <li className="text-muted-foreground pl-6">+{branding.brand_checklist.length - 3} more</li>
                      ) : null}
                    </ul>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <ul className="text-xs space-y-1">
                      {branding.brand_checklist.map((item) => (
                        <li key={item.key}>{item.label}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {canManageBranding ? (
        <div className="space-y-4">
          <Collapsible open={idOpen} onOpenChange={setIdOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="text-lg">Identity & assets</CardTitle>
                  <CardDescription>Name, logo, and visual anchors.</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-name">Brand name</Label>
                    <Input
                      id="b-name"
                      value={brandingForm.brandName}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, brandName: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="b-logo">Logo URL (https)</Label>
                    <Input
                      id="b-logo"
                      type="url"
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, logoUrl: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={colorOpen} onOpenChange={setColorOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="text-lg">Colors</CardTitle>
                  <CardDescription>Primary and secondary brand colors (hex).</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-pri">Primary color</Label>
                    <Input
                      id="b-pri"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, primaryColor: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-sec">Secondary color</Label>
                    <Input
                      id="b-sec"
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, secondaryColor: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={contactOpen} onOpenChange={setContactOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <CardTitle className="text-lg">Contact</CardTitle>
                  <CardDescription>Support touchpoints on branded surfaces.</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-mail">Support email</Label>
                    <Input
                      id="b-mail"
                      type="email"
                      value={brandingForm.supportEmail}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, supportEmail: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="b-phone">Support phone</Label>
                    <Input
                      id="b-phone"
                      type="tel"
                      value={brandingForm.supportPhone}
                      onChange={(e) => setBrandingForm((s) => ({ ...s, supportPhone: e.target.value }))}
                      disabled={isSavingBranding}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      ) : branding ? (
        <div className="text-muted-foreground text-sm">You can view brand settings; only admins can edit.</div>
      ) : null}

      {branding && canManageBranding ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom domains</CardTitle>
            <CardDescription>Connect hostnames and complete DNS verification in your provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="b-dom">Add domain</Label>
                <Input
                  id="b-dom"
                  placeholder="app.yourco.com"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  disabled={isAddingDomain}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleAddDomain()
                  }}
                />
              </div>
              <Button type="button" onClick={handleAddDomain} disabled={isAddingDomain || !newDomainInput.trim()}>
                {isAddingDomain ? "Adding…" : "Add"}
              </Button>
            </div>
            {!branding.domains.length ? (
              <p className="text-muted-foreground text-sm">No domains yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branding.domains.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.domain}</TableCell>
                      <TableCell className="capitalize">{d.verification_status}</TableCell>
                      <TableCell>{d.is_primary ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRemoveDomain(d.id)}
                          disabled={removingDomainId === d.id}
                        >
                          {removingDomainId === d.id ? "Removing…" : "Remove"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {brandingMutationError ? <p className="text-destructive text-sm">{brandingMutationError}</p> : null}

      {canManageBranding && isDirty ? (
        <div
          className={cn(
            "bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none",
          )}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">You have unsaved brand changes.</p>
            <Button type="button" onClick={handleSaveBranding} disabled={isSavingBranding}>
              {isSavingBranding ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
