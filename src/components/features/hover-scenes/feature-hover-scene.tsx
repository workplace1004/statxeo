"use client";

import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

import { AiAutomationScene } from "./ai-automation-scene";
import { CallingScene } from "./calling-scene";
import { ReviewStarsScene } from "./review-stars-scene";
import { SeoSearchScene } from "./seo-search-scene";
import { SocialCalendarScene } from "./social-calendar-scene";
import type { FeatureSceneProps } from "./scene-shared";
import { WebsiteBuilderScene } from "./website-builder-scene";

export type FeatureSceneId =
  | "website-builder"
  | "seo-xeo"
  | "social-calendar"
  | "review-management"
  | "calling"
  | "ai-assistant";

const SCENES: Record<
  FeatureSceneId,
  ComponentType<FeatureSceneProps>
> = {
  "website-builder": WebsiteBuilderScene,
  "seo-xeo": SeoSearchScene,
  "social-calendar": SocialCalendarScene,
  "review-management": ReviewStarsScene,
  calling: CallingScene,
  "ai-assistant": AiAutomationScene,
};

export function FeatureHoverScene({
  id,
  active,
  className,
}: {
  id: FeatureSceneId;
  active: boolean;
  className?: string;
}) {
  const Scene = SCENES[id];

  return (
    <div
      className={cn(
        "mx-auto flex h-[92px] w-[92px] items-center justify-center sm:h-[110px] sm:w-[110px]",
        className,
      )}
      aria-hidden
    >
      <Scene active={active} />
    </div>
  );
}
