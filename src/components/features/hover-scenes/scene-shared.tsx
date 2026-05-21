"use client";

import { useEffect, useState } from "react";

import { SHINY_GLASS } from "@/components/brand/shiny-glass-tokens";

export const SCENE_SIZE = 96;
export const SCENE_VIEWBOX = `0 0 ${SCENE_SIZE} ${SCENE_SIZE}`;

export const sceneColors = {
  stroke: "rgba(255, 255, 255, 0.55)",
  strokeMuted: "rgba(255, 255, 255, 0.28)",
  fill: SHINY_GLASS.mid,
  fillDeep: SHINY_GLASS.deep,
  accent: SHINY_GLASS.shine,
  accentBright: SHINY_GLASS.shineBright,
  gold: "#c9a227",
} as const;

export type FeatureSceneProps = {
  active: boolean;
};

export function useSceneAnimation(active: boolean) {
  const [canHover, setCanHover] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const hoverMq = window.matchMedia("(hover: hover)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setCanHover(hoverMq.matches);
      setReduceMotion(motionMq.matches);
    };

    update();
    hoverMq.addEventListener("change", update);
    motionMq.addEventListener("change", update);
    return () => {
      hoverMq.removeEventListener("change", update);
      motionMq.removeEventListener("change", update);
    };
  }, []);

  const animate = active && canHover && !reduceMotion;
  const showEndState = reduceMotion && canHover;

  return { animate, showEndState, staticOnly: !canHover };
}

export const easeOut = [0.25, 0.1, 0.25, 1] as const;
