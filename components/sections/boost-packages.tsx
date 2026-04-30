"use client";

import { ArrowRight, Check, Lock, Rocket } from "lucide-react";
import { motion } from "motion/react";

import DotShift from "@/components/react-bits/dot-shift";
import Globe from "@/components/react-bits/globe";
import NeonReveal from "@/components/react-bits/neon-reveal";
import {
  BOOST_PACKAGES,
  getRecommendedBoostPackageId,
  getWebsitePackage,
  type BoostPackageId,
  type WebsitePackageId,
} from "@/lib/statxeo/catalog";

const boosts = BOOST_PACKAGES.map((pkg) => ({
  id: pkg.id,
  codeName: pkg.codeName,
  name: pkg.codeName,
  subtitle: pkg.name,
  price: pkg.priceLabel,
  period: pkg.periodLabel,
  features: pkg.features,
  highlighted: "highlighted" in pkg ? pkg.highlighted : false,
  color: pkg.color,
}));

type BoostPackagesSectionProps = {
  websitePackageId: WebsitePackageId | null;
  selectedPackageId: BoostPackageId | null;
  onSelectPackage: (packageId: BoostPackageId) => void;
  onSkip: () => void;
};

function PremiumXeoText() {
  return (
    <span className="relative inline-block align-baseline animate-[pulse_2.8s_ease-in-out_infinite]">
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-fuchsia-400/80 via-violet-400/80 to-cyan-300/80 bg-clip-text text-transparent blur-[10px] opacity-75"
      >
        XEO
      </span>
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent blur-[1.5px] opacity-90"
      >
        XEO
      </span>
      <span className="relative bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent [filter:drop-shadow(0_0_10px_rgba(236,72,153,0.55))_drop-shadow(0_0_22px_rgba(124,58,237,0.65))_drop-shadow(0_0_34px_rgba(34,211,238,0.45))]">
        XEO
      </span>
    </span>
  );
}

export function BoostPackagesSection({
  websitePackageId,
  selectedPackageId,
  onSelectPackage,
  onSkip,
}: BoostPackagesSectionProps) {
  const websitePackage = websitePackageId ? getWebsitePackage(websitePackageId) : null;
  const recommendedPackageId = websitePackageId ? getRecommendedBoostPackageId(websitePackageId) : null;
  const isLocked = !websitePackageId;

  return (
    <section id="boost-packages" className="relative w-full overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-5 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Step 2 · Add a growth package</span>
          </div>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Add the monthly engine behind the site
          </h2>
          <p className="mx-auto mb-2 max-w-xl text-sm text-muted-foreground">
            {websitePackage
              ? `${websitePackage.name} is selected. Choose the monthly package you want attached to that build, or skip this step and continue to intake.`
              : "Choose a website package first. This step stays optional, but it now follows the website purchase flow."}
          </p>
          {websitePackage && selectedPackageId === recommendedPackageId ? (
            <p className="mx-auto max-w-xl text-xs uppercase tracking-[0.18em] text-cyan-100/70">
              We preselected the recommended pairing. You can keep it, change it, or remove it.
            </p>
          ) : null}
        </motion.div>

        {websitePackage ? (
          <div className="mb-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm text-foreground">
              Website selected: <span className="font-semibold">{websitePackage.name}</span>
            </div>
            {recommendedPackageId ? (
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                Recommended pairing: {BOOST_PACKAGES.find((pkg) => pkg.id === recommendedPackageId)?.codeName}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mb-8 flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/45 px-4 py-4 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Choose a website package in step 1 to unlock add-ons.
          </div>
        )}

        <div className="relative mb-8 h-20 overflow-hidden rounded-2xl border border-white/15 bg-black/70">
          <NeonReveal
            className="absolute inset-0 z-0"
            animateOnScroll
            scrollThreshold={0.1}
            revealDuration={3000}
            revealDelay={60}
            verticalOffset={0.5}
            barWidth={0.9}
            mirrored
            color={220}
            glowSpread={0.55}
            intensity={2.4}
          />
          <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/85 sm:text-sm">
              Boost Signal Active
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
          {boosts.map((boost, index) => (
            <motion.div
              key={boost.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={isLocked ? undefined : { y: -8, scale: 1.015 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-5 ${
                selectedPackageId === boost.id
                  ? "border-2 border-cyan-300/70 shadow-[0_22px_60px_rgba(34,211,238,0.2)]"
                  : boost.highlighted
                    ? "border-2 border-white/35"
                    : "border border-white/20"
              } ${isLocked ? "opacity-55" : ""} bg-black/35 backdrop-blur-md`}
            >
              <DotShift
                className="absolute inset-0 z-0 opacity-70"
                color={boost.color}
                speed={0.45}
                scale={0.65}
                size={0.62}
                blur={0.55}
              />

              <div className="pointer-events-none absolute inset-0 z-0 bg-black/40" />

              {boost.highlighted ? (
                <div
                  className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 60%)",
                  }}
                />
              ) : null}

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-6">
                  <p className="mb-1 text-xs font-mono uppercase tracking-wider text-white/75">
                    {boost.name}
                  </p>
                  <h3 className="mb-3 text-lg font-bold text-white">
                    {boost.subtitle === "XEO" ? <PremiumXeoText /> : boost.subtitle}
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {recommendedPackageId === boost.id ? (
                      <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                        Recommended
                      </span>
                    ) : null}
                    {selectedPackageId === boost.id ? (
                      <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{boost.price}</span>
                    <span className="text-sm text-white/70">{boost.period}</span>
                  </div>
                </div>

                <div className="mb-6 flex-1 space-y-3">
                  {boost.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="neo-button-well mt-auto">
                  <motion.button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onSelectPackage(boost.id)}
                    whileHover={isLocked ? undefined : { scale: 1.005, y: 1 }}
                    whileTap={isLocked ? undefined : { scale: 0.992, y: 3 }}
                    className="neo-package-button group px-6 py-3 text-sm font-semibold backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className="absolute inset-0 z-0"
                      style={{
                        background: `linear-gradient(135deg, ${boost.color}a8 0%, rgba(255,255,255,0.10) 55%, rgba(7,7,10,0.56) 100%)`,
                      }}
                    />
                    <span className="absolute inset-x-0 top-0 z-10 h-px bg-white/75" />
                    <motion.span
                      aria-hidden
                      className="absolute -inset-y-2 -left-1/3 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm"
                      animate={{ x: ["-35%", "380%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.1, ease: "linear" }}
                    />
                    <span className="relative z-20 inline-flex items-center justify-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
                      {isLocked
                        ? "Select website first"
                        : selectedPackageId === boost.id
                          ? "Add-on selected"
                          : recommendedPackageId === boost.id
                            ? `Choose ${boost.codeName} recommendation`
                            : `Add ${boost.codeName}`}
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {websitePackage ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {selectedPackageId ? "Remove add-on and continue" : "Skip add-on and continue to intake"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="mb-3 text-sm font-mono uppercase tracking-wider text-primary">
                Global CTA
              </p>
              <h3 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                Reach the world with <PremiumXeoText />
              </h3>
              <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                Expand beyond local boundaries with intelligent content routing, automation, and discoverability that scales globally.
              </p>
              <motion.a
                href={websitePackage ? "#intake" : "#pricing"}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="neo-button-shell neo-button-primary inline-flex w-fit px-5 py-3 text-sm text-primary-foreground"
              >
                {websitePackage ? "Continue to client intake" : "Start with website selection"}
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>

            <div className="relative min-h-[320px] bg-black/60">
              <Globe
                width="auto"
                height={320}
                primaryColor="rgb(59, 130, 246)"
                neutralColor="rgb(148, 219, 255)"
                globeColor="rgb(12, 12, 18)"
                atmosphereColor="rgb(160, 179, 253)"
                autoRotateSpeed={0.7}
                arcCount={8}
                cameraAltitude={2.1}
                className="h-full w-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
