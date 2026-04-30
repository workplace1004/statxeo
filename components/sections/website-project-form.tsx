"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Facebook,
  Globe,
  HelpCircle,
  Image,
  Info,
  Instagram,
  Linkedin,
  Loader2,
  Palette,
  Plus,
  Rocket,
  Sparkles,
  Target,
  Upload,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  saveIntakePreferences,
  uploadMediaFile,
  triggerGeneration,
  type SiteProjectDetail,
  type MediaAsset,
  SiteProjectApiError,
} from "@/lib/statxeo/site-project-client"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  project: SiteProjectDetail
  onProjectUpdate: () => void
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepKey = "brand" | "content" | "media" | "social"

type StepDef = {
  key: StepKey
  label: string
  icon: React.FC<{ className?: string }>
  description: string
}

const STEPS: StepDef[] = [
  { key: "brand",   label: "Brand",   icon: Palette, description: "Visual identity & tone" },
  { key: "content", label: "Content", icon: Target,  description: "Audience & services" },
  { key: "media",   label: "Media",   icon: Image,   description: "Logo & photos" },
  { key: "social",  label: "Social",  icon: Globe,   description: "Links & domain" },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_TONES = [
  {
    value: "professional",
    label: "Professional",
    description: "Polished & authoritative",
    example: "\"Trusted by 500+ businesses across Texas.\"",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm & approachable",
    example: "\"We treat every home like it's our own.\"",
  },
  {
    value: "bold",
    label: "Bold",
    description: "Confident & direct",
    example: "\"No fluff. Just results.\"",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Clean & understated",
    example: "\"Quality work. Fair prices.\"",
  },
  {
    value: "luxury",
    label: "Luxury",
    description: "Premium & refined",
    example: "\"Exceptional craftsmanship for discerning clients.\"",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Fun & energetic",
    example: "\"We fix it fast so you can relax!\"",
  },
]

const CTA_OPTIONS = [
  { value: "call",    label: "Call Us",      icon: "📞", description: "Best for service businesses that close over the phone" },
  { value: "book",    label: "Book Online",  icon: "📅", description: "Best for appointment-based businesses" },
  { value: "quote",   label: "Get a Quote",  icon: "💬", description: "Best for project-based or variable-price services" },
  { value: "contact", label: "Contact Us",   icon: "✉️", description: "General-purpose — works for any business" },
  { value: "custom",  label: "Custom",       icon: "✏️", description: "Write your own call to action" },
]

// ─── Small helpers ────────────────────────────────────────────────────────────

function HelpTip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="inline size-3.5 cursor-help text-muted-foreground/60 hover:text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground/50" />
      {children}
    </p>
  )
}

function ExampleBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/40 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
      e.g. {text}
    </span>
  )
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  disabled,
  maxTags = 20,
  examples = [],
}: {
  tags: string[]
  onAdd: (value: string) => void
  onRemove: (idx: number) => void
  placeholder?: string
  disabled?: boolean
  maxTags?: number
  examples?: string[]
}) {
  const [input, setInput] = useState("")
  const atMax = tags.length >= maxTags

  const handleAdd = () => {
    const trimmed = input.trim()
    if (trimmed && !atMax && !tags.includes(trimmed)) {
      onAdd(trimmed)
      setInput("")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd() } }}
          disabled={disabled || atMax}
          placeholder={atMax ? `Max ${maxTags} reached` : placeholder}
          className="h-9 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !input.trim() || atMax}
          className="h-9 shrink-0 px-3"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Quick-add examples */}
      {examples.length > 0 && !atMax && !disabled && (
        <div className="flex flex-wrap gap-1.5">
          {examples.filter((ex) => !tags.includes(ex)).slice(0, 5).map((ex) => (
            <button
              key={ex}
              onClick={() => onAdd(ex)}
              className="rounded-md border border-dashed border-border/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
            >
              + {ex}
            </button>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1 pr-1 text-xs">
              {tag}
              {!disabled && (
                <button
                  onClick={() => onRemove(idx)}
                  className="ml-0.5 rounded-sm opacity-60 transition-opacity hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-right text-xs text-muted-foreground/50">{tags.length}/{maxTags}</p>
    </div>
  )
}

// ─── Color field ──────────────────────────────────────────────────────────────

function ColorField({
  id, label, value, onChange, disabled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <div
            className="size-9 rounded-md border-2 border-border shadow-sm transition-shadow hover:shadow-md"
            style={{ backgroundColor: value }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 font-mono text-sm uppercase"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── Asset row ────────────────────────────────────────────────────────────────

function AssetRow({ asset }: { asset: MediaAsset }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Image className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{asset.original_filename ?? "File"}</p>
        {asset.size_bytes && (
          <p className="text-xs text-muted-foreground">{(asset.size_bytes / 1024).toFixed(0)} KB</p>
        )}
      </div>
      <Badge variant="outline" className="shrink-0 text-xs capitalize">{asset.asset_type}</Badge>
    </div>
  )
}

// ─── Completion checklist ─────────────────────────────────────────────────────

type ChecklistItem = { label: string; done: boolean; required: boolean }

function CompletionChecklist({ items }: { items: ChecklistItem[] }) {
  const required = items.filter((i) => i.required)
  const optional = items.filter((i) => !i.required)
  const doneCount = required.filter((i) => i.done).length
  const allRequiredDone = doneCount === required.length

  return (
    <Card className={cn(
      "border transition-colors",
      allRequiredDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5",
    )}>
      <CardContent className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            {allRequiredDone ? "Ready to generate!" : "Complete required fields"}
          </p>
          <Badge variant={allRequiredDone ? "default" : "secondary"} className="text-xs">
            {doneCount}/{required.length} required
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {[...required, ...optional].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
              ) : item.required ? (
                <Circle className="size-3.5 shrink-0 text-amber-500" />
              ) : (
                <Circle className="size-3.5 shrink-0 text-muted-foreground/30" />
              )}
              <span className={cn(
                "text-xs",
                item.done ? "text-foreground" : item.required ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}>
                {item.label}
                {!item.required && <span className="ml-1 text-muted-foreground/50">(optional)</span>}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Step nav ─────────────────────────────────────────────────────────────────

function StepNav({
  steps,
  currentStep,
  completedSteps,
  onSelect,
}: {
  steps: StepDef[]
  currentStep: StepKey
  completedSteps: Set<StepKey>
  onSelect: (key: StepKey) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/50 bg-card/60 p-1">
      {steps.map((step, i) => {
        const isActive = step.key === currentStep
        const isDone = completedSteps.has(step.key)
        const Icon = step.icon
        return (
          <button
            key={step.key}
            onClick={() => onSelect(step.key)}
            className={cn(
              "relative flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <div className="relative shrink-0">
              <Icon className="size-4" />
              {isDone && !isActive && (
                <div className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-2 text-white" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-none">{step.label}</p>
              <p className={cn("mt-0.5 text-xs leading-none", isActive ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                {step.description}
              </p>
            </div>
            <span className="sm:hidden text-xs font-semibold">{step.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Brand step ───────────────────────────────────────────────────────────────

function BrandStep({
  brandTone, setBrandTone,
  primaryColor, setPrimaryColor,
  secondaryColor, setSecondaryColor,
  ctaPreference, setCtaPreference,
  customCta, setCustomCta,
  isEditable,
}: {
  brandTone: string; setBrandTone: (v: string) => void
  primaryColor: string; setPrimaryColor: (v: string) => void
  secondaryColor: string; setSecondaryColor: (v: string) => void
  ctaPreference: string; setCtaPreference: (v: string) => void
  customCta: string; setCustomCta: (v: string) => void
  isEditable: boolean
}) {
  return (
    <div className="flex flex-col gap-6">

      {/* Brand tone */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">
            Brand Tone <HelpTip>The overall personality of your website copy. Choose what best matches how you want customers to feel when they visit.</HelpTip>
          </Label>
          <FieldHint>This shapes every sentence the AI writes — headlines, descriptions, CTAs.</FieldHint>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BRAND_TONES.map((tone) => (
            <button
              key={tone.value}
              onClick={() => isEditable && setBrandTone(tone.value)}
              disabled={!isEditable}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition-all",
                brandTone === tone.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/50 bg-card/40 hover:border-border hover:bg-card/60",
                !isEditable && "cursor-not-allowed opacity-60",
              )}
            >
              <p className="text-sm font-semibold">{tone.label}</p>
              <p className="text-xs text-muted-foreground">{tone.description}</p>
              <p className="mt-1.5 text-xs italic text-muted-foreground/70">{tone.example}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">
            Brand Colors <HelpTip>Your primary color will be used for buttons, headings, and accents. Secondary is used for backgrounds and supporting elements.</HelpTip>
          </Label>
          <FieldHint>Use your existing brand colors if you have them. If not, pick colors that match your industry — blue for trust, green for growth, orange for energy.</FieldHint>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField id="primaryColor" label="Primary Color" value={primaryColor} onChange={setPrimaryColor} disabled={!isEditable} />
          <ColorField id="secondaryColor" label="Secondary Color" value={secondaryColor} onChange={setSecondaryColor} disabled={!isEditable} />
        </div>
        <div className="overflow-hidden rounded-lg border border-border/50" aria-label="Color preview">
          <div className="flex h-10">
            <div className="flex-1" style={{ backgroundColor: primaryColor }} />
            <div className="flex-1" style={{ backgroundColor: secondaryColor }} />
          </div>
          <div className="flex h-8 items-center justify-center gap-4 bg-card/40 px-3">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="font-mono text-xs text-muted-foreground">{primaryColor}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span className="font-mono text-xs text-muted-foreground">{secondaryColor}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">
            Primary Call to Action <HelpTip>This is the main button that appears on every page of your site. It tells visitors what to do next.</HelpTip>
          </Label>
          <FieldHint>Choose the action that best matches how customers contact or hire you.</FieldHint>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CTA_OPTIONS.map((cta) => (
            <button
              key={cta.value}
              onClick={() => isEditable && setCtaPreference(cta.value)}
              disabled={!isEditable}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-all",
                ctaPreference === cta.value
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/50 bg-card/40 hover:border-border hover:bg-card/60",
                !isEditable && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="mt-0.5 text-lg leading-none">{cta.icon}</span>
              <div>
                <p className="text-sm font-semibold">{cta.label}</p>
                <p className="text-xs text-muted-foreground">{cta.description}</p>
              </div>
            </button>
          ))}
        </div>
        {ctaPreference === "custom" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customCta" className="text-xs text-muted-foreground">Custom CTA text</Label>
            <Input
              id="customCta"
              value={customCta}
              onChange={(e) => setCustomCta(e.target.value)}
              disabled={!isEditable}
              placeholder='e.g. "Schedule a Free Estimate"'
              className="h-9 text-sm"
              maxLength={60}
            />
            <p className="text-right text-xs text-muted-foreground/50">{customCta.length}/60</p>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Content step ─────────────────────────────────────────────────────────────

function ContentStep({
  targetAudience, setTargetAudience,
  usps, setUsps,
  offeredServices, setOfferedServices,
  serviceAreas, setServiceAreas,
  isEditable, isCore, isTitan, pageCount,
}: {
  targetAudience: string; setTargetAudience: (v: string) => void
  usps: string[]; setUsps: (v: string[]) => void
  offeredServices: string[]; setOfferedServices: (v: string[]) => void
  serviceAreas: string[]; setServiceAreas: (v: string[]) => void
  isEditable: boolean; isCore: boolean; isTitan: boolean; pageCount: number
}) {
  const needsServices = isCore || isTitan

  return (
    <div className="flex flex-col gap-6">

      {/* Page count banner */}
      <Alert className="border-primary/20 bg-primary/5">
        <Sparkles className="size-4 text-primary" />
        <AlertDescription className="text-sm">
          Your <span className="font-semibold">{isCore ? "Core" : isTitan ? "Titan" : "Lander"}</span> package
          will generate <span className="font-semibold">{pageCount} page{pageCount !== 1 ? "s" : ""}</span>.
          {isTitan && offeredServices.length > 0 && (
            <> That includes {offeredServices.length} service page{offeredServices.length !== 1 ? "s" : ""}{serviceAreas.length > 0 ? ` and ${serviceAreas.length} city page${serviceAreas.length !== 1 ? "s" : ""}` : ""}.</>
          )}
        </AlertDescription>
      </Alert>

      {/* Target audience */}
      <div className="flex flex-col gap-2">
        <div>
          <Label htmlFor="targetAudience" className="text-sm font-semibold">
            Target Audience <HelpTip>Describe who your ideal customer is. The more specific, the better the AI can tailor the copy to speak directly to them.</HelpTip>
          </Label>
          <FieldHint>Include location, demographics, and what problem they're trying to solve.</FieldHint>
        </div>
        <Textarea
          id="targetAudience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          disabled={!isEditable}
          placeholder="e.g. Homeowners in the Dallas-Fort Worth area who need fast, reliable HVAC repair. Typically 30–60 years old, value licensed and insured contractors, and want transparent pricing."
          rows={3}
          className="resize-none text-sm"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <ExampleBadge text="Homeowners in Austin, TX" />
            <ExampleBadge text="Small business owners needing bookkeeping" />
          </div>
          <p className="shrink-0 text-xs text-muted-foreground/50">{targetAudience.length}/500</p>
        </div>
      </div>

      <Separator />

      {/* Unique selling points */}
      <div className="flex flex-col gap-2">
        <div>
          <Label className="text-sm font-semibold">
            Unique Selling Points <HelpTip>What makes your business different from competitors? These become trust-builders and differentiators throughout your site.</HelpTip>
          </Label>
          <FieldHint>Think: certifications, guarantees, speed, price, experience, awards. Add up to 10.</FieldHint>
        </div>
        <TagInput
          tags={usps}
          onAdd={(v) => setUsps([...usps, v])}
          onRemove={(i) => setUsps(usps.filter((_, idx) => idx !== i))}
          placeholder="Type a selling point and press Enter"
          disabled={!isEditable}
          maxTags={10}
          examples={[
            "Licensed & Insured",
            "Same-Day Service",
            "Free Estimates",
            "10-Year Warranty",
            "Family Owned",
            "24/7 Emergency",
            "No Hidden Fees",
            "5-Star Rated",
          ]}
        />
      </div>

      {needsServices && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <div>
              <Label className="text-sm font-semibold">
                Services You Offer
                <Badge variant="secondary" className="ml-2 text-xs">{isCore ? "Core" : "Titan"}</Badge>
                <HelpTip>
                  {isCore
                    ? "These populate your Services page. List each service separately so the AI can write focused descriptions for each one."
                    : "Each service gets its own dedicated SEO page with a unique URL like /services/ac-repair/. More services = more pages = more search traffic."}
                </HelpTip>
              </Label>
              <FieldHint>
                {isCore
                  ? "Be specific — \"AC Repair\" is better than \"HVAC.\" Add up to 12 services."
                  : `Each service becomes a separate page. You have ${offeredServices.length}/12 services added.`}
              </FieldHint>
            </div>
            <TagInput
              tags={offeredServices}
              onAdd={(v) => setOfferedServices([...offeredServices, v])}
              onRemove={(i) => setOfferedServices(offeredServices.filter((_, idx) => idx !== i))}
              placeholder="Type a service and press Enter"
              disabled={!isEditable}
              maxTags={12}
              examples={[
                "AC Repair",
                "Furnace Installation",
                "Duct Cleaning",
                "Thermostat Installation",
                "Emergency HVAC",
                "Seasonal Tune-Up",
                "Indoor Air Quality",
                "Heat Pump Service",
              ]}
            />
          </div>
        </>
      )}

      <Separator />

      {/* Service areas */}
      <div className="flex flex-col gap-2">
        <div>
          <Label className="text-sm font-semibold">
            Service Areas
            {isTitan && (
              <Badge variant="secondary" className="ml-2 text-xs">Titan — city pages</Badge>
            )}
            <HelpTip>
              {isTitan
                ? "Each city gets its own SEO-optimized page targeting local searches like \"AC repair in Plano TX\". Add the cities where you actively work."
                : "These cities appear in your site copy and help local customers know you serve their area."}
            </HelpTip>
          </Label>
          <FieldHint>
            {isTitan
              ? `Add cities where you want to rank in Google. Each city = 1 page. You have ${serviceAreas.length}/20 added.`
              : `List the cities or regions you serve (${serviceAreas.length}/20).`}
          </FieldHint>
        </div>
        <TagInput
          tags={serviceAreas}
          onAdd={(v) => setServiceAreas([...serviceAreas, v])}
          onRemove={(i) => setServiceAreas(serviceAreas.filter((_, idx) => idx !== i))}
          placeholder="Type a city and press Enter"
          disabled={!isEditable}
          maxTags={20}
          examples={["Dallas, TX", "Plano, TX", "Frisco, TX", "McKinney, TX", "Allen, TX", "Richardson, TX"]}
        />
      </div>

    </div>
  )
}

// ─── Media step ───────────────────────────────────────────────────────────────

function MediaStep({
  assets, setAssets,
  uploading, setUploading,
  uploadError, setUploadError,
  isEditable, projectId,
}: {
  assets: MediaAsset[]; setAssets: (v: MediaAsset[]) => void
  uploading: boolean; setUploading: (v: boolean) => void
  uploadError: string; setUploadError: (v: string) => void
  isEditable: boolean; projectId: string
}) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const logos = assets.filter((a) => a.asset_type === "logo")
  const photos = assets.filter((a) => a.asset_type === "photo")

  const handleFileUpload = useCallback(
    async (files: FileList | null, assetType: "logo" | "photo") => {
      if (!files || files.length === 0) return
      setUploading(true)
      setUploadError("")
      try {
        for (const file of Array.from(files)) {
          const asset = await uploadMediaFile(projectId, file, assetType)
          setAssets([...assets, asset])
        }
      } catch (err) {
        setUploadError(err instanceof SiteProjectApiError ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [projectId, assets, setAssets, setUploading, setUploadError],
  )

  return (
    <div className="flex flex-col gap-6">

      <Alert className="border-border/40 bg-muted/20">
        <Info className="size-4 text-muted-foreground" />
        <AlertDescription className="text-sm text-muted-foreground">
          Media is optional but strongly recommended. Sites with logos and photos convert significantly better than text-only sites.
        </AlertDescription>
      </Alert>

      {/* Logo */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">
            Business Logo <HelpTip>Your logo appears in the header and footer of every page. PNG with transparent background works best.</HelpTip>
          </Label>
          <FieldHint>PNG, JPG, SVG, or WebP. Recommended: at least 400px wide, transparent background.</FieldHint>
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, "logo")}
        />
        {logos.length > 0 ? (
          <div className="flex flex-col gap-2">
            {logos.map((logo) => <AssetRow key={logo.id} asset={logo} />)}
            {isEditable && (
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="gap-2 self-start">
                <Upload className="size-3.5" />Replace logo
              </Button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors",
              isEditable ? "cursor-pointer border-border/50 hover:border-primary/40 hover:bg-primary/5" : "border-border/30 opacity-60",
            )}
            onClick={() => isEditable && logoInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" /> : <Upload className="mb-2 size-6 text-muted-foreground" />}
            <p className="text-sm font-medium text-muted-foreground">{uploading ? "Uploading..." : "Click to upload logo"}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">PNG, JPG, SVG, WebP</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Photos */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">
            Business Photos <HelpTip>Photos of your team, work, or location. The AI will place them in relevant sections of your site.</HelpTip>
          </Label>
          <FieldHint>Up to 10 photos. JPG or PNG, at least 800px wide. Real photos outperform stock images.</FieldHint>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files, "photo")}
        />
        {photos.length > 0 && (
          <div className="flex flex-col gap-2">
            {photos.map((photo) => <AssetRow key={photo.id} asset={photo} />)}
          </div>
        )}
        {isEditable && photos.length < 10 && (
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 py-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
            onClick={() => photoInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mb-2 size-5 animate-spin text-muted-foreground" /> : <Image className="mb-2 size-5 text-muted-foreground" />}
            <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : `Add photos (${photos.length}/10)`}</p>
          </div>
        )}
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

    </div>
  )
}

// ─── Social step ──────────────────────────────────────────────────────────────

function SocialStep({
  domainPreference, setDomainPreference,
  facebook, setFacebook,
  instagram, setInstagram,
  linkedin, setLinkedin,
  googleBusiness, setGoogleBusiness,
  isEditable,
}: {
  domainPreference: string; setDomainPreference: (v: string) => void
  facebook: string; setFacebook: (v: string) => void
  instagram: string; setInstagram: (v: string) => void
  linkedin: string; setLinkedin: (v: string) => void
  googleBusiness: string; setGoogleBusiness: (v: string) => void
  isEditable: boolean
}) {
  return (
    <div className="flex flex-col gap-6">

      {/* Domain */}
      <div className="flex flex-col gap-2">
        <div>
          <Label htmlFor="domain" className="text-sm font-semibold">
            Preferred Domain <HelpTip>The web address you want for your site. If you already own a domain, enter it here. If not, we'll suggest one based on your business name.</HelpTip>
          </Label>
          <FieldHint>Don't include "https://" — just the domain name. Leave blank if you don't have one yet.</FieldHint>
        </div>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="domain"
            value={domainPreference}
            onChange={(e) => setDomainPreference(e.target.value)}
            disabled={!isEditable}
            placeholder="yourbusiness.com"
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          <ExampleBadge text="torreshomecomfort.com" />
          <ExampleBadge text="dallasplumbingpros.com" />
        </div>
      </div>

      <Separator />

      {/* Social links */}
      <div className="flex flex-col gap-3">
        <div>
          <Label className="text-sm font-semibold">Social Media Profiles</Label>
          <FieldHint>All fields are optional. Social links appear in your site footer and help customers find and trust your business.</FieldHint>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { id: "facebook", label: "Facebook", icon: Facebook, iconClass: "text-blue-500", value: facebook, set: setFacebook, placeholder: "https://facebook.com/yourbusiness" },
            { id: "instagram", label: "Instagram", icon: Instagram, iconClass: "text-pink-500", value: instagram, set: setInstagram, placeholder: "https://instagram.com/yourbusiness" },
            { id: "linkedin", label: "LinkedIn", icon: Linkedin, iconClass: "text-blue-600", value: linkedin, set: setLinkedin, placeholder: "https://linkedin.com/company/..." },
            { id: "googleBiz", label: "Google Business", icon: Globe, iconClass: "text-red-500", value: googleBusiness, set: setGoogleBusiness, placeholder: "https://g.page/yourbusiness" },
          ].map(({ id, label, icon: Icon, iconClass, value, set, placeholder }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <Label htmlFor={id} className="flex items-center gap-1.5 text-sm">
                <Icon className={cn("size-3.5", iconClass)} />
                {label}
              </Label>
              <Input
                id={id}
                value={value}
                onChange={(e) => set(e.target.value)}
                disabled={!isEditable}
                placeholder={placeholder}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function WebsiteProjectForm({ project, onProjectUpdate }: Props) {
  const [currentStep, setCurrentStep] = useState<StepKey>("brand")

  // Brand state
  const [brandTone, setBrandTone] = useState(project.brand_tone ?? "")
  const [primaryColor, setPrimaryColor] = useState(project.primary_color ?? "#10b981")
  const [secondaryColor, setSecondaryColor] = useState(project.secondary_color ?? "#1a1a1f")
  const [ctaPreference, setCtaPreference] = useState(project.cta_preference ?? "")
  const [customCta, setCustomCta] = useState("")

  // Content state
  const [targetAudience, setTargetAudience] = useState(project.target_audience ?? "")
  const [usps, setUsps] = useState<string[]>(project.unique_selling_points ?? [])
  const [offeredServices, setOfferedServices] = useState<string[]>(project.offered_services ?? [])
  const [serviceAreas, setServiceAreas] = useState<string[]>(project.service_areas ?? [])

  // Social state
  const [domainPreference, setDomainPreference] = useState(project.domain_name ?? "")
  const [facebook, setFacebook] = useState((project.social_links as Record<string, string> | null)?.facebook ?? "")
  const [instagram, setInstagram] = useState((project.social_links as Record<string, string> | null)?.instagram ?? "")
  const [linkedin, setLinkedin] = useState((project.social_links as Record<string, string> | null)?.linkedin ?? "")
  const [googleBusiness, setGoogleBusiness] = useState((project.social_links as Record<string, string> | null)?.googleBusiness ?? "")

  // Media state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [assets, setAssets] = useState<MediaAsset[]>(project.statxeo_site_media_assets ?? [])

  // Save / generate state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState("")

  const isCore = project.package_tier === "statxeo_core"
  const isTitan = project.package_tier === "statxeo_titan"
  const pageCount = isCore ? 4 : isTitan ? 4 + offeredServices.length + serviceAreas.length : 1
  const isEditable = ["awaiting_preferences", "assets_pending", "changes_requested", "failed"].includes(project.status)
  const canGenerate = ["ready_for_generation", "assets_pending", "changes_requested", "failed"].includes(project.status)

  // Completion checklist
  const checklistItems: ChecklistItem[] = [
    { label: "Brand tone selected", done: !!brandTone, required: true },
    { label: "Primary color set", done: !!primaryColor, required: true },
    { label: "Call to action chosen", done: !!ctaPreference, required: true },
    { label: "Target audience described", done: targetAudience.trim().length > 20, required: true },
    ...(isCore || isTitan ? [{ label: "Services listed (min 1)", done: offeredServices.length > 0, required: true }] : []),
    { label: "Unique selling points added", done: usps.length > 0, required: false },
    { label: "Service areas added", done: serviceAreas.length > 0, required: false },
    { label: "Logo uploaded", done: assets.some((a) => a.asset_type === "logo"), required: false },
    { label: "Social links added", done: !!(facebook || instagram || linkedin || googleBusiness), required: false },
  ]

  const allRequiredDone = checklistItems.filter((i) => i.required).every((i) => i.done)

  // Completed steps for nav indicator
  const completedSteps = new Set<StepKey>()
  if (brandTone && ctaPreference) completedSteps.add("brand")
  if (targetAudience.trim().length > 20) completedSteps.add("content")
  if (assets.length > 0) completedSteps.add("media")
  if (domainPreference || facebook || instagram || linkedin || googleBusiness) completedSteps.add("social")

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep)

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError("")
    setSaveSuccess(false)
    try {
      const socialLinks: Record<string, string> = {}
      if (facebook) socialLinks.facebook = facebook
      if (instagram) socialLinks.instagram = instagram
      if (linkedin) socialLinks.linkedin = linkedin
      if (googleBusiness) socialLinks.googleBusiness = googleBusiness

      await saveIntakePreferences(project.id, {
        brandTone: brandTone || undefined,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        targetAudience: targetAudience || undefined,
        uniqueSellingPoints: usps.length > 0 ? usps : undefined,
        offeredServices: offeredServices.length > 0 ? offeredServices : undefined,
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : undefined,
        ctaPreference: ctaPreference === "custom" ? customCta || "custom" : ctaPreference || undefined,
        domainPreference: domainPreference || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      })

      setSaveSuccess(true)
      onProjectUpdate()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof SiteProjectApiError ? err.message : "Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }, [
    project.id, brandTone, primaryColor, secondaryColor, targetAudience,
    usps, offeredServices, serviceAreas, ctaPreference, customCta, domainPreference,
    facebook, instagram, linkedin, googleBusiness, onProjectUpdate,
  ])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGenerateError("")
    try {
      await triggerGeneration(project.id)
      onProjectUpdate()
    } catch (err) {
      setGenerateError(err instanceof SiteProjectApiError ? err.message : "Failed to start generation")
    } finally {
      setGenerating(false)
    }
  }, [project.id, onProjectUpdate])

  return (
    <div className="flex flex-col gap-4">

      {/* Step navigation */}
      <StepNav
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onSelect={setCurrentStep}
      />

      {/* Step content */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            {(() => { const Icon = STEPS[stepIndex].icon; return <Icon className="size-4 text-primary" /> })()}
            {STEPS[stepIndex].label}
          </CardTitle>
          <CardDescription>{STEPS[stepIndex].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === "brand" && (
            <BrandStep
              brandTone={brandTone} setBrandTone={setBrandTone}
              primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
              secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
              ctaPreference={ctaPreference} setCtaPreference={setCtaPreference}
              customCta={customCta} setCustomCta={setCustomCta}
              isEditable={isEditable}
            />
          )}
          {currentStep === "content" && (
            <ContentStep
              targetAudience={targetAudience} setTargetAudience={setTargetAudience}
              usps={usps} setUsps={setUsps}
              offeredServices={offeredServices} setOfferedServices={setOfferedServices}
              serviceAreas={serviceAreas} setServiceAreas={setServiceAreas}
              isEditable={isEditable} isCore={isCore} isTitan={isTitan} pageCount={pageCount}
            />
          )}
          {currentStep === "media" && (
            <MediaStep
              assets={assets} setAssets={setAssets}
              uploading={uploading} setUploading={setUploading}
              uploadError={uploadError} setUploadError={setUploadError}
              isEditable={isEditable} projectId={project.id}
            />
          )}
          {currentStep === "social" && (
            <SocialStep
              domainPreference={domainPreference} setDomainPreference={setDomainPreference}
              facebook={facebook} setFacebook={setFacebook}
              instagram={instagram} setInstagram={setInstagram}
              linkedin={linkedin} setLinkedin={setLinkedin}
              googleBusiness={googleBusiness} setGoogleBusiness={setGoogleBusiness}
              isEditable={isEditable}
            />
          )}
        </CardContent>
      </Card>

      {/* Step prev/next nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(STEPS[stepIndex - 1].key)}
          disabled={stepIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">{stepIndex + 1} / {STEPS.length}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep(STEPS[stepIndex + 1].key)}
          disabled={stepIndex === STEPS.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {/* Completion checklist */}
      <CompletionChecklist items={checklistItems} />

      {/* Action bar */}
      <Card className="border-border/50 bg-card/60">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {isEditable && (
              <Button onClick={handleSave} disabled={saving} variant="outline" size="sm" className="gap-2">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : saveSuccess ? <Check className="size-3.5 text-emerald-500" /> : <Sparkles className="size-3.5" />}
                {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Progress"}
              </Button>
            )}
            {canGenerate && (
              <Button
                onClick={handleGenerate}
                disabled={generating || !allRequiredDone}
                size="sm"
                className="gap-2"
                title={!allRequiredDone ? "Complete all required fields before generating" : undefined}
              >
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                {generating ? "Starting..." : "Generate Website"}
                {!generating && <ChevronRight className="size-3.5" />}
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {!allRequiredDone && canGenerate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Complete all required fields to generate</p>
            )}
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            {generateError && <p className="text-xs text-destructive">{generateError}</p>}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
