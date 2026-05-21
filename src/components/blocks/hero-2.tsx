"use client";

import { Play } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";
import { useRef, useState, useEffect } from "react";
import type { MouseEvent } from "react";

interface CardWithTiltProps {
  children: React.ReactNode;
  delay: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CardWithTilt = ({
  children,
  delay,
  mouseX,
  mouseY,
  isHovering,
  containerRef,
}: CardWithTiltProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  const rotateX = useSpring(
    useTransform(mouseY, (latest: number) => {
      if (!cardRef.current || !isHovering) return 0;
      const rect = cardRef.current.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return 0;

      const cardCenterY = rect.top + rect.height / 2 - containerRect.top;
      const distanceY = latest - cardCenterY;
      return (distanceY / containerRect.height) * -25;
    }),
    { stiffness: 200, damping: 15 },
  );

  const rotateY = useSpring(
    useTransform(mouseX, (latest: number) => {
      if (!cardRef.current || !isHovering) return 0;
      const rect = cardRef.current.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return 0;

      const cardCenterX = rect.left + rect.width / 2 - containerRect.left;
      const distanceX = latest - cardCenterX;
      return (distanceX / containerRect.width) * 25;
    }),
    { stiffness: 200, damping: 15 },
  );

  return (
    <motion.div
      ref={cardRef}
      initial={!hasAnimated ? { opacity: 0, y: 30 } : false}
      animate={!hasAnimated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      onAnimationComplete={() => setHasAnimated(true)}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
};

interface HeroCardProps {
  image: string;
  className?: string;
  delay: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const HeroCard = ({
  image,
  className,
  delay,
  mouseX,
  mouseY,
  isHovering,
  containerRef,
}: HeroCardProps) => {
  return (
    <CardWithTilt
      delay={delay}
      mouseX={mouseX}
      mouseY={mouseY}
      isHovering={isHovering}
      containerRef={containerRef}
    >
      <div
        className={`rounded-3xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative group hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${className}`}
      >
        <img src={image} alt="Visual" className="w-full h-full object-cover grayscale" />
      </div>
    </CardWithTilt>
  );
};

const CanvasBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWaves = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      time: number,
      isDark: boolean,
    ) => {
      ctx.clearRect(0, 0, width, height);

      const baseColor = isDark ? "255, 255, 255" : "0, 0, 0";
      const waveCount = 3;

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${baseColor}, ${0.05 - i * 0.01})`;

        for (let x = 0; x < width; x += 5) {
          const y =
            height * 0.6 +
            Math.sin(x * 0.003 + time + i * 2) * 50 +
            Math.sin(x * 0.007 + time * 0.5 + i) * 30 +
            i * 120;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    const draw = () => {
      const time = Date.now() * 0.001;
      const isDark = document.documentElement.classList.contains("dark");
      drawWaves(ctx, canvas.width, canvas.height, time, isDark);
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export function Hero2() {
  const enableTilt = true;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    if (enableTilt) setIsHovering(true);
  };
  const handleMouseLeave = () => {
    if (!enableTilt) return;
    setIsHovering(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={enableTilt ? containerRef : undefined}
      onMouseMove={enableTilt ? handleMouseMove : undefined}
      onMouseEnter={enableTilt ? handleMouseEnter : undefined}
      onMouseLeave={enableTilt ? handleMouseLeave : undefined}
      className="w-full flex items-start py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 relative overflow-hidden"
    >
      <CanvasBackground />
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-white dark:from-neutral-950 to-transparent z-0 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-white dark:from-neutral-950 to-transparent z-0 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto w-full relative z-10">
        {/* Top Section - Centered Headline & CTAs */}
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 mb-2">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl tracking-tight font-medium text-neutral-900 dark:text-white leading-[1.15] max-w-2xl"
          >
            Build better products with powerful analytics
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl"
          >
            Get deep insights into user behavior and make data-driven decisions
            that accelerate your product growth
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 w-full sm:w-auto"
            >
              Start free trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium text-sm sm:text-base hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto group"
            >
              See how it works
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom Section - Arc Grid */}
        <div className="relative">
          {/* Left Fade Gradient */}
          <div className="absolute -left-4 sm:left-0 top-0 bottom-0 w-64 bg-linear-to-r from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
          {/* Right Fade Gradient */}
          <div className="absolute -right-4 sm:right-0 top-0 bottom-0 w-64 bg-linear-to-l from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />

          <div
            className="-mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full overflow-x-auto scrollbar-hide flex justify-center px-4 sm:px-0"
            style={{ perspective: "1000px" }}
          >
            <div className="flex items-end gap-3 sm:gap-4 md:gap-6">
              {/* Column 1 - Left: 2 stacked cards */}
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 flex-1 min-w-[180px]">
                <HeroCard
                  delay={0.8}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-60 sm:h-[280px] md:h-80 lg:h-[360px] w-[180px] sm:w-[200px] md:w-[220px] lg:w-60"
                />
                <HeroCard
                  delay={0.85}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-[60px] sm:h-[70px] md:h-20 lg:h-[90px] w-[180px] sm:w-[200px] md:w-[220px] lg:w-60"
                />
              </div>

              {/* Column 2 - Tall single card */}
              <div className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-60">
                <HeroCard
                  delay={0.5}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1851&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-60 sm:h-[280px] md:h-80 lg:h-[360px] w-full"
                />
              </div>

              {/* Column 3 - Center: Square card (creates the dip) */}
              <div className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-60">
                <HeroCard
                  delay={0.4}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1664448007527-2c49742dbb24?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="aspect-square w-full"
                />
              </div>

              {/* Column 4 - Tall single card */}
              <div className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-60">
                <HeroCard
                  delay={0.6}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-60 sm:h-[280px] md:h-80 lg:h-[360px] w-full"
                />
              </div>

              {/* Column 5 - Right: 2 stacked cards */}
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 flex-1 min-w-[180px]">
                <HeroCard
                  delay={0.7}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1591608516485-a1a53df39498?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-60 sm:h-[280px] md:h-80 lg:h-[360px] w-[180px] sm:w-[200px] md:w-[220px] lg:w-60"
                />
                <HeroCard
                  delay={0.75}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isHovering={isHovering}
                  containerRef={containerRef}
                  image="https://images.unsplash.com/photo-1686061593213-98dad7c599b9?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  className="h-[60px] sm:h-[70px] md:h-20 lg:h-[90px] w-[180px] sm:w-[200px] md:w-[220px] lg:w-60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
