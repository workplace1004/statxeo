"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Cta5() {
  return (
    <section className="w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col items-center space-y-8">
          {/* Video with SVG Frame Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative w-full max-w-3xl"
            style={{ aspectRatio: "1204 / 845" }}
          >
            {/* Video layer */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://cdn.dribbble.com/userupload/43431316/file/original-f36381b829979e87849e8ba1d56c5c28.mp4"
                type="video/mp4"
              />
            </video>

            {/* SVG Frame overlay - covers areas outside the shape */}
            <svg
              viewBox="0 0 1204 845"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* This path is the INVERSE - it fills everything EXCEPT the vehicle shape */}
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 0H1204V845H0V0ZM75 0C33.5786 0 0 33.5786 0 75V570C0 611.421 33.5786 645 75 645H237C310.541 645.02 334.965 663.267 335 743V769C335 810.421 368.579 844 410 844H794C835.421 844 869 810.421 869 769V743C869.035 663.267 893.459 645.02 967 645H1129C1170.42 645 1204 611.421 1204 570V75C1204 33.5786 1170.42 0 1129 0H75Z"
                className="fill-white dark:fill-neutral-950"
              />
            </svg>
          </motion.div>

          {/* Small Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-medium"
          >
            MOTION THAT MOVES YOU
          </motion.p>

          {/* Main Description */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl sm:text-3xl font-normal text-neutral-900 dark:text-white text-center leading-tight max-w-xl"
          >
            Bring your ideas to life with stunning animations that captivate and
            inspire.
          </motion.h2>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button className="group cursor-pointer px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-pink-300 hover:bg-pink-400 text-neutral-900 font-medium text-sm sm:text-base transition-colors duration-200 flex items-center gap-2">
              <span>START ANIMATING</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
