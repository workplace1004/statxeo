"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

export default function SocialProof5() {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote:
        "We went from page 3 to the top 5 on Google in 90 days. StatXEO handles our SEO and social — I just run the shop.",
      name: "Maria Rodriguez",
      title: "Owner, Rodriguez Plumbing",
      avatar: "https://images.unsplash.com/photo-1600481453173-55f6a844a4ea?q=80&w=750&auto=format&fit=crop",
      color: "#fb923c",
    },
    {
      quote:
        "The AI built our entire website in an afternoon. We've booked 40% more appointments since switching to StatXEO.",
      name: "James Chen",
      title: "Founder, Chen Dental Care",
      avatar: "https://images.unsplash.com/photo-1530466015235-1d47696ea847?q=80&w=1674&auto=format&fit=crop",
      color: "#fdba74",
    },
    {
      quote:
        "Review responses used to take hours. Now AI drafts them and I approve in seconds. Our rating went from 4.2 to 4.8 stars.",
      name: "Sarah Mitchell",
      title: "Manager, Mitchell HVAC",
      avatar: "https://images.unsplash.com/photo-1705408115324-6bd2cbfa4d93?q=80&w=774&auto=format&fit=crop",
      color: "#fed7aa",
    },
    {
      quote:
        "As an agency, white-labeling StatXEO let us offer SEO and websites without hiring a full marketing team. Margins are great.",
      name: "David Patterson",
      title: "CEO, Patterson Digital Agency",
      avatar: "https://images.unsplash.com/photo-1564172556663-2bef9580fc44?q=80&w=774&auto=format&fit=crop",
      color: "#ea580c",
    },
  ];

  const industries = [
    "Plumbing",
    "Dental",
    "HVAC",
    "Landscaping",
    "Legal",
    "Restaurants",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="w-full bg-white py-8 dark:bg-neutral-950 sm:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-16">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-16 text-4xl font-medium leading-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl lg:mb-20 lg:text-6xl"
        >
          Trusted by local businesses
          <br />
          across every industry
        </motion.h2>

        {/* Testimonial Section */}
        <div className="mb-16 grid gap-8 lg:mb-20 lg:grid-cols-2 lg:gap-12">
          {/* Left - Avatars */}
          <div className="flex items-center justify-start gap-4 lg:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: activeIndex === index ? 1.1 : 0.9,
                  opacity: activeIndex === index ? 1 : 0.6,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="relative"
              >
                {/* Avatar */}
                <div
                  className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full transition-colors duration-500 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
                  style={{
                    backgroundColor:
                      activeIndex === index ? testimonial.color : undefined,
                  }}
                >
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-8 w-8 rounded-full object-cover sm:h-12 sm:w-12 lg:h-16 lg:w-16 grayscale"
                  />
                </div>

                {/* Circular Progress */}
                {activeIndex === index && (
                  <svg
                    className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      opacity="0.2"
                    />
                    <motion.circle
                      key={`progress-${activeIndex}`}
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke={testimonial.color}
                      strokeWidth="1.5"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ duration: 10, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>

          {/* Right - Testimonial Content */}
          <div className="flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <blockquote className="mb-6 text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">
                  &ldquo;{testimonials[activeIndex].quote}&rdquo;
                </blockquote>
                <div className="text-base font-medium text-neutral-900 dark:text-neutral-100 sm:text-lg">
                  {testimonials[activeIndex].name},{" "}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {testimonials[activeIndex].title}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Industries served */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {industries.map((industry, index) => (
            <motion.span
              key={industry}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-full border border-neutral-200 dark:border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {industry}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
