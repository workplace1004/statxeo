"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export interface LiquidLinesProps {
  /** Width of the component */
  width?: string | number;
  /** Height of the component */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Number of iterations for detail (higher = more detailed but slower) */
  iterations?: number;
  /** Wave frequency - controls how many waves appear */
  waveFrequency?: number;
  /** Depth progression - how much depth changes per iteration */
  depthStep?: number;
  /** Line thickness - controls the thickness of the lines */
  lineThickness?: number;
  /** Wave amplitude - how much the waves displace */
  waveAmplitude?: number;
  /** Primary line color */
  lineColor?: string;
  /** Background color for light mode */
  lightBackground?: string;
  /** Background color for dark mode */
  darkBackground?: string;
  /** Brightness multiplier */
  brightness?: number;
  /** Contrast adjustment */
  contrast?: number;
  /** Horizontal offset */
  offsetX?: number;
  /** Vertical offset */
  offsetY?: number;
  /** Pattern scale */
  scale?: number;
  /** Alpha/opacity of the effect */
  opacity?: number;
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform int u_iterations;
uniform float u_waveFrequency;
uniform float u_depthStep;
uniform float u_lineThickness;
uniform float u_waveAmplitude;
uniform vec3 u_lineColor;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_scale;
uniform float u_opacity;

varying vec2 vUv;

void main() {
  float time = u_time * u_speed;
  vec2 resolution = u_resolution;

  vec3 accumulator = vec3(0.0);
  float depth = time;
  float magnitude = 0.0;

  vec2 baseCoord = (vUv - 0.5) * 2.0;
  baseCoord.x *= resolution.x / resolution.y;
  baseCoord *= u_scale;
  baseCoord += vec2(u_offsetX, u_offsetY);

  for (int i = 0; i < 100; i++) {
    if (i >= u_iterations) break;

    vec2 coord = baseCoord;
    vec2 waveCoord = coord;

    coord -= waveCoord.x + 0.1;
    coord.x *= resolution.x / resolution.y;

    depth += u_depthStep;
    magnitude = length(coord);

    float phase1 = depth * 0.7;
    float phase2 = depth * 1.3;
    float wave1 = sin(phase1) * 0.5 + cos(phase2) * 0.5 + 1.5;
    float wave2 = sin(magnitude * u_waveFrequency - depth) * 0.7 + cos(magnitude * u_waveFrequency * 0.5 + depth * 0.3) * 0.3;
    waveCoord += coord / max(magnitude, 0.01) * wave1 * wave2 * u_waveAmplitude;

    vec2 gridPos = mod(waveCoord, 1.0) - 0.5;
    float lineIntensity = u_lineThickness / length(gridPos);

    if (i == 0) accumulator.r = lineIntensity;
    else if (i == 1) accumulator.g = lineIntensity;
    else if (i == 2) accumulator.b = lineIntensity;
    else {
      accumulator += vec3(lineIntensity) * 0.01;
    }
  }

  accumulator = accumulator / max(magnitude, 0.001);

  accumulator = (accumulator - 0.5) * u_contrast + 0.5;
  accumulator *= u_brightness;

  vec3 finalColor = accumulator * u_lineColor;

  float alpha = clamp(length(accumulator) * u_opacity, 0.0, 1.0);
  finalColor = mix(u_backgroundColor, finalColor, alpha);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface ShaderPlaneProps {
  speed: number;
  iterations: number;
  waveFrequency: number;
  depthStep: number;
  lineThickness: number;
  waveAmplitude: number;
  lineColor: string;
  backgroundColor: string;
  brightness: number;
  contrast: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  opacity: number;
}

const ShaderPlane: React.FC<ShaderPlaneProps> = ({
  speed,
  iterations,
  waveFrequency,
  depthStep,
  lineThickness,
  waveAmplitude,
  lineColor,
  backgroundColor,
  brightness,
  contrast,
  offsetX,
  offsetY,
  scale,
  opacity,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(viewport.width * 100, viewport.height * 100),
      },
      u_speed: { value: speed },
      u_iterations: { value: iterations },
      u_waveFrequency: { value: waveFrequency },
      u_depthStep: { value: depthStep },
      u_lineThickness: { value: lineThickness },
      u_waveAmplitude: { value: waveAmplitude },
      u_lineColor: { value: new THREE.Color(lineColor) },
      u_backgroundColor: { value: new THREE.Color(backgroundColor) },
      u_brightness: { value: brightness },
      u_contrast: { value: contrast },
      u_offsetX: { value: offsetX },
      u_offsetY: { value: offsetY },
      u_scale: { value: scale },
      u_opacity: { value: opacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.u_resolution.value.set(
        viewport.width * 100,
        viewport.height * 100,
      );
      materialRef.current.uniforms.u_speed.value = speed;
      materialRef.current.uniforms.u_iterations.value = iterations;
      materialRef.current.uniforms.u_waveFrequency.value = waveFrequency;
      materialRef.current.uniforms.u_depthStep.value = depthStep;
      materialRef.current.uniforms.u_lineThickness.value = lineThickness;
      materialRef.current.uniforms.u_waveAmplitude.value = waveAmplitude;
      materialRef.current.uniforms.u_lineColor.value.set(lineColor);
      materialRef.current.uniforms.u_backgroundColor.value.set(backgroundColor);
      materialRef.current.uniforms.u_brightness.value = brightness;
      materialRef.current.uniforms.u_contrast.value = contrast;
      materialRef.current.uniforms.u_offsetX.value = offsetX;
      materialRef.current.uniforms.u_offsetY.value = offsetY;
      materialRef.current.uniforms.u_scale.value = scale;
      materialRef.current.uniforms.u_opacity.value = opacity;
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const LiquidLines: React.FC<LiquidLinesProps> = ({
  width = "100%",
  height = "100%",
  className = "",
  speed = 0.4,
  iterations = 3,
  waveFrequency = 49,
  depthStep = 0.05,
  lineThickness = 0.009,
  waveAmplitude = 0.6,
  lineColor = "#ffffff",
  lightBackground = "#ffffff",
  darkBackground = "#000000",
  brightness = 2.5,
  contrast = 1.1,
  offsetX = 0,
  offsetY = 0,
  scale = 0.3,
  opacity = 1,
}) => {
  const { resolvedTheme } = useTheme();

  const backgroundColor =
    resolvedTheme === "dark" ? darkBackground : lightBackground;

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    >
      <Canvas
        className="absolute inset-0 h-full w-full"
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 1], fov: 75 }}
      >
        <ShaderPlane
          speed={speed}
          iterations={iterations}
          waveFrequency={waveFrequency}
          depthStep={depthStep}
          lineThickness={lineThickness}
          waveAmplitude={waveAmplitude}
          lineColor={lineColor}
          backgroundColor={backgroundColor}
          brightness={brightness}
          contrast={contrast}
          offsetX={offsetX}
          offsetY={offsetY}
          scale={scale}
          opacity={opacity}
        />
      </Canvas>
    </div>
  );
};

LiquidLines.displayName = "LiquidLines";

export default LiquidLines;
