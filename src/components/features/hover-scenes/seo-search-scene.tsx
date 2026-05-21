"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

const KEYWORDS = [
  { label: "plumber", x: 10, delay: 0.55 },
  { label: "near me", x: 38, delay: 0.68 },
  { label: "24/7", x: 66, delay: 0.81 },
] as const;

const SERP_LINES = [
  { w: 52, rank: 4, delay: 0.32 },
  { w: 44, rank: 2, delay: 0.48 },
  { w: 48, rank: 1, delay: 0.64 },
] as const;

export function SeoSearchScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;
  const playMotion = animate;

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Search bar */}
      <motion.g
        initial={{ opacity: 0.4, y: 2 }}
        animate={on ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 2 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <rect
          x="10"
          y="14"
          width="76"
          height="20"
          rx="10"
          fill={sceneColors.fillDeep}
          stroke={sceneColors.stroke}
          strokeWidth="1"
        />
        <circle
          cx="78"
          cy="24"
          r="5.5"
          fill="none"
          stroke={sceneColors.stroke}
          strokeWidth="1"
        />
        <line
          x1="82"
          y1="28"
          x2="86"
          y2="32"
          stroke={sceneColors.stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Typed query */}
        <motion.text
          x="20"
          y="27"
          fill="rgba(255,255,255,0.85)"
          fontSize="6.5"
          fontWeight="500"
          fontFamily="system-ui, sans-serif"
          initial={{ opacity: 0 }}
          animate={on ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: 0.25,
            delay: on && playMotion ? 0.18 : 0,
            ease: easeOut,
          }}
        >
          plumber near me
        </motion.text>

        {/* Blinking cursor */}
        <motion.rect
          x="68"
          y="19"
          width="1.5"
          height="10"
          rx="0.5"
          fill={sceneColors.accentBright}
          animate={
            on && playMotion
              ? { opacity: [1, 0, 1] }
              : { opacity: on ? 0.8 : 0.25 }
          }
          transition={
            on && playMotion
              ? { duration: 0.75, repeat: Infinity, ease: "linear" }
              : { duration: 0.2 }
          }
        />
      </motion.g>

      {/* XEO score badge */}
      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={
          on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }
        }
        transition={{
          duration: 0.35,
          delay: on && playMotion ? 0.38 : 0,
          ease: easeOut,
        }}
      >
        <rect
          x="72"
          y="8"
          width="18"
          height="12"
          rx="4"
          fill={sceneColors.accent}
          stroke={sceneColors.accentBright}
          strokeWidth="0.5"
        />
        <text
          x="81"
          y="16.5"
          textAnchor="middle"
          fill="white"
          fontSize="5.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          XEO
        </text>
      </motion.g>

      {/* SERP results climbing ranks */}
      {SERP_LINES.map((line, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
          transition={{
            duration: 0.35,
            delay: on && playMotion ? line.delay : 0,
            ease: easeOut,
          }}
        >
          <text
            x="14"
            y={40 + i * 11}
            fill={
              line.rank === 1
                ? sceneColors.accentBright
                : sceneColors.strokeMuted
            }
            fontSize="5"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            #{line.rank}
          </text>
          <rect
            x="24"
            y={36 + i * 11}
            width={line.w}
            height="6"
            rx="3"
            fill={sceneColors.fill}
            stroke={
              line.rank === 1 ? sceneColors.accent : sceneColors.strokeMuted
            }
            strokeWidth={line.rank === 1 ? 0.75 : 0.4}
          />
          {line.rank === 1 && (
            <motion.path
              d={`M${24 + line.w + 4} ${39 + i * 11} l2 2 4-5`}
              fill="none"
              stroke={sceneColors.accentBright}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                on ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
              }
              transition={{
                duration: 0.3,
                delay: on && playMotion ? line.delay + 0.15 : 0,
                ease: easeOut,
              }}
            />
          )}
        </motion.g>
      ))}

      {/* Keyword pills */}
      {KEYWORDS.map((kw) => (
        <motion.g
          key={kw.label}
          initial={{ opacity: 0, scale: 0.6, y: 4 }}
          animate={
            on
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.6, y: 4 }
          }
          transition={{
            duration: 0.32,
            delay: on && playMotion ? kw.delay : 0,
            ease: easeOut,
          }}
        >
          <rect
            x={kw.x}
            y="74"
            width="22"
            height="13"
            rx="6.5"
            fill={sceneColors.fill}
            stroke={sceneColors.accent}
            strokeWidth="0.75"
          />
          <text
            x={kw.x + 11}
            y="83.5"
            textAnchor="middle"
            fill="rgba(255,255,255,0.75)"
            fontSize="5.5"
            fontFamily="system-ui, sans-serif"
          >
            {kw.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
