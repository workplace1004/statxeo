"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

import DepthCard from "@/components/react-bits/depth-card";
import SquircleShift from "@/components/react-bits/squircle-shift";
import { WEBSITE_PACKAGES, type WebsitePackageId } from "@/lib/statxeo/catalog";

const websitePlans = WEBSITE_PACKAGES.map((tier, index) => ({
  ...tier,
  cadenceLabel: "One-time",
  recommended: index === 1,
}));

const planShaderTints = ["#9ca3af", "#34d399", "#60a5fa"] as const;

type PricingSectionProps = {
  selectedPackageId: WebsitePackageId | null;
  onSelectPackage: (packageId: WebsitePackageId) => void;
};

export function PricingSection({ selectedPackageId, onSelectPackage }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative w-full px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(3,7,18,0.98))] text-white shadow-[0_30px_80px_rgba(0,0,0,0.34)]">
        <div className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8">
          <div className="absolute inset-0 opacity-90">
            <SquircleShift
              width="100%"
              height="100%"
              speed={0.22}
              colorLayers={3}
              gridFrequency={22}
              gridIntensity={0.72}
              waveSpeed={0.18}
              waveIntensity={0.08}
              spiralIntensity={0.76}
              lineThickness={0.055}
              falloff={1.15}
              centerX={0.88}
              centerY={0.72}
              brightness={1.1}
              phaseOffset={6}
              colorTint="#6ee7b7"
              lightBackground="#09090b"
              darkBackground="#09090b"
              className="h-full w-full"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.18),transparent_26%),linear-gradient(180deg,rgba(2,6,23,0.24),rgba(2,6,23,0.84))]" />

          <div className="relative z-10 mx-auto max-w-[1400px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <span className="inline-flex items-center rounded-sm border border-white/15 bg-white/10 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                Step 1 · Choose your website
              </span>
              <h2 className="mt-6 text-4xl font-medium leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Launch faster,
                <br />
                rank cleaner
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-relaxed text-white/76 sm:text-xl">
                Start with the website build. After that, you can add the monthly growth package that fits the site you picked and then finish intake in one secure checkout flow.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="relative overflow-hidden border-t border-white/10 px-4 py-12 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(34,211,238,0.08),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(16,185,129,0.12),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.34),rgba(2,6,23,0.92))]" />
          <div className="absolute inset-x-8 top-0 h-32 rounded-full bg-emerald-400/8 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1400px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mb-12 text-center"
            >
              <p className="text-xl font-medium text-white sm:text-2xl">
                Pick the website you want to buy first.
              </p>
              <p className="mt-2 text-base text-white/62 sm:text-lg">
                Every package is a one-time project fee. The add-on step comes next.
              </p>
            </motion.div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_rgba(2,6,23,0.34)] sm:p-6">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]" />
              <div className="absolute inset-x-8 top-0 h-28 rounded-full bg-white/6 blur-3xl" />
              <div className="absolute -right-10 bottom-8 h-36 w-36 rounded-full bg-emerald-400/12 blur-3xl" />
              <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {websitePlans.map((tier, index) => (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.16 + index * 0.08 }}
                    className={[
                      tier.recommended ? "lg:-translate-y-1" : "",
                      selectedPackageId === tier.id ? "lg:-translate-y-2" : "",
                    ].join(" ")}
                  >
                    <DepthCard
                      width="100%"
                      height={708}
                      borderRadius="1.75rem"
                      maxRotation={6}
                      maxTranslation={8}
                      disableOnMobile
                      spotlightColor={tier.recommended ? "rgba(110, 231, 183, 0.22)" : "rgba(255, 255, 255, 0.18)"}
                      className={[
                        "h-full w-full",
                        selectedPackageId === tier.id
                          ? "shadow-[0_24px_70px_rgba(52,211,153,0.22)]"
                          : tier.recommended
                            ? "shadow-[0_18px_50px_rgba(16,185,129,0.14)]"
                            : "shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
                      ].join(" ")}
                      backgroundContent={
                        <>
                          <SquircleShift
                            width="100%"
                            height="100%"
                            speed={0.22}
                            colorLayers={3}
                            gridFrequency={19}
                            gridIntensity={1}
                            waveSpeed={0.2}
                            waveIntensity={0.09}
                            spiralIntensity={0.84}
                            lineThickness={0.062}
                            falloff={1.02}
                            centerX={0.88}
                            centerY={0.72}
                            brightness={1.28}
                            phaseOffset={6 + index}
                            colorTint={planShaderTints[index]}
                            lightBackground={tier.recommended ? "#022c22" : "#020617"}
                            darkBackground={tier.recommended ? "#022c22" : "#020617"}
                            className="h-full w-full"
                          />
                          <div className={[
                            "absolute inset-0",
                            tier.recommended
                              ? "bg-[linear-gradient(180deg,rgba(2,6,23,0.16),rgba(2,6,23,0.34)_24%,rgba(6,78,59,0.5)_68%,rgba(6,78,59,0.68)_100%)]"
                              : "bg-[linear-gradient(180deg,rgba(2,6,23,0.14),rgba(2,6,23,0.38)_24%,rgba(15,23,42,0.56)_68%,rgba(15,23,42,0.74)_100%)]",
                          ].join(" ")} />
                          <div className="absolute inset-x-5 top-5 h-28 rounded-full bg-white/10 blur-2xl" />
                        </>
                      }
                    >
                      <div
                        className={[
                          "relative flex h-full flex-col rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(2,6,23,0.34),rgba(2,6,23,0.58))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_35px_rgba(2,6,23,0.22)] backdrop-blur-[2px] sm:p-7",
                          selectedPackageId === tier.id
                            ? "border-cyan-300/70"
                            : tier.recommended
                              ? "border-emerald-300/55"
                              : "border-white/14",
                        ].join(" ")}
                      >
                        <div className="mb-6 flex items-center justify-between gap-3">
                          <span
                            className={[
                              "rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em]",
                              tier.recommended
                                ? "bg-emerald-400 text-black"
                                : "bg-white/10 text-white",
                            ].join(" ")}
                          >
                            {tier.name}
                          </span>
                          <span className="rounded-sm border border-white/14 bg-white/6 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/68">
                            {tier.cadenceLabel}
                          </span>
                        </div>

                        <div className="mb-6 flex items-end justify-between gap-4">
                          <span className="text-5xl font-bold tracking-tight text-white">
                            {tier.priceLabel}
                          </span>
                          <span className="pb-2 text-sm text-white/48">
                            one project fee
                          </span>
                        </div>

                        <p className="mb-8 text-base leading-relaxed text-white/74">
                          {tier.description}
                        </p>

                        <div className="mb-6 rounded-sm border border-white/12 bg-white/6 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                          {tier.ownershipSummary}
                        </div>

                        <div className="mb-8 space-y-0">
                          {tier.features.map((feature, featureIndex) => (
                            <div
                              key={feature}
                              className={[
                                "flex items-start gap-3 py-4",
                                "border-t border-white/12",
                                featureIndex === tier.features.length - 1 ? "border-b border-white/12" : "",
                              ].join(" ")}
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <p className="text-sm leading-relaxed text-white/82">{feature}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto pt-5">
                          <button
                            type="button"
                            onClick={() => onSelectPackage(tier.id)}
                            className={[
                              "w-full rounded-xl border px-6 py-3.5 text-sm font-semibold shadow-[0_16px_28px_rgba(15,23,42,0.12)] transition-all duration-200",
                              selectedPackageId === tier.id
                                ? "border-cyan-300/70 bg-cyan-300 text-slate-950 hover:-translate-y-0.5 hover:bg-cyan-200"
                                : tier.recommended
                                  ? "border-emerald-300/70 bg-emerald-400 text-black hover:-translate-y-0.5 hover:bg-emerald-300"
                                  : "border-white/18 bg-white/10 text-white hover:-translate-y-0.5 hover:bg-white/14",
                            ].join(" ")}
                          >
                            {selectedPackageId === tier.id ? "Website selected" : tier.cta}
                          </button>
                        </div>
                      </div>
                    </DepthCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
