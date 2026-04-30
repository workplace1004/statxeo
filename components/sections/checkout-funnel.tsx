"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { motion } from "motion/react";

import { BoostPackagesSection } from "@/components/sections/boost-packages";
import { IntakeFormSection } from "@/components/sections/intake-form";
import { PricingSection } from "@/components/sections/pricing";
import {
  getBoostPackage,
  getRecommendedBoostPackageId,
  getWebsitePackage,
  type BoostPackageId,
  type WebsitePackageId,
} from "@/lib/statxeo/catalog";

const funnelSectionIds = ["pricing", "boost-packages", "intake"] as const;

type FunnelSectionId = (typeof funnelSectionIds)[number];

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function CheckoutFunnelSection() {
  const [websitePackageId, setWebsitePackageId] = useState<WebsitePackageId | null>(null);
  const [boostPackageId, setBoostPackageId] = useState<BoostPackageId | null>(null);
  const [hasSkippedBoost, setHasSkippedBoost] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<FunnelSectionId>("pricing");

  useEffect(() => {
    const updateActiveSection = () => {
      const threshold = 180;
      let nextSectionId: FunnelSectionId = "pricing";

      for (const sectionId of funnelSectionIds) {
        const element = document.getElementById(sectionId);

        if (element && element.getBoundingClientRect().top <= threshold) {
          nextSectionId = sectionId;
        }
      }

      setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const websitePackage = websitePackageId ? getWebsitePackage(websitePackageId) : null;
  const boostPackage = boostPackageId ? getBoostPackage(boostPackageId) : null;
  const boostCompleted = Boolean(boostPackageId) || hasSkippedBoost;
  const intakeEnabled = Boolean(websitePackageId);

  const handleWebsiteSelect = (packageId: WebsitePackageId) => {
    const websiteChanged = websitePackageId !== packageId;
    const recommendedBoostPackageId = getRecommendedBoostPackageId(packageId);

    setWebsitePackageId(packageId);

    if (websiteChanged) {
      setBoostPackageId(recommendedBoostPackageId);
      setHasSkippedBoost(false);
    }

    scrollToSection("boost-packages");
  };

  const handleBoostSelect = (packageId: BoostPackageId) => {
    setBoostPackageId(packageId);
    setHasSkippedBoost(false);
    scrollToSection("intake");
  };

  const handleSkipBoost = () => {
    setBoostPackageId(null);
    setHasSkippedBoost(true);
    scrollToSection("intake");
  };

  const stepItems = [
    {
      id: "pricing" as const,
      index: "01",
      title: "Website",
      detail: websitePackage ? websitePackage.name : "Choose your build",
      complete: Boolean(websitePackageId),
      enabled: true,
    },
    {
      id: "boost-packages" as const,
      index: "02",
      title: "Add-on",
      detail: boostPackage
        ? `${boostPackage.codeName} selected`
        : hasSkippedBoost
          ? "Skipped for now"
          : "Optional growth layer",
      complete: boostCompleted,
      enabled: Boolean(websitePackageId),
    },
    {
      id: "intake" as const,
      index: "03",
      title: "Client intake",
      detail: intakeEnabled ? "Finish checkout details" : "Unlocked after step 1",
      complete: false,
      enabled: intakeEnabled,
    },
  ];

  const funnelSummary = !websitePackage
    ? "Choose a website package to start the funnel."
    : boostPackage
      ? `${websitePackage.name} is paired with ${boostPackage.codeName}. You can keep it, change it, or remove it before checkout.`
      : hasSkippedBoost
        ? `${websitePackage.name} is selected with no monthly add-on. Intake is ready.`
        : `${websitePackage.name} is selected. Review the recommended add-on before checkout.`;

  return (
    <div className="relative">
      <div className="sticky top-20 z-30 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl pt-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(5,10,20,0.86),rgba(7,12,24,0.74))] shadow-[0_18px_55px_rgba(2,6,23,0.22)] backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-3 sm:p-3">
              {stepItems.map((step) => {
                const isActive = activeSectionId === step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!step.enabled}
                    onClick={() => scrollToSection(step.id)}
                    className={[
                      "flex items-center gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition-all duration-200 sm:px-4",
                      step.enabled ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                      isActive
                        ? "border-cyan-300/35 bg-cyan-300/10"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tracking-[0.18em]",
                        step.complete
                          ? "border-emerald-300/40 bg-emerald-400/18 text-emerald-100"
                          : isActive
                            ? "border-cyan-300/40 bg-cyan-300/18 text-cyan-100"
                            : "border-white/10 bg-white/[0.04] text-white/72",
                      ].join(" ")}
                    >
                      {step.complete ? <Check className="h-4 w-4" /> : step.index}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{step.title}</p>
                      <p className="mt-1 truncate text-sm font-medium text-white">{step.detail}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/8 px-4 py-3 text-xs text-white/60 sm:px-5">
              {funnelSummary}
            </div>
          </motion.div>
        </div>
      </div>

      <PricingSection
        selectedPackageId={websitePackageId}
        onSelectPackage={handleWebsiteSelect}
      />

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </section>

      <BoostPackagesSection
        websitePackageId={websitePackageId}
        selectedPackageId={boostPackageId}
        onSelectPackage={handleBoostSelect}
        onSkip={handleSkipBoost}
      />

      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </section>

      <IntakeFormSection
        websitePackageId={websitePackageId}
        boostPackageId={boostPackageId}
      />
    </div>
  );
}