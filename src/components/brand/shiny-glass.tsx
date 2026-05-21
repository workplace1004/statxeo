"use client";

import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import { useShinyProgress } from "@/hooks/use-shiny-progress";
import { cn } from "@/lib/utils";

import { shinyGlassGradient, SHINY_GLASS } from "./shiny-glass-tokens";
import "./shiny-glass.css";

type ShinyGlassBaseProps = {
  children?: ReactNode;
  className?: string;
  soft?: boolean;
  speed?: number;
  spread?: number;
};

function useShinyGlassStyle(soft: boolean, speed: number, spread: number) {
  const { backgroundPosition, onMouseEnter, onMouseLeave } = useShinyProgress({
    speed,
  });

  return {
    className: cn("shiny-glass", soft && "shiny-glass--soft"),
    style: {
      backgroundImage: shinyGlassGradient(spread, soft),
      backgroundSize: "200% auto",
      backgroundPosition,
    },
    onMouseEnter,
    onMouseLeave,
    children: (content?: ReactNode) =>
      content != null && content !== false ? (
        <span className="shiny-glass__content">{content}</span>
      ) : null,
  };
}

export function ShinyGlassDiv({
  children,
  className,
  soft = false,
  speed = 2.8,
  spread = 125,
  ...rest
}: ShinyGlassBaseProps & HTMLMotionProps<"div">) {
  const glass = useShinyGlassStyle(soft, speed, spread);
  return (
    <motion.div
      className={cn(glass.className, className)}
      style={{ ...glass.style, ...rest.style }}
      onMouseEnter={glass.onMouseEnter}
      onMouseLeave={glass.onMouseLeave}
      {...rest}
    >
      {glass.children(children)}
    </motion.div>
  );
}

export function ShinyGlassSpan({
  children,
  className,
  soft = false,
  speed = 2.8,
  spread = 125,
  ...rest
}: ShinyGlassBaseProps & HTMLMotionProps<"span">) {
  const glass = useShinyGlassStyle(soft, speed, spread);
  return (
    <motion.span
      className={cn(glass.className, className)}
      style={{ ...glass.style, ...rest.style }}
      onMouseEnter={glass.onMouseEnter}
      onMouseLeave={glass.onMouseLeave}
      {...rest}
    >
      {glass.children(children)}
    </motion.span>
  );
}

export function ShinyGlassButton({
  children,
  className,
  soft = false,
  speed = 2.8,
  spread = 125,
  ...rest
}: ShinyGlassBaseProps & HTMLMotionProps<"button">) {
  const glass = useShinyGlassStyle(soft, speed, spread);
  return (
    <motion.button
      type="button"
      className={cn(glass.className, className)}
      style={{ ...glass.style, ...rest.style }}
      onMouseEnter={glass.onMouseEnter}
      onMouseLeave={glass.onMouseLeave}
      {...rest}
    >
      {glass.children(children)}
    </motion.button>
  );
}

const ctaSizes = {
  sm: "px-5 py-2 text-sm",
  md: "px-6 py-2.5 text-sm sm:text-base",
  lg: "px-8 py-3.5 text-sm sm:text-base",
} as const;

export function ShinyCta({
  children,
  className,
  size = "md",
  rounded = "rounded-xl",
  href,
  ...motionProps
}: ShinyGlassBaseProps & {
  href: string;
  size?: keyof typeof ctaSizes;
  rounded?: string;
} & Omit<HTMLMotionProps<"a">, "children" | "className">) {
  const glass = useShinyGlassStyle(false, 2.8, 125);
  return (
    <motion.a
      href={href}
      className={cn(
        glass.className,
        "inline-flex cursor-pointer items-center justify-center font-medium text-white no-underline transition-transform hover:scale-[1.02]",
        ctaSizes[size],
        rounded,
        className,
      )}
      style={glass.style}
      onMouseEnter={glass.onMouseEnter}
      onMouseLeave={glass.onMouseLeave}
      {...motionProps}
    >
      <span className="shiny-glass__content">{children}</span>
    </motion.a>
  );
}

export function ShinyBadge({
  children,
  className,
  soft = true,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <ShinyGlassSpan
      soft={soft}
      speed={3.2}
      className={cn(
        "relative z-10 inline-flex w-fit max-w-full shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase",
        className,
      )}
    >
      {children}
    </ShinyGlassSpan>
  );
}

export function ShinyDot({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "size-5 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-xs sm:text-sm"
        : "h-10 w-10 sm:h-12 sm:w-12 text-xs sm:text-sm";

  return (
    <ShinyGlassSpan
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClass,
        className,
      )}
    >
      {children}
    </ShinyGlassSpan>
  );
}

export function ShinyAccent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-medium text-[#1e4a32] dark:text-[#8fd4a8]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export { SHINY_GLASS, shinyGlassGradient };
