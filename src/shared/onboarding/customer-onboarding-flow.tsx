"use client";

import {useCallback, useState, useTransition} from "react";
import {useOnboardingGoogleAuth} from "@/hooks/use-onboarding-google-auth";
import {onboardingGoogleReturnTo} from "@/lib/auth/onboarding-auth-return";
import {ArrowRight, Check} from "lucide-react";
import {Button, Card} from "@heroui/react";
import {cn} from "@/lib/utils";
import {
  BOOST_PACKAGES,
  WEBSITE_PACKAGES,
  type BoostPackageId,
  type WebsitePackageId,
} from "@/components/onboarding/onboarding-data";
import {OnboardingAuthStep} from "@/components/onboarding/onboarding-auth-step";
import {OnboardingShell} from "@/components/onboarding/onboarding-shell";
import { ShinyAccent, ShinyDot } from "@/components/brand/shiny-glass";
import { BoostPricing8 } from "@/components/blocks/pricing-8";
import {
  PricingCardGlow,
  PricingCardSurface,
} from "@/components/pricing/pricing-card-glow";
import { PricingGrainSection } from "@/components/pricing/pricing-grain-section";
import {completeCustomerOnboarding} from "@/server/actions/onboarding";

const STEPS = [
  {id: "website", title: "Website"},
  {id: "boost", title: "Boost"},
  {id: "account", title: "Account"},
  {id: "done", title: "Done"},
] as const;

export function CustomerOnboardingFlow() {
  const [step, setStep] = useState(0);
  const [websiteId, setWebsiteId] = useState<WebsitePackageId | null>(null);
  const [boostId, setBoostId] = useState<BoostPackageId | null>(null);
  const [isPending, startTransition] = useTransition();

  const onGoogleAuthenticated = useCallback(() => setStep(3), []);
  useOnboardingGoogleAuth(onGoogleAuthenticated);

  const selectedWebsite = WEBSITE_PACKAGES.find((p) => p.id === websiteId);

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="tertiary"
        isDisabled={step === 0}
        onPress={() => setStep(Math.max(0, step - 1))}
      >
        Back
      </Button>
      <div className="flex items-center gap-2">
        {step === 1 ? (
          <Button variant="tertiary" onPress={() => setStep(2)}>
            Skip boost add-ons
          </Button>
        ) : null}
        {step < 2 ? (
          <Button isDisabled={step === 0 && !websiteId} onPress={() => setStep(step + 1)}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <OnboardingShell
      title="Get started with StatXEO"
      description="Pick your website package, optional monthly boost, then create your customer account."
      steps={[...STEPS]}
      currentStep={step}
      footer={step !== 2 && step !== 3 ? footer : undefined}
      backHref="/"
    >
      {step === 0 ? (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              Pick the website you want to buy first
            </h2>
            <p className="text-muted mt-2 text-sm sm:text-base">
              Every package is a one-time project fee. The add-on step comes next.
            </p>
          </div>
          <PricingGrainSection innerClassName="px-2 py-8 sm:px-4 sm:py-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {WEBSITE_PACKAGES.map((pkg) => {
              const selected = websiteId === pkg.id;
              const popular = "popular" in pkg && pkg.popular;
              return (
                <PricingCardGlow
                  key={pkg.id}
                  variant={
                    selected ? "selected" : popular ? "featured" : "default"
                  }
                  animated={popular && !selected}
                  onGrain
                >
                  <button
                    type="button"
                    onClick={() => setWebsiteId(pkg.id)}
                    className="h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  >
                    <PricingCardSurface
                      onGrain
                      className={cn(
                        "p-5 transition-shadow",
                        selected && "ring-2 ring-[#3d6b55]/35 ring-inset",
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {pkg.name}
                        </h3>
                        {selected ? (
                          <ShinyDot size="sm">
                            <Check className="size-3.5" />
                          </ShinyDot>
                        ) : null}
                      </div>
                      <ShinyAccent className="text-2xl font-semibold">
                        {pkg.price}
                      </ShinyAccent>
                      <ul className="mt-4 flex flex-col gap-2">
                        {pkg.highlights.map((h) => (
                          <li
                            key={h}
                            className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                          >
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#3d6b55]" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </PricingCardSurface>
                  </button>
                </PricingCardGlow>
              );
            })}
            </div>
          </PricingGrainSection>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              Add monthly boost packages
            </h2>
            <p className="text-muted mt-2 text-sm sm:text-base">
              {selectedWebsite
                ? `Building on ${selectedWebsite.name} (${selectedWebsite.price}). Select a boost or skip.`
                : "Select a boost package or skip this step."}
            </p>
          </div>
          <PricingGrainSection
            variant="boost"
            stackPosition="single"
            innerClassName="px-2 py-8 sm:px-4 sm:py-10"
          >
            <BoostPricing8
              onGrain
              selectedTierId={boostId}
              onSelectTier={(id) =>
                setBoostId(boostId === id ? null : id)
              }
            />
          </PricingGrainSection>
        </div>
      ) : null}

      {step === 2 ? (
        <OnboardingAuthStep
          accent="default"
          mode="sign-up"
          subtitle="Customer account"
          tagline="Your website, SEO, and growth — automated."
          googlePersona="customer"
          googleReturnTo={onboardingGoogleReturnTo("customer")}
          onSubmit={() => setStep(3)}
        />
      ) : null}

      {step === 3 ? (
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title>You&apos;re all set</Card.Title>
            <Card.Description>
              {selectedWebsite?.name ?? "Website"} package
              {boostId ? ` + ${BOOST_PACKAGES.find((b) => b.id === boostId)?.name}` : ""} — ready
              for your customer workspace.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Button
              className="w-full sm:w-auto"
              isDisabled={isPending}
              onPress={() =>
                startTransition(() =>
                  completeCustomerOnboarding({
                    websitePackageId: websiteId,
                    boostPackageId: boostId,
                  }),
                )
              }
            >
              {isPending && (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Open customer dashboard
              {!isPending && <ArrowRight className="size-4" />}
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </OnboardingShell>
  );
}
