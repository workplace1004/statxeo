"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

const COLS = 4;
const ROWS = 3;
const CELL = 14;
const START_X = 18;
const START_Y = 22;

export function SocialCalendarScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;
  const targetCol = 2;
  const targetRow = 1;
  const cellX = START_X + targetCol * (CELL + 2);
  const cellY = START_Y + targetRow * (CELL + 2);

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Calendar grid */}
      {Array.from({ length: ROWS * COLS }).map((_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const isTarget = col === targetCol && row === targetRow;
        return (
          <rect
            key={i}
            x={START_X + col * (CELL + 2)}
            y={START_Y + row * (CELL + 2)}
            width={CELL}
            height={CELL}
            rx="2"
            fill={isTarget && on ? sceneColors.fill : sceneColors.fillDeep}
            stroke={
              isTarget && on ? sceneColors.accent : sceneColors.strokeMuted
            }
            strokeWidth={isTarget && on ? 1 : 0.5}
          />
        );
      })}

      {/* Thumbnail sliding into cell */}
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={
          on
            ? { x: 0, opacity: 1 }
            : { x: -20, opacity: 0 }
        }
        transition={{
          duration: 0.5,
          delay: on ? 0.15 : 0,
          ease: easeOut,
        }}
      >
        <rect
          x={cellX + 2}
          y={cellY + 2}
          width={CELL - 4}
          height={CELL - 4}
          rx="1.5"
          fill={sceneColors.accent}
          opacity={0.85}
        />
        <path
          d={`M${cellX + 5} ${cellY + 8} L${cellX + 7} ${cellY + 10} L${cellX + 11} ${cellY + 6}`}
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Floating image card before placement */}
      <motion.rect
        x="62"
        y="30"
        width="16"
        height="12"
        rx="2"
        fill={sceneColors.fill}
        stroke={sceneColors.stroke}
        strokeWidth="0.5"
        initial={{ x: 0, opacity: on ? 0 : 0.5 }}
        animate={
          on && animate
            ? { x: -28, opacity: 0 }
            : { x: 0, opacity: on ? 0 : 0.5 }
        }
        transition={{ duration: 0.45, delay: on ? 0.05 : 0, ease: easeOut }}
      />
    </svg>
  );
}
