"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

const NODES = [
  { cx: 24, cy: 48, label: "Trigger" },
  { cx: 48, cy: 28, label: "If" },
  { cx: 72, cy: 52, label: "Send" },
];

const PATHS = [
  "M24 48 L48 28",
  "M48 28 L72 52",
];

export function AiAutomationScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Connection lines */}
      {PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke={sceneColors.accent}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={
            on
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 0, opacity: 0.3 }
          }
          transition={{
            duration: 0.5,
            delay: on ? 0.1 + i * 0.15 : 0,
            ease: easeOut,
          }}
        />
      ))}

      {/* Nodes */}
      {NODES.map((node, i) => (
        <motion.g
          key={node.label}
          initial={{ opacity: 0.35, scale: 0.85 }}
          animate={
            on
              ? { opacity: 1, scale: [0.85, 1.08, 1] }
              : { opacity: 0.35, scale: 0.85 }
          }
          transition={{
            duration: 0.4,
            delay: on ? 0.25 + i * 0.12 : 0,
            ease: easeOut,
          }}
        >
          <rect
            x={node.cx - 12}
            y={node.cy - 8}
            width="24"
            height="16"
            rx="4"
            fill={sceneColors.fillDeep}
            stroke={sceneColors.stroke}
            strokeWidth="0.75"
          />
          <text
            x={node.cx}
            y={node.cy + 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.75)"
            fontSize="5"
            fontFamily="system-ui, sans-serif"
          >
            {node.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
