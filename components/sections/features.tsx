"use client";

import { motion } from "motion/react";
import {
  Search,
  MessageSquare,
  LayoutDashboard,
  Bot,
  ShieldCheck,
  Layers,
} from "lucide-react";
import DepthCard from "@/components/react-bits/depth-card";

const features = [
  {
    icon: Search,
    title: "Local SEO for Service Businesses",
    description:
      "Real schema markup, meta tags, and city-specific targeting built to rank.",
    color: "#33AAFF",
  },
  {
    icon: MessageSquare,
    title: "Instant Messaging Automation",
    description: "Leads are routed straight to your phone via SMS.",
    color: "#33FF88",
  },
  {
    icon: LayoutDashboard,
    title: "Free Statxt Platform Access",
    description:
      "Manage all your conversations, contacts, and campaigns from one dashboard.",
    color: "#AA33FF",
  },
  {
    icon: Bot,
    title: "AI-Optimized (LLM.txt)",
    description:
      "AI-readable markdown page so ChatGPT, Claude, and other agents can recommend your business.",
    color: "#FF8833",
  },
  {
    icon: ShieldCheck,
    title: "10DLC-Ready Compliance",
    description:
      "Carrier-approved content and privacy language baked into every build.",
    color: "#FF3333",
  },
  {
    icon: Layers,
    title: "Full Website on Core Plan",
    description:
      "Upgrade to Core for a complete multi-page site with dedicated contact and quote pages.",
    color: "#33FFFF",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="absolute inset-x-0 -top-40 h-[600px] bg-primary/5 blur-[120px] rounded-[100%] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-16 max-w-2xl text-center sm:text-left mx-auto sm:mx-0">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm font-mono text-primary mb-3 tracking-widest uppercase font-semibold"
          >
            {"What\u2019s Included"}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-6 text-balance tracking-tight"
          >
            Everything you need to dominate local search
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium"
          >
            One payment covers your SEO-optimized site, AI-readability, compliance copy, and the Statxt lead funnel wiring. Forever.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className="w-full"
              >
                <DepthCard
                  className="w-full h-full neo-surface rounded-[1.25rem] cursor-pointer group hover:border-primary/30 transition-colors duration-500 overflow-hidden min-h-[280px]"
                  width="100%"
                  height="100%"
                  maxRotation={12}
                  maxTranslation={12}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                    style={{
                      background: `radial-gradient(circle at top left, ${feature.color}40 0%, transparent 70%)`
                    }}
                  />

                  <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                    <div>
                      <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 backdrop-blur-md"
                        style={{
                          background: `linear-gradient(135deg, ${feature.color}15, rgba(255,255,255,0.03))`,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.2)",
                          border: `1px solid ${feature.color}30`
                        }}
                      >
                        <Icon
                          className="w-5 h-5 transition-transform duration-500 group-hover:scale-110"
                          style={{
                            color: feature.color,
                          }}
                        />
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
                        {feature.title}
                      </h3>

                      <p className="text-sm text-muted-foreground/90 leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </DepthCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
