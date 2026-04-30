"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface ShaderWavesProps {
  /** Width of the component in pixels or CSS value */
  width?: number | string;
  /** Height of the component in pixels or CSS value */
  height?: number | string;
  /** Animation speed multiplier */
  speed?: number;
  /** Primary wave color in hex format */
  color1?: string;
  /** Secondary wave color in hex format */
  color2?: string;
  /** Wave frequency/scale (higher = more waves) */
  frequency?: number;
  /** Wave intensity/amplitude */
  intensity?: number;
  /** Complexity of wave patterns (layers of noise) */
  complexity?: number;
  /** Opacity of the waves (0-1) */
  opacity?: number;
  /** Whether the background should be transparent */
  transparent?: boolean;
  /** Background color when transparent is false */
  backgroundColor?: string;
  /** Additional CSS classes */
  className?: string;
  /** Content to render on top of the waves */
  children?: React.ReactNode;
}

const ShaderWaves: React.FC<ShaderWavesProps> = ({
  width = "100%",
  height = "100%",
  speed = 1.0,
  color1 = "#00ff88",
  color2 = "#0088ff",
  frequency = 1.0,
  intensity = 1.0,
  complexity = 1.0,
  opacity = 1.0,
  transparent = true,
  backgroundColor = "#000000",
  className,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
          }
        : { r: 0, g: 1, b: 1 };
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const bgRgb = hexToRgb(backgroundColor);

    const rect = container.getBoundingClientRect();
    const actualWidth = rect.width;
    const actualHeight = rect.height;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: false,
    });
    renderer.setClearColor(0x000000, 0);

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setSize(actualWidth, actualHeight, false);
    renderer.setPixelRatio(pixelRatio);

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const bufferWidth = actualWidth * pixelRatio;
    const bufferHeight = actualHeight * pixelRatio;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(bufferWidth, bufferHeight, 1.0) },
      uColor1: { value: new THREE.Vector3(rgb1.r, rgb1.g, rgb1.b) },
      uColor2: { value: new THREE.Vector3(rgb2.r, rgb2.g, rgb2.b) },
      uBackgroundColor: { value: new THREE.Vector3(bgRgb.r, bgRgb.g, bgRgb.b) },
      uTransparent: { value: transparent ? 1.0 : 0.0 },
      uFrequency: { value: frequency },
      uIntensity: { value: intensity },
      uComplexity: { value: complexity },
      uOpacity: { value: opacity },
    };

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float iTime;
      uniform vec3 iResolution;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uBackgroundColor;
      uniform float uTransparent;
      uniform float uFrequency;
      uniform float uIntensity;
      uniform float uComplexity;
      uniform float uOpacity;

      vec3 hash3D(vec3 value) {
        vec3 scaled = value * 34.0 + 1.0;
        return mod(scaled * value, 289.0);
      }

      float generateNoise(vec2 coord) {
        const vec4 skewConstants = vec4(
          0.211324865405187,
          0.366025403784439,
          -0.577350269189626,
          0.024390243902439
        );

        vec2 skewedCoord = coord + dot(coord, skewConstants.yy);
        vec2 cellOrigin = floor(skewedCoord);
        vec2 offset0 = coord - cellOrigin + dot(cellOrigin, skewConstants.xx);

        vec2 cornerOffset = (offset0.x > offset0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

        vec4 offsets = offset0.xyxy + skewConstants.xxzz;
        offsets.xy -= cornerOffset;

        cellOrigin = mod(cellOrigin, 289.0);

        vec3 gradientIdx = hash3D(
          hash3D(cellOrigin.y + vec3(0.0, cornerOffset.y, 1.0)) +
          cellOrigin.x + vec3(0.0, cornerOffset.x, 1.0)
        );

        vec3 weights = max(
          0.5 - vec3(
            dot(offset0, offset0),
            dot(offsets.xy, offsets.xy),
            dot(offsets.zw, offsets.zw)
          ),
          0.0
        );
        weights = weights * weights;
        weights = weights * weights;

        vec3 gradX = 2.0 * fract(gradientIdx * skewConstants.www) - 1.0;
        vec3 gradY = abs(gradX) - 0.5;
        vec3 roundedX = floor(gradX + 0.5);
        vec3 finalGradX = gradX - roundedX;

        weights *= 1.79284291400159 - 0.85373472095314 * (finalGradX * finalGradX + gradY * gradY);

        vec3 gradients;
        gradients.x = finalGradX.x * offset0.x + gradY.x * offset0.y;
        gradients.yz = finalGradX.yz * offsets.xz + gradY.yz * offsets.yw;

        return 130.0 * dot(weights, gradients);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec2 scaledUV = uv * uFrequency;
        float t = iTime;

        float innerNoise = generateNoise(scaledUV + t * 0.25);

        float middleNoise = generateNoise(scaledUV + innerNoise * 0.1 * uComplexity);

        float s1 = generateNoise(scaledUV + t * 0.5 + middleNoise);

        float s2 = generateNoise(scaledUV + s1);

        s1 *= uIntensity;
        s2 *= uIntensity;

        float sharpS1 = sign(s1) * pow(abs(s1), 0.8);
        float sharpS2 = sign(s2) * pow(abs(s2), 0.8);

        vec3 mixedColor = mix(uColor1, uColor2, (sharpS2 + 1.0) * 0.5);
        mixedColor = mix(mixedColor, uColor1, (sharpS1 + 1.0) * 0.3);

        mixedColor = pow(mixedColor, vec3(0.9));

        float alpha = (abs(sharpS1) + abs(sharpS2)) * 0.5 * uOpacity;
        alpha = pow(alpha, 0.85);
        alpha = clamp(alpha, 0.0, 1.0);

        if (uTransparent > 0.5) {
          if (alpha < 0.05) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }
          gl_FragColor = vec4(mixedColor * alpha, alpha);
        } else {
          vec3 finalColor = mix(uBackgroundColor, mixedColor, alpha);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    startTimeRef.current = performance.now();

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      uniforms.iTime.value = elapsed * speed;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      const newWidth = newRect.width;
      const newHeight = newRect.height;

      renderer.setSize(newWidth, newHeight, false);

      const newBufferWidth = newWidth * pixelRatio;
      const newBufferHeight = newHeight * pixelRatio;
      uniforms.iResolution.value.set(newBufferWidth, newBufferHeight, 1.0);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafRef.current);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    speed,
    color1,
    color2,
    frequency,
    intensity,
    complexity,
    opacity,
    transparent,
    backgroundColor,
  ]);

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
      <div ref={containerRef} className="absolute inset-0" />
      {children && (
        <div className="relative z-10 w-full h-full pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

ShaderWaves.displayName = "ShaderWaves";

export default ShaderWaves;
