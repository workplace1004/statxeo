"use client";

import { motion } from "motion/react";

import {
  easeOut,
  sceneColors,
  SCENE_VIEWBOX,
  useSceneAnimation,
  type FeatureSceneProps,
} from "./scene-shared";

const PHONE = { x: 24, y: 12, w: 48, h: 76, rx: 10 } as const;
const PHONE_CX = PHONE.x + PHONE.w / 2;

const BUBBLES = [
  { w: 36, h: 11, y: 30, fromLeft: true, delay: 0.18 },
  { w: 34, h: 11, y: 46, fromLeft: false, delay: 0.34 },
  { w: 38, h: 11, y: 62, fromLeft: true, delay: 0.5 },
] as const;

function bubbleX(width: number) {
  return PHONE_CX - width / 2;
}

export function CallingScene({ active }: FeatureSceneProps) {
  const { animate, showEndState, staticOnly } = useSceneAnimation(active);
  const on = animate || showEndState || staticOnly;
  const playMotion = animate;

  return (
    <svg
      viewBox={SCENE_VIEWBOX}
      className="h-full w-full text-white"
      aria-hidden
    >
      {/* Phone body */}
      <rect
        x={PHONE.x}
        y={PHONE.y}
        width={PHONE.w}
        height={PHONE.h}
        rx={PHONE.rx}
        fill={sceneColors.fillDeep}
        stroke={sceneColors.stroke}
        strokeWidth="1.2"
      />
      <rect
        x={PHONE_CX - 10}
        y={PHONE.y + 4}
        width="20"
        height="4"
        rx="2"
        fill={sceneColors.fill}
      />

      {/* Chat bubbles — horizontally centered in phone */}
      {BUBBLES.map((b, i) => {
        const x = bubbleX(b.w);
        const slideX = b.fromLeft ? -10 : 10;

        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, x: slideX }}
            animate={
              on ? { opacity: 1, x: 0 } : { opacity: 0, x: slideX }
            }
            transition={{
              duration: 0.35,
              delay: on && playMotion ? b.delay : 0,
              ease: easeOut,
            }}
          >
            <rect
              x={x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="5.5"
              fill={i % 2 === 0 ? sceneColors.fill : sceneColors.accent}
              opacity={0.92}
            />
            <rect
              x={x + b.w / 2 - (b.w - 14) / 2}
              y={b.y + 3}
              width={b.w - 14}
              height="2"
              rx="1"
              fill="rgba(255,255,255,0.38)"
            />
            <rect
              x={x + b.w / 2 - (b.w - 22) / 2}
              y={b.y + 6.5}
              width={b.w - 22}
              height="2"
              rx="1"
              fill="rgba(255,255,255,0.22)"
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
