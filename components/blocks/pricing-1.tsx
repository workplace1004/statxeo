"use client";

import { Check, Info } from "lucide-react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useState, useRef } from "react";

const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) => {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time: number) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x,
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y,
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default function Pricing1() {
  const [proIsYearly, setProIsYearly] = useState(true);
  const [agencyIsYearly, setAgencyIsYearly] = useState(true);

  return (
    <section className="relative w-full bg-white dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h1 className="text-3xl tracking-tight font-medium text-neutral-900 dark:text-white leading-tight mb-2">
            Secure Cloud Storage
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Store, sync, and share files securely
          </p>
        </motion.div>

        {/* Try for Free Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl mx-auto mb-16"
        >
          <div className="relative overflow-hidden p-0.5 rounded-3xl">
            <div
              className="absolute inset-0"
              style={{ borderRadius: "1.5rem" }}
            >
              <MovingBorder duration={5000} rx="30%" ry="30%">
                <div className="h-48 w-48 bg-[radial-gradient(#10b981_15%,transparent_80%)] opacity-[0.5]" />
              </MovingBorder>
            </div>
            <div className="relative bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl pl-6 pr-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-1">
                    Start free
                  </h3>
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="text-xs">10 GB storage included</span>
                    <button className="text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
                Get Started
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Pro Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 flex flex-col"
          >
            {/* Header with Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                Pro
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-900 dark:text-white">
                  {proIsYearly ? "Yearly" : "Monthly"}
                </span>
                <button
                  onClick={() => setProIsYearly(!proIsYearly)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${proIsYearly
                    ? "bg-neutral-900 dark:bg-white"
                    : "bg-neutral-300 dark:bg-neutral-700"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full transition-transform duration-200 ${proIsYearly ? "translate-x-0" : "translate-x-5"
                      }`}
                  />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mb-4">
                Individual storage for
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
                  ${proIsYearly ? "16" : "20"}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                  per seat /month
                </span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Features */}
            <div className="space-y-3 mb-6 mt-12">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  100 GB secure storage
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  File versioning
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  2FA security
                </span>
              </div>
            </div>

            <button className="w-full px-6 py-2 rounded-sm bg-black dark:bg-white text-white dark:text-black font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
              Get Pro
            </button>
          </motion.div>

          {/* Agency Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl p-5 flex flex-col relative overflow-hidden border border-green-500/20 dark:border-green-500/30"
          >
            {/* Light mode gradient */}
            <div
              className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity"
              style={{
                background: `radial-gradient(125% 125% at 50% 10%, #fafafa 40%, #10b981 100%)`,
              }}
            />
            {/* Dark mode gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity"
              style={{
                background: `radial-gradient(125% 125% at 50% 10%, #171717 40%, #10b981 100%)`,
              }}
            />

            <div className="relative z-10 flex flex-col flex-1">
              {/* Header with Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  Team
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-900 dark:text-white">
                    {agencyIsYearly ? "Yearly" : "Monthly"}
                  </span>
                  <button
                    onClick={() => setAgencyIsYearly(!agencyIsYearly)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${agencyIsYearly
                      ? "bg-neutral-900 dark:bg-white"
                      : "bg-neutral-300 dark:bg-neutral-700"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full transition-transform duration-200 ${agencyIsYearly ? "translate-x-0" : "translate-x-5"
                        }`}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mb-4">
                  Team collaboration for
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
                    ${agencyIsYearly ? "48" : "60"}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                    per seat /month
                  </span>
                </div>
              </div>

              <div className="flex-1" />

              {/* Features */}
              <div className="mb-6">
                <p className="text-neutral-700 dark:text-neutral-300 text-sm font-medium mb-3">
                  Everything in Pro, plus:
                </p>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                  <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                    1 TB team storage
                  </span>
                </div>
              </div>

              <button className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
                Get Team Plan
              </button>
            </div>
          </motion.div>

          {/* Enterprise Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 flex flex-col"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Enterprise
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-base mb-8">
              Unlimited storage with advanced admin controls
            </p>

            <div className="flex-1" />

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  Unlimited storage
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  Advanced permissions
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                <span className="text-neutral-800 dark:text-neutral-200 text-sm sm:text-base">
                  24/7 priority support
                </span>
              </div>
            </div>

            <button className="w-full px-6 py-2 rounded-sm bg-black dark:bg-white text-white dark:text-black font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200">
              Schedule a call
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
