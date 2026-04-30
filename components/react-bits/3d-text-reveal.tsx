"use client";

import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ThreeDTextRevealProps {
  items: string[];
  className?: string;
  textClassName?: string;
  scrollDistance?: string;
  perspective?: number;
  radiusOffset?: number;
  startRotation?: number;
  endRotation?: number;
  scrubSmoothing?: number;
  fontSize?: string;
  fontWeight?: number;
  gap?: number;
}

const XEO_CORE_CLASSNAME =
  "relative bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent [filter:drop-shadow(0_0_10px_rgba(236,72,153,0.55))_drop-shadow(0_0_22px_rgba(124,58,237,0.65))_drop-shadow(0_0_34px_rgba(34,211,238,0.45))]";

const XEO_INNER_GLOW_CLASSNAME =
  "absolute inset-0 bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent opacity-90 blur-[1.5px]";

const XEO_OUTER_BLOOM_CLASSNAME =
  "absolute inset-0 bg-gradient-to-r from-fuchsia-400/80 via-violet-400/80 to-cyan-300/80 bg-clip-text text-transparent opacity-70 blur-[10px]";

const XEO_TOKEN_SPLIT_REGEX = /(XEO)/gi;
const XEO_TOKEN_TEST_REGEX = /XEO/i;

function renderItemWithXeoGlow(item: string): React.ReactNode {
  if (!XEO_TOKEN_TEST_REGEX.test(item)) {
    return item;
  }

  return item.split(XEO_TOKEN_SPLIT_REGEX).map((part, index) => {
    if (part.toUpperCase() === "XEO") {
      return (
        <span
          key={`xeo-${index}`}
          className="relative inline-block align-baseline animate-[pulse_2.6s_ease-in-out_infinite]"
        >
          <span aria-hidden className={XEO_OUTER_BLOOM_CLASSNAME}>
            {part}
          </span>
          <span aria-hidden className={XEO_INNER_GLOW_CLASSNAME}>
            {part}
          </span>
          <span className={XEO_CORE_CLASSNAME}>{part}</span>
        </span>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

const ThreeDTextReveal: React.FC<ThreeDTextRevealProps> = ({
  items = ["Scroll", "To", "Reveal", "3D", "Text"],
  className = "",
  textClassName = "",
  scrollDistance = "300vh",
  perspective = 1000,
  radiusOffset = 0.4,
  startRotation = -80,
  endRotation = 270,
  scrubSmoothing = 1,
  fontSize = "clamp(3rem, 9vw, 7rem)",
  fontWeight = 900,
  gap = 15,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!wrapperRef.current || !containerRef.current) return;

      const updatePositions = () => {
        if (!containerRef.current) return;

        const radius = window.innerHeight * radiusOffset;

        itemsRef.current.forEach((item, index) => {
          if (!item) return;

          const angleInDegrees = index * gap;
          const angleInRadians = (angleInDegrees * Math.PI) / 180;

          const y = Math.sin(angleInRadians) * radius;
          const z = Math.cos(angleInRadians) * radius;
          const rotation = -angleInDegrees;

          gsap.set(item, {
            y: y,
            z: z,
            rotateX: rotation,
            xPercent: -50,
            yPercent: -50,
            transformOrigin: "50% 50%",
          });
        });
      };

      updatePositions();

      const refreshHandler = () => updatePositions();
      ScrollTrigger.addEventListener("refresh", refreshHandler);

      const scroller = wrapperRef.current.closest(
        "[data-scroll-container]",
      ) as HTMLElement;

      const scrollTriggerConfig: ScrollTrigger.Vars = {
        trigger: wrapperRef.current,
        start: "top top",
        end: `+=${scrollDistance}`,
        pin: true,
        scrub: scrubSmoothing,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      };

      if (scroller) {
        scrollTriggerConfig.scroller = scroller;
      }

      const timeline = gsap.timeline({
        scrollTrigger: scrollTriggerConfig,
      });

      timeline.fromTo(
        containerRef.current,
        {
          rotateX: startRotation,
        },
        {
          rotateX: endRotation,
          ease: "none",
        },
      );

      return () => {
        ScrollTrigger.removeEventListener("refresh", refreshHandler);
      };
    },
    {
      dependencies: [
        items,
        scrollDistance,
        radiusOffset,
        startRotation,
        endRotation,
        scrubSmoothing,
        gap,
      ],
      scope: wrapperRef,
    },
  );

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full h-screen overflow-hidden flex flex-col items-center justify-center",
        className,
      )}
      style={{
        perspective: `${perspective}px`,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 text-center"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            ref={(el) => {
              itemsRef.current[index] = el;
            }}
            className={cn(
              "absolute top-1/2 left-1/2 whitespace-nowrap font-black uppercase",
              textClassName,
            )}
            style={{
              fontSize: fontSize,
              fontWeight: fontWeight,
              backfaceVisibility: "hidden",
              willChange: "transform",
            }}
          >
            {renderItemWithXeoGlow(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

ThreeDTextReveal.displayName = "ThreeDTextReveal";

export default ThreeDTextReveal;
