"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import ShaderWaves from "@/components/react-bits/shader-waves";
import { cn } from "@/lib/utils";

export interface ShaderCardProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: string;
  speed?: number;
  className?: string;
  fragmentShader?: string;
  autoPlay?: boolean;
  color?: string;
  color1?: string;
  color2?: string;
  positionY?: number;
  scale?: number;
  effectRadius?: number;
  effectBoost?: number;
  edgeMin?: number;
  edgeMax?: number;
  falloffPower?: number;
  noiseScale?: number;
  widthFactor?: number;
  waveAmount?: number;
  branchIntensity?: number;
  verticalExtent?: number;
  horizontalExtent?: number;
  blur?: number;
  opacity?: number;
  interactive?: boolean;
  children?: React.ReactNode;
}

const ShaderCard: React.FC<ShaderCardProps> = (props) => {
  const {
    width = 400,
    height = 500,
    borderRadius = "12px",
    speed = 1,
    className = "",
    autoPlay = true,
    color = "#FF9FFC",
    color1,
    color2,
    scale = 3,
    effectBoost = 0.5,
    branchIntensity = 0.5,
    blur = 0,
    opacity = 1,
    interactive = true,
    children,
  } = props;

  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  const waveColors = useMemo(
    () => ({
      first: color1 ?? color,
      second: color2 ?? "#38bdf8",
    }),
    [color, color1, color2],
  );

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden border border-white/10 bg-card shadow-lg",
        className,
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
        borderRadius,
        transformStyle: "preserve-3d",
      }}
      animate={tilt}
      whileHover={interactive ? { scale: 1.012 } : undefined}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.45 }}
      onMouseMove={(event) => {
        if (!interactive) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({ rotateX: y * -8, rotateY: x * 10 });
      }}
      onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
    >
      <ShaderWaves
        className="absolute inset-0"
        speed={autoPlay ? speed : 0.00001}
        color1={waveColors.first}
        color2={waveColors.second}
        frequency={Math.max(0.7, scale * 0.34)}
        intensity={Math.max(0.4, effectBoost * 1.9)}
        complexity={Math.max(0.6, branchIntensity * 2)}
        opacity={opacity}
        transparent
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.2),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.58))]" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/14" />
      <div className="pointer-events-none absolute -inset-x-14 top-0 h-20 bg-white/12 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-70" />

      {children ? <div className="relative z-10 flex h-full w-full flex-col">{children}</div> : null}
    </motion.div>
  );
};

ShaderCard.displayName = "ShaderCard";

export default ShaderCard;