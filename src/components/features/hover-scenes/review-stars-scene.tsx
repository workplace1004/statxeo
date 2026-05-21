"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

const STAR_PATH =
  "M0,-5 L1.5,-1.5 L5,-1 L2.2,1.2 L3,5 L0,3 L-3,5 L-2.2,1.2 L-5,-1 L-1.5,-1.5 Z";

const STAR_CENTERS = [26, 36, 46, 56, 66] as const;
const STAR_Y = 68;
const STAR_STAGGER = 0.11;
const STAR_BASE_DELAY = 0.42;

export function ReviewStarsScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;
  const playMotion = animate;

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Review card */}
      <motion.g
        initial={{ opacity: 0.45, y: 3 }}
        animate={on ? { opacity: 1, y: 0 } : { opacity: 0.45, y: 3 }}
        transition={{
          duration: 0.35,
          delay: on && playMotion ? 0 : 0,
          ease: easeOut,
        }}
      >
        <rect
          x="14"
          y="16"
          width="68"
          height="62"
          rx="7"
          fill={sceneColors.fillDeep}
          stroke={sceneColors.stroke}
          strokeWidth="1"
        />

        {/* Reviewer avatar + preview lines */}
        <circle
          cx="24"
          cy="28"
          r="5"
          fill={sceneColors.fill}
          stroke={sceneColors.strokeMuted}
          strokeWidth="0.75"
        />
        {[0, 1].map((i) => (
          <motion.rect
            key={i}
            x="34"
            y={24 + i * 7}
            width={i === 0 ? 38 : 28}
            height="3"
            rx="1.5"
            fill={sceneColors.fill}
            initial={{ opacity: 0.25, scaleX: 0.5 }}
            animate={
              on
                ? { opacity: 0.55, scaleX: 1 }
                : { opacity: 0.25, scaleX: 0.5 }
            }
            transition={{
              duration: 0.35,
              delay: on && playMotion ? 0.12 + i * 0.08 : 0,
              ease: easeOut,
            }}
            style={{ transformOrigin: "left center" }}
          />
        ))}

        {/* Review quote */}
        <motion.text
          x="48"
          y="50"
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize="7.5"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={on ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: 0.3,
            delay: on && playMotion ? 0.28 : 0,
            ease: easeOut,
          }}
        >
          Great work
        </motion.text>
      </motion.g>

      {/* Star rating row */}
      {STAR_CENTERS.map((cx, i) => {
        const starDelay =
          on && playMotion ? STAR_BASE_DELAY + i * STAR_STAGGER : 0;
        const filled = on;
        const isLast = i === 4;

        return (
          <g key={cx} transform={`translate(${cx}, ${STAR_Y})`}>
            {/* Glow behind filled stars */}
            <motion.circle
              cx="0"
              cy="0"
              r="7"
              fill={sceneColors.accent}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={
                filled
                  ? { opacity: [0, 0.35, 0.15], scale: [0.4, 1.2, 1] }
                  : { opacity: 0, scale: 0.4 }
              }
              transition={{
                duration: 0.45,
                delay: starDelay,
                ease: easeOut,
              }}
            />

            {/* Empty outline (idle) */}
            <path
              d={STAR_PATH}
              fill="none"
              stroke={sceneColors.strokeMuted}
              strokeWidth="0.6"
              opacity={filled ? 0 : 0.5}
            />

            {/* Filled star — pop in sequentially */}
            <motion.g
              initial={{ opacity: 0.15, scale: 0.35 }}
              animate={
                filled
                  ? { opacity: 1, scale: [0.35, 1.2, 1] }
                  : { opacity: 0.15, scale: 0.35 }
              }
              transition={{
                duration: 0.42,
                delay: starDelay,
                ease: easeOut,
              }}
              style={{ transformOrigin: "center" }}
            >
              <path
                d={STAR_PATH}
                fill={isLast ? sceneColors.gold : sceneColors.accentBright}
                stroke={isLast ? sceneColors.gold : sceneColors.accent}
                strokeWidth="0.35"
              />
            </motion.g>

            {/* Sparkle on 5th star when sequence completes */}
            {isLast && (
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={
                  filled && playMotion
                    ? { opacity: [0, 1, 0], scale: [0.5, 1.4, 1.6] }
                    : filled
                      ? { opacity: 0.6, scale: 1 }
                      : { opacity: 0, scale: 0 }
                }
                transition={{
                  duration: 0.5,
                  delay: starDelay + 0.35,
                  ease: easeOut,
                }}
              >
                <line
                  x1="0"
                  y1="-9"
                  x2="0"
                  y2="-12"
                  stroke={sceneColors.gold}
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <line
                  x1="9"
                  y1="0"
                  x2="12"
                  y2="0"
                  stroke={sceneColors.gold}
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </motion.g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
