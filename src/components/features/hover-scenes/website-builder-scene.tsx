"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

export function WebsiteBuilderScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Browser chrome */}
      <rect
        x="14"
        y="14"
        width="68"
        height="68"
        rx="6"
        fill={sceneColors.fillDeep}
        stroke={sceneColors.stroke}
        strokeWidth="1"
      />
      <circle cx="22" cy="22" r="2" fill={sceneColors.strokeMuted} />
      <circle cx="28" cy="22" r="2" fill={sceneColors.strokeMuted} />
      <circle cx="34" cy="22" r="2" fill={sceneColors.strokeMuted} />
      <rect
        x="22"
        y="28"
        width="52"
        height="6"
        rx="3"
        fill={sceneColors.fill}
        stroke={sceneColors.strokeMuted}
        strokeWidth="0.5"
      />

      {/* Content blocks */}
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          x="22"
          y={38 + i * 12}
          width={i === 0 ? 52 : i === 1 ? 40 : 28}
          height="8"
          rx="2"
          fill={sceneColors.fill}
          stroke={sceneColors.strokeMuted}
          strokeWidth="0.5"
          initial={{ opacity: 0.2, scaleX: 0.6 }}
          animate={
            on
              ? { opacity: 1, scaleX: 1 }
              : { opacity: 0.2, scaleX: 0.6 }
          }
          transition={{
            duration: 0.4,
            delay: on ? 0.1 + i * 0.12 : 0,
            ease: easeOut,
          }}
          style={{ transformOrigin: "left center" }}
        />
      ))}

      {/* Progress bar track */}
      <rect
        x="22"
        y="74"
        width="52"
        height="4"
        rx="2"
        fill={sceneColors.fill}
      />
      <motion.rect
        x="22"
        y="74"
        width="52"
        height="4"
        rx="2"
        fill={sceneColors.accent}
        initial={{ scaleX: 0 }}
        animate={on ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{
          duration: 0.8,
          delay: on ? 0.45 : 0,
          ease: easeOut,
        }}
        style={{ transformOrigin: "left center" }}
      />
    </svg>
  );
}
