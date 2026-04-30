"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface NeonRevealProps {
  /** Number of milliseconds to wait before starting the reveal animation */
  revealDelay?: number;

  /** Duration of the reveal animation in milliseconds */
  revealDuration?: number;

  /** Vertical offset of the neon bar (0.0 to 1.0, where 0 is bottom and 1 is top) */
  verticalOffset?: number;

  /** Direction of the neon bar */
  direction?: "horizontal" | "vertical";

  /** Hue of the neon bar (0-360 degrees) */
  color?: number;

  /** Width/length of the bar as a percentage (0.0 to 1.0, where 1.0 is full width) */
  barWidth?: number;

  /** Height/thickness of the bar (0.0 to 1.0) */
  barHeight?: number;

  /** Whether to render a mirrored bar on the opposite side */
  mirrored?: boolean;

  /** Where the bar expands from: "center", "left", "right" */
  expandFrom?: "center" | "left" | "right";

  /** Trigger animation when element enters viewport */
  animateOnScroll?: boolean;

  /** Viewport intersection threshold for scroll trigger (0.0 to 1.0) */
  scrollThreshold?: number;

  /** Overall glow intensity multiplier */
  intensity?: number;

  /** How far the glow spreads from the bar */
  glowSpread?: number;

  /** Make the glow follow the cursor position */
  followCursor?: boolean;

  /** Callback when animation starts */
  onStart?: () => void;

  /** Callback when animation completes */
  onComplete?: () => void;

  /** Additional CSS classes */
  className?: string;

  /** Content to reveal */
  children?: React.ReactNode;
}

const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform vec2 iResolution;
uniform float iTime;
uniform float uProgress;
uniform float uVerticalOffset;
uniform float uDirection;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uBarWidth;
uniform float uBarHeight;
uniform float uMirrored;
uniform float uExpandFrom;
uniform float uIntensity;
uniform float uGlowSpread;
uniform vec2 uMousePos;
uniform float uMouseAlpha;

#define N_DIRECTION 16
#define fN_DIRECTION 16.0

#define PI 3.1415926535
#define TAU 6.2831853
#define INF 2.0

#define COLOR1 vec3(0.615686274509804, 0.9607843137254902, 1.0)
#define COLOR2 vec3(0.10980392156862745, 0.4588235294117647, 0.9215686274509803)
#define COLOR3 vec3(0.4666666666666667, 0.6392156862745098, 0.8745098039215686)

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float disSeg(vec2 o,vec2 d, vec2 a, vec2 b){
    vec2 e=a-b;
    vec2 f=a-o;
    if(f.y*e.x<f.x*e.y)return INF;
    float det=d.x*e.y-d.y*e.x;
    if(det==0.)return INF;
    float s=(f.x*e.y-f.y*e.x)/det;
    float t=(d.x*f.y-d.y*f.x)/det;
    if(t>=0.&&t<=1.&&s>0.)return s;
    return INF;
}

vec3 sampling(vec2 o, vec2 d){
    vec3 col=vec3(0.0);
    float t,s;

    float barPos = uVerticalOffset;
    float mirrorPos = 1.0 - uVerticalOffset;
    float center = 0.5;

    if(uDirection < 0.5){
        float leftEdge, rightEdge;

        if(uExpandFrom < 0.5){
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        } else if(uExpandFrom < 1.5){
            leftEdge = 0.0;
            rightEdge = uProgress * uBarWidth;
        } else if(uExpandFrom < 2.5){
            leftEdge = 1.0 - (uProgress * uBarWidth);
            rightEdge = 1.0;
        } else if(uExpandFrom < 3.5){
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        } else {
            leftEdge = center - (uProgress * uBarWidth * 0.5);
            rightEdge = center + (uProgress * uBarWidth * 0.5);
        }

        if(o.y <= barPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(leftEdge, barPos), vec2(rightEdge, barPos))) < INF){
                col = (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(rightEdge, barPos), vec2(leftEdge, barPos))) < INF){
                col = uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }

        if(uMirrored > 0.5 && o.y >= mirrorPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(leftEdge, mirrorPos), vec2(rightEdge, mirrorPos))) < INF){
                col += (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(rightEdge, mirrorPos), vec2(leftEdge, mirrorPos))) < INF){
                col += uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }
    } else {
        float topEdge, bottomEdge;

        topEdge = center + (uProgress * uBarWidth * 0.5);
        bottomEdge = center - (uProgress * uBarWidth * 0.5);

        if(o.x >= barPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(barPos, bottomEdge), vec2(barPos, topEdge))) < INF){
                col = (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(barPos, topEdge), vec2(barPos, bottomEdge))) < INF){
                col = uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }

        if(uMirrored > 0.5 && o.x <= mirrorPos){
            float cursorDist = 1.0;
            if(uMouseAlpha > 0.01){
                float distToMouse = distance(o, uMousePos);
                cursorDist = 1.0 + (1.0 - smoothstep(0.0, 0.5, distToMouse)) * 0.5 * uMouseAlpha;
            }

            float spread = uGlowSpread * 3.0;

            if((t = disSeg(o, d, vec2(mirrorPos, bottomEdge), vec2(mirrorPos, topEdge))) < INF){
                col += (uColor1 * exp(-spread * t) + uColor2 * 1.3 * exp(-0.01 * t)) * 1.1 * uIntensity * cursorDist;
            } else if((t = disSeg(o, d, vec2(mirrorPos, topEdge), vec2(mirrorPos, bottomEdge))) < INF){
                col += uColor3 * 2.7 * exp(-spread * t) * uIntensity * cursorDist;
            }
        }
    }

    s = t;
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 s = vec3(0.);
    vec2 uv = fragCoord / iResolution.xy;

    float n = rand(uv + iTime) * 3.;
    for(int i = 0; i < N_DIRECTION; ++i){
        s += sampling(uv, vec2(sin(n + float(i) * TAU / fN_DIRECTION),
                               cos(n + float(i) * TAU / fN_DIRECTION)));
    }
    s = s / fN_DIRECTION;
    fragColor = vec4(s, 1.);
}

void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    float alpha = length(color.rgb);
    gl_FragColor = vec4(color.rgb, alpha);
}
`;

const NeonReveal: React.FC<NeonRevealProps> = ({
  revealDelay = 0,
  revealDuration = 2000,
  verticalOffset = 0.7,
  direction = "horizontal",
  color = 200,
  barWidth = 1.0,
  barHeight = 0.02,
  mirrored = false,
  expandFrom = "center",
  animateOnScroll = false,
  scrollThreshold = 0.3,
  intensity = 1.0,
  glowSpread = 1.0,
  followCursor = false,
  onStart,
  onComplete,
  className = "",
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mouseAlphaRef = useRef(0);
  const [isInView, setIsInView] = useState(!animateOnScroll);

  const hslToRgb = (h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r, g, b };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1.0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const baseColor = hslToRgb(color, 80, 60);
    const accentColor = hslToRgb((color + 30) % 360, 70, 50);
    const highlightColor = hslToRgb((color + 15) % 360, 75, 65);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uVerticalOffset: { value: verticalOffset },
      uDirection: { value: direction === "horizontal" ? 0.0 : 1.0 },
      uColor1: {
        value: new THREE.Vector3(baseColor.r, baseColor.g, baseColor.b),
      },
      uColor2: {
        value: new THREE.Vector3(accentColor.r, accentColor.g, accentColor.b),
      },
      uColor3: {
        value: new THREE.Vector3(
          highlightColor.r,
          highlightColor.g,
          highlightColor.b,
        ),
      },
      uBarWidth: { value: barWidth },
      uBarHeight: { value: barHeight },
      uMirrored: { value: mirrored ? 1.0 : 0.0 },
      uExpandFrom: {
        value:
          expandFrom === "center" ? 0.0 : expandFrom === "left" ? 1.0 : 2.0,
      },
      uIntensity: { value: intensity },
      uGlowSpread: { value: glowSpread },
      uMousePos: { value: new THREE.Vector2(0, 0) },
      uMouseAlpha: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const canvasWidth = canvas.clientWidth || window.innerWidth;
      const canvasHeight = canvas.clientHeight || window.innerHeight;

      renderer.setSize(canvasWidth, canvasHeight, false);
      uniforms.iResolution.value.set(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    let animationFrameId: number;
    const start = performance.now();
    const animationDurationSec = revealDuration / 1000;
    const delayMs = revealDelay;

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const updateMousePosition = () => {
      if (!followCursor) return;

      const currentPos = uniforms.uMousePos.value;
      const targetPos = mousePositionRef.current;
      const currentAlpha = uniforms.uMouseAlpha.value;
      const targetAlpha = mouseAlphaRef.current;

      const lerpFactor = 0.1;
      currentPos.x += (targetPos.x - currentPos.x) * lerpFactor;
      currentPos.y += (targetPos.y - currentPos.y) * lerpFactor;

      const alphaLerpFactor = 0.08;
      uniforms.uMouseAlpha.value +=
        (targetAlpha - currentAlpha) * alphaLerpFactor;
    };

    const renderLoop = (now: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const delta = now - lastFrameTime;
      if (delta < frameInterval) {
        return;
      }
      lastFrameTime = now - (delta % frameInterval);

      updateMousePosition();
      const elapsed = (now - start) / 1000;
      uniforms.iTime.value = elapsed;

      if (isInView) {
        const timeSinceStart = now - start;
        if (timeSinceStart < delayMs) {
          uniforms.uProgress.value = 0;
          if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            onStart?.();
          }
        } else {
          const progress = Math.min(
            (timeSinceStart - delayMs) / 1000 / animationDurationSec,
            1.0,
          );
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          uniforms.uProgress.value = easedProgress;

          if (progress >= 1.0 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete?.();
          }
        }
      }

      renderer.render(scene, camera);
    };

    renderLoop(performance.now());

    const handleMouseMove = (e: MouseEvent) => {
      if (!followCursor || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePositionRef.current = { x, y };
      mouseAlphaRef.current = 1.0;
    };

    const handleMouseLeave = () => {
      if (!followCursor) return;
      mouseAlphaRef.current = 0.0;
    };

    if (followCursor) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (followCursor && canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [
    revealDelay,
    revealDuration,
    verticalOffset,
    direction,
    color,
    barWidth,
    barHeight,
    mirrored,
    expandFrom,
    isInView,
    intensity,
    glowSpread,
    followCursor,
    onStart,
    onComplete,
  ]);

  useEffect(() => {
    if (!animateOnScroll || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { threshold: scrollThreshold },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [animateOnScroll, scrollThreshold]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden w-full h-full", className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          willChange: "transform",
        }}
      />
      {children && (
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      )}
    </div>
  );
};

NeonReveal.displayName = "NeonReveal";

export default NeonReveal;
