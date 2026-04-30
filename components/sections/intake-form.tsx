"use client";

import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { motion } from "motion/react";

import RadialLiquid from "@/components/react-bits/radial-liquid";
import {
  getBoostPackage,
  getWebsitePackage,
  type BoostPackageId,
  type WebsitePackageId,
} from "@/lib/statxeo/catalog";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type IntakeFormSectionProps = {
  websitePackageId: WebsitePackageId | null;
  boostPackageId: BoostPackageId | null;
};

export function IntakeFormSection({ websitePackageId, boostPackageId }: IntakeFormSectionProps) {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === "development";
  const [agreedHosted, setAgreedHosted] = useState(isDev);
  const [agreedProduct, setAgreedProduct] = useState(isDev);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const websitePackage = websitePackageId ? getWebsitePackage(websitePackageId) : null;
  const boostPackage = boostPackageId ? getBoostPackage(boostPackageId) : null;
  const hasWebsiteSelection = Boolean(websitePackageId);
  const hasBoostSelection = Boolean(boostPackageId);
  const oneTimeTotalLabel = websitePackage?.priceLabel ?? "$0.00";
  const monthlyTotalLabel = boostPackage
    ? `${boostPackage.priceLabel}${boostPackage.periodLabel}`
    : "No monthly add-on";

  const ownershipTermsCopy = !websitePackageId
    ? "I agree to the Statxeo site terms for my selected website package."
    : websitePackageId === "statxeo_lander"
      ? "I agree that Lander websites are managed by Statxt on Statxt infrastructure."
      : "I agree that for Core or Titan, I own the delivered site content and structure while Statxt retains framework and platform rights.";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!agreedHosted || !agreedProduct) {
      setErrorMessage("Please accept both terms before continuing.");
      return;
    }

    if (!websitePackageId || !hasWebsiteSelection) {
      setErrorMessage("Choose a website package in step 1 before continuing.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const ownerFullName = String(formData.get("ownerFullName") ?? "").trim();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const businessAddressFull = String(formData.get("businessAddressFull") ?? "").trim();
    const ein = String(formData.get("ein") ?? "").trim();
    const businessIndustry = String(formData.get("businessIndustry") ?? "").trim();
    const businessProductsServices = String(formData.get("businessProductsServices") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!businessAddressFull || !ein || !businessIndustry || !businessProductsServices) {
      setErrorMessage(
        "Website checkout requires business address, EIN, industry, and products/services.",
      );
      return;
    }

    if (!email || !phone || phone.length < 10) {
      setErrorMessage("Client intake requires a valid email and phone number.");
      return;
    }

    const isDev = process.env.NEXT_PUBLIC_APP_ENV === "development";

    setIsSubmitting(true);

    try {
      // ── Dev bypass: skip Stripe, create project directly ──────────────────
      if (isDev) {
        const response = await fetch("/api/dev/checkout-bypass", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            websitePackageId,
            ownerFullName,
            businessName,
            businessAddressFull,
            ein,
            businessIndustry,
            businessProductsServices,
            email,
            phone,
            notes,
          }),
        });

        const data: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          setErrorMessage(
            isRecord(data) && typeof data.error === "string"
              ? data.error
              : "Dev bypass failed. Please try again.",
          );
          return;
        }

        if (isRecord(data) && typeof data.redirectUrl === "string") {
          window.location.assign(data.redirectUrl);
          return;
        }

        setErrorMessage("Dev bypass succeeded but no redirect URL was returned.");
        return;
      }

      // ── Production: go through Stripe ─────────────────────────────────────
      const endpoint = hasBoostSelection ? "/api/statxeo/checkout-combined" : "/api/statxeo/checkout";
      const payload: Record<string, unknown> = hasBoostSelection
        ? {
            websitePackageId,
            boostPackageId,
            ownerFullName,
            businessName,
            businessAddressFull,
            ein,
            businessIndustry,
            businessProductsServices,
            email,
            phone,
            notes,
            acceptStatxtSiteTerms: true,
            acceptLeadFunnelTerms: true,
          }
        : {
            packageId: websitePackageId,
            ownerFullName,
            businessAddressFull,
            ein,
            businessName,
            businessIndustry,
            businessProductsServices,
            email,
            phone,
            acceptStatxtSiteTerms: true,
            acceptLeadFunnelTerms: true,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (isRecord(data) && typeof data.error === "string") {
          setErrorMessage(data.error);
        } else {
          setErrorMessage("Unable to start checkout right now. Please try again.");
        }
        return;
      }

      if (isRecord(data) && typeof data.url === "string" && data.url.length > 0) {
        window.location.assign(data.url);
        return;
      }

      setErrorMessage("Checkout session created, but no redirect URL was returned.");
    } catch {
      setErrorMessage("Unable to connect to checkout services right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="intake" className="w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="neo-surface relative overflow-hidden rounded-2xl p-6 sm:p-10"
        >
          <RadialLiquid
            className="pointer-events-none absolute inset-0 z-0 opacity-75"
            color1="#10b981"
            color2="#0f172a"
            color3="#22d3ee"
            backgroundColor="#05070b"
            speed={0.4}
            iterations={3}
            overallOpacity={0.55}
            waveSize={2.2}
            edgeSoftness={0.5}
            scale={1.3}
            distortionType="plasma"
            distortionScale={0.22}
            chromaShift={0.05}
            enableCursorInteraction={false}
            refractionStrength={8}
            refractionEdgeWidth={0.18}
            refractionWaveSpeed={0.9}
            refractionWaveFrequency={6.5}
            fresnelIntensity={0.35}
            edgeHighlight={0.2}
          />
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10">
            <div className="mb-8">
              <p className="mb-3 text-sm font-mono uppercase tracking-wider text-primary">
                Step 3 · Client intake
              </p>
              <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                Tell us who we are building for
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Fill in the client details below so checkout lands on the right build, the right add-on, and the right business contact information.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="neo-surface-soft rounded-2xl px-4 py-3 text-sm text-foreground">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Website</p>
                  <p className="mt-2 font-semibold">
                    {websitePackage ? `${websitePackage.name} · ${websitePackage.priceLabel}` : "Select a website first"}
                  </p>
                  <a href="#pricing" className="mt-2 inline-flex text-xs text-primary transition-colors hover:text-primary/80">
                    Change website selection
                  </a>
                </div>
                <div className="neo-surface-soft rounded-2xl px-4 py-3 text-sm text-foreground">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Add-on</p>
                  <p className="mt-2 font-semibold">
                    {boostPackage
                      ? `${boostPackage.codeName} ${boostPackage.name} · ${boostPackage.priceLabel}${boostPackage.periodLabel}`
                      : "No monthly add-on selected"}
                  </p>
                  <a href="#boost-packages" className="mt-2 inline-flex text-xs text-primary transition-colors hover:text-primary/80">
                    Change add-on choice
                  </a>
                </div>
                <div className="neo-surface-soft rounded-2xl px-4 py-3 text-sm text-foreground">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Checkout summary</p>
                  <p className="mt-2 font-semibold">One-time today: {oneTimeTotalLabel}</p>
                  <p className="mt-1 text-muted-foreground">Monthly after launch: {monthlyTotalLabel}</p>
                </div>
              </div>
            </div>

            {!hasWebsiteSelection ? (
              <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Step 1 is required. Choose a website package before starting client intake.
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Owner full name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="ownerFullName"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Business name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Smith HVAC LLC"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Business address <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="businessAddressFull"
                  required
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="123 Main St, Austin, TX 78701"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    EIN <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="ein"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Industry <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessIndustry"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Home Services, Plumbing, etc."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Products / services <span className="text-primary">*</span>
                </label>
                <textarea
                  name="businessProductsServices"
                  required
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="HVAC installs and repairs, plumbing, electrical, maintenance plans..."
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="john@smithhvac.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Phone <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="(512) 555-1234"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Notes <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Any launch constraints, preferred tone, or delivery notes"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setAgreedHosted(!agreedHosted)}
                    className={`neo-inset mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                      agreedHosted ? "border-primary bg-primary" : ""
                    }`}
                  >
                    {agreedHosted ? (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                  <label className="text-sm leading-relaxed text-muted-foreground">
                    {ownershipTermsCopy}{" "}
                    <a href="/statxeo/terms" className="underline text-primary transition-colors hover:text-primary/80">
                      Hosted Site Terms
                    </a>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setAgreedProduct(!agreedProduct)}
                    className={`neo-inset mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                      agreedProduct ? "border-primary bg-primary" : ""
                    }`}
                  >
                    {agreedProduct ? (
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                  <label className="text-sm leading-relaxed text-muted-foreground">
                    I agree this purchase will route leads and project data through my Statxt account setup and launch workflow.{" "}
                    <a href="/statxeo/product-terms" className="underline text-primary transition-colors hover:text-primary/80">
                      Product Terms
                    </a>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !hasWebsiteSelection}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.985 }}
                  className="neo-button-shell group w-full px-8 py-4 text-base font-semibold text-white backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-400/80 via-cyan-400/40 to-violet-500/45" />
                  <span className="absolute inset-x-0 top-0 z-10 h-px bg-white/80" />
                  <motion.span
                    aria-hidden
                    className="absolute -inset-y-2 -left-1/3 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent blur-sm"
                    animate={{ x: ["-35%", "380%"] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2, ease: "linear" }}
                  />
                  <span className="relative z-20 inline-flex items-center justify-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {isSubmitting
                      ? isDev ? "Creating project (dev bypass)..." : "Creating secure checkout..."
                      : !hasWebsiteSelection
                        ? "Choose a website package first"
                        : isDev
                          ? `[DEV] Skip payment → create project`
                          : hasBoostSelection
                            ? `Continue to ${websitePackage?.priceLabel ?? "$0.00"} + add-on checkout`
                            : `Continue to ${websitePackage?.priceLabel ?? "$0.00"} website checkout`}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Secure checkout via Stripe
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
