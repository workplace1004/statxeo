"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export interface GrainWaveProps {
  /** Width of the component */
  width?: string | number;
  /** Height of the component */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Number of wave lines */
  waveCount?: number;
  /** Wave amplitude/height */
  waveAmplitude?: number;
  /** Horizontal wave frequency */
  waveFrequency?: number;
  /** Line thickness */
  lineThickness?: number;
  /** Grain/dither intensity */
  grainIntensity?: number;
  /** Start color (top waves) */
  startColor?: string;
  /** End color (bottom waves) */
  endColor?: string;
  /** Background color for light mode */
  lightBackground?: string;
  /** Background color for dark mode */
  darkBackground?: string;
  /** Overall brightness */
  brightness?: number;
  /** Wave speed variation between lines */
  speedVariation?: number;
  /** Width of the wave effect (horizontal spread) */
  waveWidth?: number;
  /** Scale of the entire effect */
  scale?: number;
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
uniform float u_waveCount;
uniform float u_waveAmplitude;
uniform float u_waveFrequency;
uniform float u_lineThickness;
uniform float u_grainIntensity;
uniform vec3 u_startColor;
uniform vec3 u_endColor;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_speedVariation;
uniform float u_waveWidth;
uniform float u_scale;

varying vec2 vUv;

float generateNoise(vec2 position) {
  vec2 seed = vec2(12.9898, 78.233);
  float dotProduct = dot(position, seed);
  return fract(sin(dotProduct) * 43758.5453);
}

float applyGrain(vec2 position) {
  return (generateNoise(position) * 2.0 - 1.0) / 256.0;
}

vec4 calculateWaveLine(vec2 coord, float animSpeed, float horizontalScale, vec3 color) {
  float waveOffset = sin(u_time * animSpeed + coord.x * horizontalScale * u_waveFrequency) * u_waveAmplitude;
  float edgeFalloff = smoothstep(1.0, 0.0, abs(coord.x));
  coord.y += waveOffset * edgeFalloff;

  float lineIntensity = smoothstep(u_lineThickness, 0.0, abs(coord.y));

  float yFade = smoothstep(1.0, 0.2, abs(coord.y));
  float xFade = smoothstep(1.0, 0.3, abs(coord.x));
  float combinedFade = yFade * xFade;

  return vec4(color * lineIntensity * combinedFade, 1.0);
}

void main() {
  vec2 coord = vUv * 2.0 - 1.0;
  coord.x *= u_resolution.x / u_resolution.y;

  coord /= u_scale;

  coord.x /= u_waveWidth;

  vec4 colorAccumulator = vec4(0.0);

  for (float i = 0.0; i <= 50.0; i += 1.0) {
    if (i >= u_waveCount) break;

    float progress = i / u_waveCount * 2.0;

    float lineSpeed = u_speed + progress * u_speedVariation;

    float colorMix = i / u_waveCount;
    vec3 waveColor = mix(u_startColor, u_endColor, colorMix);

    colorAccumulator += calculateWaveLine(coord, lineSpeed, progress, waveColor);
  }

  vec3 waveColor = colorAccumulator.rgb * u_brightness;

  float waveIntensity = clamp(length(waveColor), 0.0, 1.0);
  float grain = applyGrain(coord) * u_grainIntensity * waveIntensity;
  waveColor += vec3(grain);

  float bgLuminance = dot(u_backgroundColor, vec3(0.299, 0.587, 0.114));
  vec3 finalColor;
  if (bgLuminance > 0.5) {
    float waveAlpha = clamp(length(waveColor), 0.0, 1.0);
    finalColor = mix(u_backgroundColor, waveColor, waveAlpha);
  } else {
    finalColor = u_backgroundColor + waveColor;
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface ShaderPlaneProps {
  speed: number;
  waveCount: number;
  waveAmplitude: number;
  waveFrequency: number;
  lineThickness: number;
  grainIntensity: number;
  startColor: string;
  endColor: string;
  backgroundColor: string;
  brightness: number;
  speedVariation: number;
  waveWidth: number;
  scale: number;
}

const ShaderPlane: React.FC<ShaderPlaneProps> = ({
  speed,
  waveCount,
  waveAmplitude,
  waveFrequency,
  lineThickness,
  grainIntensity,
  startColor,
  endColor,
  backgroundColor,
  brightness,
  speedVariation,
  waveWidth,
  scale,
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
      u_waveCount: { value: waveCount },
      u_waveAmplitude: { value: waveAmplitude },
      u_waveFrequency: { value: waveFrequency },
      u_lineThickness: { value: lineThickness },
      u_grainIntensity: { value: grainIntensity },
      u_startColor: { value: new THREE.Color(startColor) },
      u_endColor: { value: new THREE.Color(endColor) },
      u_backgroundColor: { value: new THREE.Color(backgroundColor) },
      u_brightness: { value: brightness },
      u_speedVariation: { value: speedVariation },
      u_waveWidth: { value: waveWidth },
      u_scale: { value: scale },
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
      materialRef.current.uniforms.u_waveCount.value = waveCount;
      materialRef.current.uniforms.u_waveAmplitude.value = waveAmplitude;
      materialRef.current.uniforms.u_waveFrequency.value = waveFrequency;
      materialRef.current.uniforms.u_lineThickness.value = lineThickness;
      materialRef.current.uniforms.u_grainIntensity.value = grainIntensity;
      materialRef.current.uniforms.u_startColor.value.set(startColor);
      materialRef.current.uniforms.u_endColor.value.set(endColor);
      materialRef.current.uniforms.u_backgroundColor.value.set(backgroundColor);
      materialRef.current.uniforms.u_brightness.value = brightness;
      materialRef.current.uniforms.u_speedVariation.value = speedVariation;
      materialRef.current.uniforms.u_waveWidth.value = waveWidth;
      materialRef.current.uniforms.u_scale.value = scale;
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

const GrainWave: React.FC<GrainWaveProps> = ({
  width = "100%",
  height = "100%",
  className = "",
  speed = 0.5,
  waveCount = 25,
  waveAmplitude = 0.85,
  waveFrequency = 4,
  lineThickness = 0.2,
  grainIntensity = 50,
  startColor = "#ff6666",
  endColor = "#6666ff",
  lightBackground = "#ffffff",
  darkBackground = "#000000",
  brightness = 1,
  speedVariation = 0.006,
  waveWidth = 3.5,
  scale = 0.6,
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
          waveCount={waveCount}
          waveAmplitude={waveAmplitude}
          waveFrequency={waveFrequency}
          lineThickness={lineThickness}
          grainIntensity={grainIntensity}
          startColor={startColor}
          endColor={endColor}
          backgroundColor={backgroundColor}
          brightness={brightness}
          speedVariation={speedVariation}
          waveWidth={waveWidth}
          scale={scale}
        />
      </Canvas>
    </div>
  );
};

GrainWave.displayName = "GrainWave";

export default GrainWave;
