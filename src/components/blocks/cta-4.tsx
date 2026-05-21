"use client";

import { ArrowRight } from "lucide-react";

import { ShinyCta } from "@/components/brand/shiny-glass";
import { motion } from "motion/react";

export default function Cta4() {
  const images = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=600&fit=crop",
      alt: "Developer coding security systems",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=600&fit=crop",
      alt: "Modern data center",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?w=400&h=600&fit=crop",
      alt: "Security team collaboration",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=600&fit=crop",
      alt: "Tech workspace planning",
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=600&fit=crop",
      alt: "Security operations team",
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop",
      alt: "Developer at workstation",
    },
    {
      id: 7,
      url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=600&fit=crop",
      alt: "Tech team meeting",
    },
    {
      id: 8,
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=600&fit=crop",
      alt: "Engineers collaborating",
    },
  ];

  const duplicatedImages = [...images, ...images];

  return (
    <section className="w-full flex flex-col items-center bg-white dark:bg-neutral-950 overflow-visible">
      {/* Top Content Section */}
      <div className="max-w-[1400px] mx-auto w-full flex items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          {/* Main Headline with Italic Word */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal text-neutral-900 dark:text-white leading-[1.15]"
          >
            grow your <span className="italic font-light">local</span> business
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl mx-auto"
          >
            Join thousands of local businesses using StatXEO to build websites,
            rank on Google, and automate marketing — without hiring an agency.
          </motion.p>

          {/* CTA Button with Arrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <ShinyCta
              href="/onboarding/customer"
              rounded="rounded-full"
              className="group relative flex items-center gap-3 overflow-hidden pl-6 pr-2 py-2"
            >
              <span>Get started</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/85 transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10">
                <ArrowRight className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </span>
            </ShinyCta>
          </motion.div>
        </div>
      </div>

      {/* Bottom Marquee Section */}
      <div className="w-full pb-12 sm:pb-16 md:pb-20 lg:pb-24 pt-12 overflow-x-clip">
        <div className="relative">
          {/* Marquee Container */}
          <motion.div
            className="flex gap-4 sm:gap-6 md:gap-8"
            animate={{
              x: ["-0%", "-50%"],
            }}
            transition={{
              x: {
                duration: 40,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
              },
            }}
            style={{ willChange: "transform" }}
          >
            {duplicatedImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className={`shrink-0 w-32 h-44 sm:w-36 sm:h-48 md:w-44 md:h-56 lg:w-48 lg:h-64 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${
                  index % 2 === 1 ? "-mt-8 sm:-mt-10 md:-mt-12 lg:-mt-16" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
