"use client";

import { motion } from "motion/react";
import { ArrowRight, PhoneCall, Workflow } from "lucide-react";
import CenterFlow from "@/components/react-bits/center-flow";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const flowNodes = [
  { label: "Homepage", tone: "from-white/20 via-cyan-400/30 to-cyan-300/10" },
  { label: "Service Pages", tone: "from-white/20 via-indigo-500/30 to-violet-300/10" },
  { label: "SEO Blogs", tone: "from-white/20 via-emerald-400/30 to-emerald-200/10" },
  { label: "Local Landing", tone: "from-white/20 via-rose-400/30 to-rose-200/10" },
  { label: "Google Leads", tone: "from-white/20 via-sky-400/30 to-sky-300/10" },
  { label: "Instant Routing", tone: "from-white/20 via-orange-400/30 to-amber-300/10" },
  { label: "STATXT", tone: "from-white/20 via-slate-500/30 to-indigo-300/10" },
  { label: "Phone Alerts", tone: "from-white/20 via-amber-300/30 to-amber-200/10" },
];

export function LeadRoutingCtaSection() {
  return (
    <section className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="neo-surface mx-auto w-full max-w-6xl overflow-hidden rounded-3xl p-6 backdrop-blur-xl sm:p-8 lg:p-10"
      >
        <div className="flex flex-col gap-8 lg:gap-10">
          <div className="max-w-3xl">
            <div className="neo-surface-soft mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-white/90">
              <Workflow className="h-3.5 w-3.5" />
              Source Flow
            </div>

            <h3 className="text-balance text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              We source leads from your website and route them directly to your
              Statxt account or phone.
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Every form submission, call intent, and inbound action gets
              captured and pushed in real time so your team can reply first,
              close faster, and stop missing high-intent opportunities.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="neo" size="xl">
                <a href="#intake">
                  Start lead routing
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>

              <Button asChild variant="neo-secondary" size="xl">
                <a href="#intake">
                  <PhoneCall className="h-4 w-4" />
                  Route to my phone
                </a>
              </Button>
            </div>
          </div>

          <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-white/25 bg-black/55 sm:h-[520px]">
            <CenterFlow
              className="h-full w-full"
              nodeItems={flowNodes.map((node, index) => ({
                content: (
                  <motion.div
                    animate={{ y: [0, -2.5, 0] }}
                    transition={{
                      duration: 2.4 + (index % 3) * 0.35,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={`flex h-full w-full items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br ${node.tone} px-3 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-2xl shadow-[0_10px_36px_rgba(0,0,0,0.35)] sm:text-[10px]`}
                  >
                    {node.label}
                  </motion.div>
                ),
              }))}
              centerSize={172}
              nodeSize={72}
              pulseDuration={3.8}
              pulseInterval={3.6}
              pulseLength={0.36}
              lineWidth={1.4}
              pulseWidth={1.2}
              pulseSoftness={0.28}
              lineColor="#181826"
              lineColorLight="#d7d7e2"
              pulseColor="#d8b4fe"
              pulseColorLight="#c084fc"
              glowColor="#22d3ee"
              glowColorLight="#7c3aed"
              maxGlowIntensity={14}
              glowDecay={.5}
              nodeDistance={0.82}
              borderRadius={40}
              centerContent={
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_65%)] p-2 sm:p-3 backdrop-blur-3xl shadow-[0_0_45px_rgba(34,211,238,0.28)]">
                  <div className="pointer-events-none absolute inset-2 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.30),transparent_68%)]" />
                  <div className="relative z-20 h-20 w-20">
                    <Image
                      src="/whiteNBG.png"
                      alt="Statxeo"
                      width={80}
                      height={80}
                      className="h-full w-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.72)]"
                    />
                  </div>
                </div>
              }
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_62%)]" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
