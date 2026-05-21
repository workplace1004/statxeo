"use client";

import { motion } from "motion/react";
import { Check, X, User, Building2, Users } from "lucide-react";
import { useState } from "react";

export default function Comparison2() {
  const [selectedPlan, setSelectedPlan] = useState("individual");

  const plans = [
    { id: "individual", icon: User, label: "Individual" },
    { id: "team", icon: Users, label: "Team" },
    { id: "enterprise", icon: Building2, label: "Enterprise" },
  ];

  const planData = {
    individual: [
      {
        title: "Monthly pricing",
        description: "How much it costs per month",
        brand1: "$12/mo",
        brand2: "$24/mo",
      },
      {
        title: "Projects & workspaces",
        description: "How many projects and workspaces you can create",
        brand1: "10 projects",
        brand2: "5 projects",
      },
      {
        title: "Team members",
        description: "Number of team members you can invite",
        brand1: "5 members",
        brand2: "3 members",
      },
      {
        title: "Storage space",
        description: "File storage for attachments and documents",
        brand1: "50 GB",
        brand2: "20 GB",
      },
      {
        title: "Advanced reporting",
        description: "Custom reports and analytics dashboards",
        brand1: false,
        brand2: false,
      },
      {
        title: "API access",
        description: "Connect with third-party tools and integrations",
        brand1: false,
        brand2: false,
      },
    ],
    team: [
      {
        title: "Monthly pricing",
        description: "How much it costs per month",
        brand1: "$29/mo",
        brand2: "$49/mo",
      },
      {
        title: "Projects & workspaces",
        description: "How many projects and workspaces you can create",
        brand1: "50 projects",
        brand2: "25 projects",
      },
      {
        title: "Team members",
        description: "Number of team members you can invite",
        brand1: "25 members",
        brand2: "15 members",
      },
      {
        title: "Storage space",
        description: "File storage for attachments and documents",
        brand1: "500 GB",
        brand2: "200 GB",
      },
      {
        title: "Advanced reporting",
        description: "Custom reports and analytics dashboards",
        brand1: true,
        brand2: false,
      },
      {
        title: "API access",
        description: "Connect with third-party tools and integrations",
        brand1: true,
        brand2: false,
      },
    ],
    enterprise: [
      {
        title: "Monthly pricing",
        description: "How much it costs per month",
        brand1: "$79/mo",
        brand2: "$129/mo",
      },
      {
        title: "Projects & workspaces",
        description: "How many projects and workspaces you can create",
        brand1: "Unlimited",
        brand2: "100 projects",
      },
      {
        title: "Team members",
        description: "Number of team members you can invite",
        brand1: "Unlimited",
        brand2: "50 members",
      },
      {
        title: "Storage space",
        description: "File storage for attachments and documents",
        brand1: "Unlimited",
        brand2: "2 TB",
      },
      {
        title: "Advanced reporting",
        description: "Custom reports and analytics dashboards",
        brand1: true,
        brand2: true,
      },
      {
        title: "API access",
        description: "Connect with third-party tools and integrations",
        brand1: true,
        brand2: true,
      },
    ],
  };

  const features = planData[selectedPlan as keyof typeof planData];

  return (
    <section className="relative w-full bg-white px-6 py-20 dark:bg-neutral-950 md:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-6 text-3xl font-medium tracking-tight text-neutral-950 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Taskflo vs. Projecto
          </h2>
          <p className="mx-auto mb-6 max-w-2xl px-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:mb-8 sm:px-0 sm:text-base md:text-lg">
            Taskflo is the #1 alternative to Projecto. With Taskflo, you get a
            more powerful and intuitive project management platform at a
            fraction of the cost.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-neutral-950 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Start for Free
          </motion.button>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl bg-neutral-100 p-1 dark:bg-neutral-900"
        >
          {/* Mobile Layout - Simplified Cards */}
          <div className="flex flex-col gap-4 lg:hidden">
            {/* Plan Toggle */}
            <div className="rounded-2xl bg-white p-6 dark:bg-neutral-950">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-950 dark:text-white">
                  Compare plans
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {plans.find((plan) => plan.id === selectedPlan)?.label}
                </p>
              </div>
              <div className="flex gap-3">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <motion.button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        selectedPlan === plan.id
                          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Brand Comparison Cards */}
            {features.map((feature, index) => (
              <motion.div
                key={`${selectedPlan}-${feature.title}-mobile`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-950"
              >
                {/* Feature Header */}
                <div className="border-b border-neutral-100 p-6 dark:border-neutral-800">
                  <div className="text-lg font-bold text-neutral-950 dark:text-white">
                    {feature.title}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {feature.description}
                  </div>
                </div>

                {/* Two-Column Comparison */}
                <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-800">
                  {/* Brand 1 */}
                  <div className="bg-white p-6 dark:bg-neutral-950">
                    <div className="mb-3 text-base font-bold text-neutral-950 dark:text-white">
                      Taskflo
                    </div>
                    <div className="flex items-center justify-start">
                      {typeof feature.brand1 === "boolean" ? (
                        feature.brand1 ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 dark:bg-white">
                            <Check
                              className="h-6 w-6 text-white dark:text-neutral-950"
                              strokeWidth={3}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
                            <X
                              className="h-6 w-6 text-neutral-400 dark:text-neutral-600"
                              strokeWidth={3}
                            />
                          </div>
                        )
                      ) : (
                        <span className="text-lg font-semibold text-neutral-950 dark:text-white">
                          {feature.brand1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brand 2 */}
                  <div className="bg-white p-6 dark:bg-neutral-950">
                    <div className="mb-3 text-base font-bold text-neutral-950 dark:text-white">
                      Projecto
                    </div>
                    <div className="flex items-center justify-start">
                      {typeof feature.brand2 === "boolean" ? (
                        feature.brand2 ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 dark:bg-white">
                            <Check
                              className="h-6 w-6 text-white dark:text-neutral-950"
                              strokeWidth={3}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
                            <X
                              className="h-6 w-6 text-neutral-400 dark:text-neutral-600"
                              strokeWidth={3}
                            />
                          </div>
                        )
                      ) : (
                        <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                          {feature.brand2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Layout - Table */}
          <div className="hidden lg:block">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-1 border-b-4 border-neutral-100 dark:border-neutral-900">
              {/* Column 1 - Plans Toggle */}
              <div className="flex gap-6 items-center justify-between rounded-tl-3xl bg-white p-8 dark:bg-neutral-950">
                <div>
                  <h3 className="mb-1 text-lg font-bold text-neutral-950 dark:text-white">
                    Compare plans
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {plans.find((plan) => plan.id === selectedPlan)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <motion.button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                          selectedPlan === plan.id
                            ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2 - Brand 1 (Highlighted) */}
              <div className="relative overflow-hidden px-12 py-8">
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background:
                      "radial-gradient(165% 165% at 50% 90%, #fff 40%, #7c3aed 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 z-0 dark:block hidden"
                  style={{
                    background:
                      "radial-gradient(100% 150% at 50% 90%, #0a0a0a 40%, #7c3aed 100%)",
                  }}
                />
                <div className="relative z-10 text-center">
                  <div className="mb-1 text-2xl font-bold text-neutral-950 dark:text-white">
                    Taskflo
                  </div>
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    PRO ↗
                  </div>
                </div>
              </div>

              {/* Column 3 - Brand 2 */}
              <div className="rounded-tr-3xl bg-white px-12 py-8 dark:bg-neutral-950">
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-neutral-950 dark:text-white">
                    Projecto
                  </div>
                  <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    BUSINESS
                  </div>
                </div>
              </div>
            </div>

            {/* Table Body - Feature Rows */}
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="grid grid-cols-[2fr_1fr_1fr] gap-1"
              >
                {/* Column 1 - Feature Info */}
                <div
                  className={`bg-white p-8 dark:bg-neutral-950 ${
                    index === features.length - 1 ? "rounded-bl-3xl" : ""
                  }`}
                >
                  <div className="font-semibold text-neutral-950 dark:text-white">
                    {feature.title}
                  </div>
                  <div className="mt-1 max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
                    {feature.description}
                  </div>
                </div>

                {/* Column 2 - Brand 1 Value */}
                <div className="bg-white px-12 py-8 dark:bg-neutral-950">
                  <motion.div
                    key={`${selectedPlan}-brand1-${feature.title}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center"
                  >
                    {typeof feature.brand1 === "boolean" ? (
                      feature.brand1 ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 dark:bg-white">
                          <Check
                            className="h-5 w-5 text-white dark:text-neutral-950"
                            strokeWidth={3}
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
                          <X
                            className="h-5 w-5 text-neutral-400 dark:text-neutral-600"
                            strokeWidth={3}
                          />
                        </div>
                      )
                    ) : (
                      <span className="text-center font-semibold text-neutral-950 dark:text-white">
                        {feature.brand1}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Column 3 - Brand 2 Value */}
                <div
                  className={`bg-white px-12 py-8 dark:bg-neutral-950 ${
                    index === features.length - 1 ? "rounded-br-3xl" : ""
                  }`}
                >
                  <motion.div
                    key={`${selectedPlan}-brand2-${feature.title}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center"
                  >
                    {typeof feature.brand2 === "boolean" ? (
                      feature.brand2 ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 dark:bg-white">
                          <Check
                            className="h-5 w-5 text-white dark:text-neutral-950"
                            strokeWidth={3}
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
                          <X
                            className="h-5 w-5 text-neutral-400 dark:text-neutral-600"
                            strokeWidth={3}
                          />
                        </div>
                      )
                    ) : (
                      <span className="text-center font-semibold text-neutral-600 dark:text-neutral-400">
                        {feature.brand2}
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
