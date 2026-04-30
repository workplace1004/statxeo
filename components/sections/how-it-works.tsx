"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Wrench, Smartphone } from "lucide-react";

const steps = [
  {
    id: 1,
    icon: ClipboardList,
    title: "Tell us about your service",
    description:
      "Share your business name, service area, and what you offer. Takes about 2 minutes.",
  },
  {
    id: 2,
    icon: Wrench,
    title: "We build & optimize",
    description:
      "Our team builds a compliance-ready, SEO-optimized site tailored to your business — including an AI-readable llms.txt file.",
  },
  {
    id: 3,
    icon: Smartphone,
    title: "Leads hit your phone",
    description:
      "Every form submission triggers an automated SMS to your phone and drops the lead into your free Statxt account.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section
      id="how-it-works"
      className="w-full py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Steps */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-mono text-primary mb-3 tracking-wider uppercase">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Three steps to a live site
            </h2>

            <div className="relative border-l-2 border-dashed border-border">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="relative cursor-pointer group"
                  onClick={() => setActiveStep(step.id)}
                >
                  {/* Active indicator */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 -ml-px bg-primary"
                    initial={false}
                    animate={{
                      opacity: activeStep === step.id ? 1 : 0,
                      scaleY: activeStep === step.id ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ originY: 0.5 }}
                  />

                  <div className="pl-6 py-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`text-xs font-mono transition-colors ${
                          activeStep === step.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {String(step.id).padStart(2, "0")}
                      </span>
                      <h3
                        className={`text-base sm:text-lg font-semibold transition-colors ${
                          activeStep === step.id
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{
                        height: activeStep === step.id ? "auto" : 0,
                        opacity: activeStep === step.id ? 1 : 0,
                        marginTop: activeStep === step.id ? 8 : 0,
                      }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md pl-8">
                        {step.description}
                      </p>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 overflow-hidden">
              {/* Glow */}
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 60%)",
                }}
              />

              <AnimatePresence mode="wait">
                {steps.map(
                  (step) =>
                    activeStep === step.id && (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 flex flex-col items-center text-center py-10"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                          <step.icon className="w-8 h-8 text-primary" />
                        </div>
                        <span className="text-xs font-mono text-primary mb-2">
                          {"Step " + step.id + " of 3"}
                        </span>
                        <h4 className="text-xl font-bold text-foreground mb-3">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                          {step.description}
                        </p>
                      </motion.div>
                    )
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
