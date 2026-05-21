"use client";

import {useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button, Card, Chip, Input, Label, Separator, TextArea, TextField} from "@heroui/react";
import {ArrowLeft, ArrowRight, Check, Plus, X} from "lucide-react";

import {cn} from "@/lib/utils";
import {submitIntake} from "@/server/actions/site-projects";

// ─── Types ─────────────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — Branding
  brandTone: string;
  primaryColor: string;
  secondaryColor: string;
  // Step 2 — About
  targetAudience: string;
  uniqueSellingPoints: string[];
  // Step 3 — Services & Areas
  offeredServices: string[];
  serviceAreas: string[];
  // Step 4 — CTA
  ctaPreference: string;
  ctaCustomText: string;
  // Step 5 — Hours & Social
  mondayHours: string;
  tuesdayHours: string;
  wednesdayHours: string;
  thursdayHours: string;
  fridayHours: string;
  saturdayHours: string;
  sundayHours: string;
  hoursNotes: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  yelp: string;
  googleBusiness: string;
}

const DEFAULT_FORM: FormState = {
  brandTone: "",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  targetAudience: "",
  uniqueSellingPoints: [],
  offeredServices: [],
  serviceAreas: [],
  ctaPreference: "",
  ctaCustomText: "",
  mondayHours: "",
  tuesdayHours: "",
  wednesdayHours: "",
  thursdayHours: "",
  fridayHours: "",
  saturdayHours: "",
  sundayHours: "",
  hoursNotes: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  twitter: "",
  youtube: "",
  tiktok: "",
  yelp: "",
  googleBusiness: "",
};

// ─── Step metadata ─────────────────────────────────────────────────────────

const STEPS = [
  {id: "branding", title: "Branding"},
  {id: "about", title: "About"},
  {id: "services", title: "Services"},
  {id: "cta", title: "Call to Action"},
  {id: "hours", title: "Hours & Social"},
  {id: "review", title: "Review"},
] as const;

// ─── Props ─────────────────────────────────────────────────────────────────

export interface CustomerWebsiteSetupPageProps {
  projectId: string;
  packageTier: string;
  businessName: string | null;
}

// ─── Main component ────────────────────────────────────────────────────────

export function CustomerWebsiteSetupPage({
  projectId,
  packageTier,
  businessName,
}: CustomerWebsiteSetupPageProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isTitan = packageTier === "statxeo_titan";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({...prev, [key]: value}));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const businessHours: Record<string, string> = {};
      if (form.mondayHours) businessHours.monday = form.mondayHours;
      if (form.tuesdayHours) businessHours.tuesday = form.tuesdayHours;
      if (form.wednesdayHours) businessHours.wednesday = form.wednesdayHours;
      if (form.thursdayHours) businessHours.thursday = form.thursdayHours;
      if (form.fridayHours) businessHours.friday = form.fridayHours;
      if (form.saturdayHours) businessHours.saturday = form.saturdayHours;
      if (form.sundayHours) businessHours.sunday = form.sundayHours;
      if (form.hoursNotes) businessHours.notes = form.hoursNotes;

      const socialLinks: Record<string, string> = {};
      for (const [k, v] of [
        ["facebook", form.facebook],
        ["instagram", form.instagram],
        ["linkedin", form.linkedin],
        ["twitter", form.twitter],
        ["youtube", form.youtube],
        ["tiktok", form.tiktok],
        ["yelp", form.yelp],
        ["googleBusiness", form.googleBusiness],
      ] as const) {
        if (v) socialLinks[k] = v;
      }

      const payload: Record<string, unknown> = {};
      if (form.brandTone) payload.brandTone = form.brandTone;
      if (/^#[0-9a-fA-F]{6}$/.test(form.primaryColor)) payload.primaryColor = form.primaryColor;
      if (/^#[0-9a-fA-F]{6}$/.test(form.secondaryColor))
        payload.secondaryColor = form.secondaryColor;
      if (form.targetAudience.trim()) payload.targetAudience = form.targetAudience.trim();
      if (form.uniqueSellingPoints.length > 0)
        payload.uniqueSellingPoints = form.uniqueSellingPoints;
      if (form.offeredServices.length > 0) payload.offeredServices = form.offeredServices;
      if (form.serviceAreas.length > 0) payload.serviceAreas = form.serviceAreas;
      if (form.ctaPreference) payload.ctaPreference = form.ctaPreference;
      if (form.ctaPreference === "custom" && form.ctaCustomText.trim())
        payload.ctaCustomText = form.ctaCustomText.trim();
      if (Object.keys(businessHours).length > 0) payload.businessHours = businessHours;
      if (Object.keys(socialLinks).length > 0) payload.socialLinks = socialLinks;

      const result = await submitIntake(projectId, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/customer/website");
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 pb-12 pt-4">
      {/* Header */}
      <div>
        <p className="text-muted text-sm">
          {businessName ? `Setting up: ${businessName}` : "Set up your website"}
        </p>
        <h1 className="text-xl font-semibold">Build your website</h1>
        <p className="text-muted mt-1 text-sm">
          Tell us about your business so we can generate the perfect site. All fields are optional —
          the more you fill in, the better.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} steps={STEPS} />

      {/* Step content */}
      {step === 0 && <BrandingStep form={form} onChange={set} />}
      {step === 1 && <AboutStep form={form} onChange={set} />}
      {step === 2 && <ServicesStep form={form} isTitan={isTitan} onChange={set} />}
      {step === 3 && <CtaStep form={form} onChange={set} />}
      {step === 4 && <HoursSocialStep form={form} onChange={set} />}
      {step === 5 && (
        <ReviewStep
          businessName={businessName}
          error={error}
          form={form}
          isTitan={isTitan}
          packageTier={packageTier}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          isDisabled={step === 0 || isPending}
          variant="tertiary"
          onPress={() => setStep((s) => s - 1)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onPress={() => setStep((s) => s + 1)}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button isDisabled={isPending} onPress={handleSubmit}>
            {isPending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="size-4" />
            )}
            Generate my website
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: typeof STEPS;
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                  ? "border-primary border-2 bg-transparent text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < currentStep ? <Check className="size-3" /> : i + 1}
          </div>
          <span
            className={cn(
              "text-xs",
              i === currentStep ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {s.title}
          </span>
          {i < steps.length - 1 && (
            <div className={cn("mx-1 h-px w-6 shrink-0", i < currentStep ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Branding ──────────────────────────────────────────────────────

const BRAND_TONES = [
  {id: "professional", label: "Professional", desc: "Formal, trustworthy, expert"},
  {id: "friendly", label: "Friendly", desc: "Warm, approachable, helpful"},
  {id: "bold", label: "Bold", desc: "Confident, direct, assertive"},
  {id: "minimal", label: "Minimal", desc: "Clean, concise, understated"},
  {id: "luxury", label: "Luxury", desc: "Premium, refined, exclusive"},
  {id: "playful", label: "Playful", desc: "Fun, energetic, creative"},
] as const;

function BrandingStep({
  form,
  onChange,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Card className="rounded-xl">
      <Card.Header>
        <Card.Title>Brand tone & colors</Card.Title>
        <Card.Description>Choose the voice and visual style for your website.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        {/* Brand tone */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Voice & tone</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BRAND_TONES.map((t) => (
              <button
                key={t.id}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
                  form.brandTone === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50",
                )}
                type="button"
                onClick={() =>
                  onChange("brandTone", form.brandTone === t.id ? "" : t.id)
                }
              >
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-muted-foreground text-xs">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium">Brand colors</span>
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Primary color"
              value={form.primaryColor}
              onChange={(v) => onChange("primaryColor", v)}
            />
            <ColorField
              label="Secondary color"
              value={form.secondaryColor}
              onChange={(v) => onChange("secondaryColor", v)}
            />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border">
          <span
            className="absolute inset-0"
            style={{backgroundColor: isValid ? value : "#cccccc"}}
          />
          <input
            className="absolute inset-0 opacity-0"
            type="color"
            value={isValid ? value : "#cccccc"}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <TextField
          className="flex-1"
          isInvalid={value.length > 0 && !isValid}
          value={value}
          onChange={onChange}
        >
          <Label className="sr-only">{label}</Label>
          <Input placeholder="#000000" />
        </TextField>
      </div>
    </div>
  );
}

// ─── Step 2: About ─────────────────────────────────────────────────────────

function AboutStep({
  form,
  onChange,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Card className="rounded-xl">
      <Card.Header>
        <Card.Title>About your business</Card.Title>
        <Card.Description>Help the AI understand who you serve and what sets you apart.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Target audience</span>
          <p className="text-muted-foreground text-xs">Who are your ideal customers?</p>
          <TextField value={form.targetAudience} onChange={(v) => onChange("targetAudience", v)}>
            <Label className="sr-only">Target audience</Label>
            <TextArea
              className="min-h-24 resize-y"
              fullWidth
              maxLength={500}
              placeholder="e.g. Homeowners in the Dallas metro area with aging HVAC systems..."
            />
          </TextField>
          <span className="text-muted-foreground self-end text-xs">
            {form.targetAudience.length}/500
          </span>
        </div>

        <Separator />

        <TagInput
          description="What makes your business different? Each point becomes a key message."
          items={form.uniqueSellingPoints}
          label="Unique selling points"
          maxItems={10}
          maxLength={200}
          placeholder="e.g. Same-day service available"
          onChange={(v) => onChange("uniqueSellingPoints", v)}
        />
      </Card.Content>
    </Card>
  );
}

// ─── Step 3: Services & Areas ──────────────────────────────────────────────

function ServicesStep({
  form,
  isTitan,
  onChange,
}: {
  form: FormState;
  isTitan: boolean;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Card className="rounded-xl">
      <Card.Header>
        <Card.Title>Services & service areas</Card.Title>
        <Card.Description>
          {isTitan
            ? "Titan plan: each service and city generates its own dedicated page."
            : "List what you offer and where you work."}
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-6">
        <TagInput
          description={
            isTitan
              ? "Up to 12 services — each becomes a full service page."
              : "The services your business provides."
          }
          items={form.offeredServices}
          label="Services offered"
          maxItems={12}
          maxLength={120}
          placeholder="e.g. AC Installation"
          onChange={(v) => onChange("offeredServices", v)}
        />

        <Separator />

        <TagInput
          description={
            isTitan
              ? "Up to 20 cities — each becomes a hyper-local landing page."
              : "Cities or neighborhoods you serve."
          }
          items={form.serviceAreas}
          label="Service areas"
          maxItems={20}
          maxLength={100}
          placeholder="e.g. Dallas, TX"
          onChange={(v) => onChange("serviceAreas", v)}
        />
      </Card.Content>
    </Card>
  );
}

// ─── Step 4: CTA ──────────────────────────────────────────────────────────

const CTA_OPTIONS = [
  {id: "call", label: "Call us", desc: "Phone-first — best for local trades"},
  {id: "book", label: "Book appointment", desc: "Scheduling-first"},
  {id: "quote", label: "Get a quote", desc: "Lead capture for estimates"},
  {id: "contact", label: "Contact us", desc: "General inquiry form"},
  {id: "custom", label: "Custom", desc: "Write your own CTA text"},
] as const;

function CtaStep({
  form,
  onChange,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <Card className="rounded-xl">
      <Card.Header>
        <Card.Title>Primary call to action</Card.Title>
        <Card.Description>What do you want visitors to do when they land on your site?</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CTA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
                form.ctaPreference === opt.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50",
              )}
              type="button"
              onClick={() =>
                onChange("ctaPreference", form.ctaPreference === opt.id ? "" : opt.id)
              }
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-muted-foreground text-xs">{opt.desc}</span>
            </button>
          ))}
        </div>

        {form.ctaPreference === "custom" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Custom CTA text</span>
            <TextField
              maxLength={50}
              value={form.ctaCustomText}
              onChange={(v) => onChange("ctaCustomText", v)}
            >
              <Label className="sr-only">Custom CTA text</Label>
              <Input fullWidth maxLength={50} placeholder="e.g. Schedule a free inspection" />
            </TextField>
            <span className="text-muted-foreground self-end text-xs">
              {form.ctaCustomText.length}/50
            </span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Step 5: Hours & Social ────────────────────────────────────────────────

const DAYS: {key: keyof FormState; label: string}[] = [
  {key: "mondayHours", label: "Monday"},
  {key: "tuesdayHours", label: "Tuesday"},
  {key: "wednesdayHours", label: "Wednesday"},
  {key: "thursdayHours", label: "Thursday"},
  {key: "fridayHours", label: "Friday"},
  {key: "saturdayHours", label: "Saturday"},
  {key: "sundayHours", label: "Sunday"},
];

const SOCIAL_FIELDS: {key: keyof FormState; label: string; placeholder: string}[] = [
  {key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourbusiness"},
  {key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourbusiness"},
  {key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourbusiness"},
  {key: "twitter", label: "X / Twitter", placeholder: "https://x.com/yourbusiness"},
  {key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourbusiness"},
  {key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourbusiness"},
  {key: "yelp", label: "Yelp", placeholder: "https://yelp.com/biz/yourbusiness"},
  {
    key: "googleBusiness",
    label: "Google Business",
    placeholder: "https://g.page/yourbusiness",
  },
];

function HoursSocialStep({
  form,
  onChange,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Hours */}
      <Card className="rounded-xl">
        <Card.Header>
          <Card.Title>Business hours</Card.Title>
          <Card.Description>Used in your contact page and schema markup.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          {DAYS.map((d) => (
            <div key={d.key} className="grid grid-cols-[120px_1fr] items-center gap-3">
              <span className="text-sm">{d.label}</span>
              <TextField
                value={form[d.key] as string}
                onChange={(v) => onChange(d.key, v)}
              >
                <Label className="sr-only">{d.label}</Label>
                <Input fullWidth placeholder="9am – 5pm or Closed" />
              </TextField>
            </div>
          ))}
          <div className="mt-1">
            <TextField value={form.hoursNotes} onChange={(v) => onChange("hoursNotes", v)}>
              <Label className="text-muted-foreground text-xs">Notes (optional)</Label>
              <Input fullWidth placeholder="e.g. Holiday hours may vary" />
            </TextField>
          </div>
        </Card.Content>
      </Card>

      {/* Social */}
      <Card className="rounded-xl">
        <Card.Header>
          <Card.Title>Social links</Card.Title>
          <Card.Description>Linked in your site footer and contact page.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          {SOCIAL_FIELDS.map((f) => (
            <div key={f.key} className="grid grid-cols-[120px_1fr] items-center gap-3">
              <span className="text-sm">{f.label}</span>
              <TextField
                type="url"
                value={form[f.key] as string}
                onChange={(v) => onChange(f.key, v)}
              >
                <Label className="sr-only">{f.label}</Label>
                <Input fullWidth placeholder={f.placeholder} />
              </TextField>
            </div>
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}

// ─── Step 6: Review ────────────────────────────────────────────────────────

function ReviewStep({
  form,
  businessName,
  packageTier,
  isTitan,
  error,
}: {
  form: FormState;
  businessName: string | null;
  packageTier: string;
  isTitan: boolean;
  error: string | null;
}) {
  const tierLabel: Record<string, string> = {
    statxeo_lander: "Lander (1 page)",
    statxeo_core: "Core (4 pages)",
    statxeo_titan: "Titan (4 + dynamic pages)",
  };

  const rows: {label: string; value: string | null}[] = [
    {label: "Business", value: businessName},
    {label: "Package", value: tierLabel[packageTier] ?? packageTier},
    {label: "Brand tone", value: form.brandTone || null},
    {label: "Primary color", value: form.primaryColor},
    {label: "Secondary color", value: form.secondaryColor},
    {
      label: "Target audience",
      value: form.targetAudience.trim() || null,
    },
    {
      label: "Selling points",
      value:
        form.uniqueSellingPoints.length > 0
          ? form.uniqueSellingPoints.join(", ")
          : null,
    },
    {
      label: "Services",
      value: form.offeredServices.length > 0 ? form.offeredServices.join(", ") : null,
    },
    {
      label: "Service areas",
      value: form.serviceAreas.length > 0 ? form.serviceAreas.join(", ") : null,
    },
    {label: "CTA", value: form.ctaPreference || null},
    {
      label: "Custom CTA",
      value: form.ctaPreference === "custom" ? form.ctaCustomText : null,
    },
  ];

  const hasHours = [
    form.mondayHours,
    form.tuesdayHours,
    form.wednesdayHours,
    form.thursdayHours,
    form.fridayHours,
    form.saturdayHours,
    form.sundayHours,
  ].some(Boolean);

  const hasSocial = [
    form.facebook,
    form.instagram,
    form.linkedin,
    form.twitter,
    form.youtube,
    form.tiktok,
    form.yelp,
    form.googleBusiness,
  ].some(Boolean);

  return (
    <Card className="rounded-xl">
      <Card.Header>
        <Card.Title>Review & generate</Card.Title>
        <Card.Description>
          Check your inputs below, then hit Generate. You can update preferences later.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        {rows
          .filter((r) => r.value)
          .map((r) => (
            <div key={r.label} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="break-words">{r.value}</span>
            </div>
          ))}
        {hasHours && (
          <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">Hours</span>
            <span>Configured</span>
          </div>
        )}
        {hasSocial && (
          <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-muted-foreground">Social links</span>
            <span>Configured</span>
          </div>
        )}
        {isTitan && (
          <p className="text-muted-foreground mt-2 text-xs">
            Titan: {form.offeredServices.length} service{form.offeredServices.length !== 1 ? "s" : ""} +{" "}
            {form.serviceAreas.length} cit{form.serviceAreas.length !== 1 ? "ies" : "y"} will each
            generate a dedicated page.
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Tag input ─────────────────────────────────────────────────────────────

function TagInput({
  label,
  description,
  items,
  onChange,
  maxItems,
  maxLength,
  placeholder,
}: {
  label: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  maxItems: number;
  maxLength: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add() {
    const trimmed = draft.trim().slice(0, maxLength);
    if (!trimmed || items.includes(trimmed) || items.length >= maxItems) return;
    onChange([...items, trimmed]);
    setDraft("");
    inputRef.current?.focus();
  }

  function remove(item: string) {
    onChange(items.filter((i) => i !== item));
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      <div className="flex gap-2">
        <TextField
          className="flex-1"
          value={draft}
          onChange={setDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        >
          <Label className="sr-only">{label}</Label>
          <Input
            ref={inputRef}
            fullWidth
            disabled={items.length >= maxItems}
            maxLength={maxLength}
            placeholder={
              items.length >= maxItems ? `Max ${maxItems} items reached` : placeholder
            }
          />
        </TextField>
        <Button
          isDisabled={!draft.trim() || items.length >= maxItems}
          size="sm"
          variant="secondary"
          onPress={add}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Chip key={item} size="sm" variant="soft">
              {item}
              <button
                aria-label={`Remove ${item}`}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
                type="button"
                onClick={() => remove(item)}
              >
                <X className="size-3" />
              </button>
            </Chip>
          ))}
        </div>
      )}
      <span className="text-muted-foreground text-xs">
        {items.length}/{maxItems} added
      </span>
    </div>
  );
}
