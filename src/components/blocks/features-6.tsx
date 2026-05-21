"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Box, Orbit, Workflow, Circle, ArrowRight } from "lucide-react";

const vehicles = [
  {
    title: "Client Retainers",
    desc: "Lock in recurring revenue, streamline onboarding, and let us handle invoicing while you focus on the work.",
    blob: "rgba(168,139,250,0.85)",
    arrow: "group-hover:bg-violet-400",
  },
  {
    title: "Project Sprints",
    desc: "Scope tight, ship fast. Run fixed-fee engagements with milestones, approvals, and timelines all in one place.",
    blob: "rgba(56,189,248,0.85)",
    arrow: "group-hover:bg-sky-400",
  },
  {
    title: "Collaborator Pods",
    desc: "Assemble freelance crews in days, pay them on time, and keep every contract, NDA, and deliverable organized.",
    blob: "rgba(251,191,36,0.85)",
    arrow: "group-hover:bg-amber-400",
  },
  {
    title: "One-Off Gigs",
    desc: "Say yes to the walk-in job without the paperwork. Send a quote, collect payment, and close the loop in minutes.",
    blob: "rgba(52,211,153,0.85)",
    arrow: "group-hover:bg-emerald-400",
  },
];

const icons = [Box, Orbit, Workflow, Circle];

export default function Features6() {
  return (
    <section className="w-full min-h-screen flex items-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-3xl sm:text-4xl md:text-5xl font-medium text-neutral-900 dark:text-white tracking-tight leading-[1.15] max-w-3xl"
        >
          Back-office built for every
          <br className="hidden sm:block" /> way your studio takes on work
        </motion.h2>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {vehicles.map((v, i) => (
            <Card key={i} vehicle={v} index={i} Icon={icons[i]} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Vehicle = (typeof vehicles)[number];

function Card({
  vehicle,
  index,
  Icon,
}: {
  vehicle: Vehicle;
  index: number;
  Icon: (typeof icons)[number];
}) {
  const [hovered, setHovered] = useState(false);
  const words = vehicle.desc.split(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl bg-neutral-100 dark:bg-neutral-900 p-6 min-h-[360px] flex flex-col overflow-hidden"
    >
      <motion.div
        initial={false}
        animate={{ opacity: hovered ? 0.7 : 0, scale: hovered ? 1 : 0.75 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute left-1/2 -bottom-24 w-64 h-64 rounded-full pointer-events-none blur-md"
        style={{
          background: `radial-gradient(circle, ${vehicle.blob} 0%, rgba(255,255,255,0) 70%)`,
          x: "-50%",
        }}
      />

      <Icon className="relative w-5 h-5 text-neutral-900 dark:text-neutral-200" />

      <p className="relative mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[220px]">
        {words.map((w, wi) => (
          <motion.span
            key={wi}
            initial={false}
            animate={{
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : 4,
              filter: hovered ? "blur(0px)" : "blur(3px)",
            }}
            transition={{
              duration: 0.3,
              delay: hovered ? wi * 0.03 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block mr-[0.25em]"
          >
            {w}
          </motion.span>
        ))}
      </p>

      <div className="relative mt-auto flex items-center justify-between pt-8">
        <span className="text-base sm:text-lg text-neutral-900 dark:text-white">
          {vehicle.title}
        </span>
        <motion.span
          initial={false}
          animate={{
            backgroundColor: hovered ? vehicle.blob : "rgb(229 229 229)",
            color: hovered ? "#ffffff" : "rgb(64 64 64)",
          }}
          transition={{ duration: 0.3 }}
          className="w-10 h-10 rounded-full flex items-center justify-center dark:bg-neutral-800 dark:text-neutral-300"
        >
          <motion.span
            animate={{ x: hovered ? 2 : 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex"
          >
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </motion.span>
      </div>
    </motion.div>
  );
}
