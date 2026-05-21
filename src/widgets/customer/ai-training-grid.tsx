"use client";

import {BookOpen, Microphone, Picture} from "@gravity-ui/icons";
import {Chip} from "@heroui/react";
import {motion} from "motion/react";
import {useState} from "react";

import {notifyInfo} from "../../lib/ui/white-label-notify";

const TRAINING_ITEMS = [
  {
    id: "tone",
    title: "Tone of voice",
    description: "Upload past posts and emails to calibrate AI tone.",
    status: "Not started",
    blob: "rgba(99,102,241,0.75)",
    Icon: Microphone,
  },
  {
    id: "knowledge",
    title: "Service knowledge",
    description: "Add your pricing, services, and service area for sharper answers.",
    status: "Not started",
    blob: "rgba(56,189,248,0.75)",
    Icon: BookOpen,
  },
  {
    id: "brand",
    title: "Brand assets",
    description: "Upload your logo, photos, and color palette.",
    status: "Not started",
    blob: "rgba(167,139,250,0.75)",
    Icon: Picture,
  },
] as const;

export function AiTrainingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {TRAINING_ITEMS.map((item, index) => (
        <TrainingCard key={item.id} index={index} item={item} />
      ))}
    </div>
  );
}

function TrainingCard({
  index,
  item,
}: {
  index: number;
  item: (typeof TRAINING_ITEMS)[number];
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.Icon;

  const statusColor =
    item.status === "Complete"
      ? "success"
      : item.status === "In progress"
        ? "accent"
        : undefined;

  return (
    <motion.button
      className={[
        "relative flex min-h-[160px] w-full flex-col gap-2 overflow-hidden rounded-xl p-4 text-left transition-colors",
        item.status === "Not started"
          ? "border-default-200 bg-content1 border border-dashed"
          : item.status === "Complete"
            ? "border-success/30 bg-success/5 border"
            : "bg-content2/40",
      ].join(" ")}
      initial={{opacity: 0, y: 16}}
      transition={{duration: 0.3, delay: index * 0.06}}
      type="button"
      viewport={{once: true}}
      whileInView={{opacity: 1, y: 0}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => notifyInfo(`${item.title} upload opens when storage is connected`)}
    >
      <motion.div
        animate={{opacity: hovered ? 0.55 : 0, scale: hovered ? 1 : 0.8}}
        className="pointer-events-none absolute -bottom-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-md"
        style={{
          background: `radial-gradient(circle, ${item.blob} 0%, transparent 70%)`,
        }}
        transition={{duration: 0.3, ease: "easeOut"}}
      />
      <Icon className="text-foreground relative size-5" />
      <span className="text-foreground relative text-sm font-medium">{item.title}</span>
      <span className="text-muted relative text-xs leading-snug">{item.description}</span>
      <div className="relative mt-auto flex items-center justify-between">
        <Chip
          className="self-start"
          color={statusColor}
          size="sm"
          variant="soft"
        >
          {item.status}
        </Chip>
        {item.status === "Not started" ? (
          <span className="text-muted text-xs">Click to get started</span>
        ) : null}
      </div>
    </motion.button>
  );
}
