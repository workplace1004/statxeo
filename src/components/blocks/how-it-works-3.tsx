"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Wand2, Layers, Download } from "lucide-react";

const items = [
  {
    id: 1,
    title: "Upload your assets",
    description:
      "Drag and drop images, videos, or files. We support all major formats with instant processing.",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614851099511-773084f6911d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    title: "Let our AI create",
    description:
      "Our AI automatically optimizes colors, removes backgrounds, and suggests layout improvements.",
    images: [
      "https://images.unsplash.com/photo-1677442135136-760c813028c4?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1675271591211-930ce12df0e6?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1676277791608-ac54525aa94d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1676573409967-986dcf64d862?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1675271591581-6c4fd0cf40a6?q=80&w=400&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    title: "Export anywhere",
    description:
      "Download in any format or publish directly to your favorite platforms with one click.",
    images: [
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=400&auto=format&fit=crop",
    ],
  },
];

export function HowItWorks3() {
  const [activeItem, setActiveItem] = useState(1);
  const currentItem = items.find((item) => item.id === activeItem)!;

  return (
    <section
      className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950"
      aria-label="How it works"
    >
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white mb-6">
              AI Videos,{" "}
              <span className="italic font-serif">reimagined.</span>
            </h2>

            <div className="relative border-l-2 border-dashed border-neutral-200 dark:border-neutral-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative cursor-pointer group"
                  onClick={() => setActiveItem(item.id)}
                >
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 -ml-px bg-neutral-900 dark:bg-white"
                    initial={false}
                    animate={{
                      opacity: activeItem === item.id ? 1 : 0,
                      scaleY: activeItem === item.id ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ originY: 0.5 }}
                  />
                  <motion.div
                    className="pl-6"
                    initial={false}
                    animate={{ paddingTop: 12, paddingBottom: 12 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <h3
                      className={`text-base sm:text-lg font-medium transition-colors duration-200 ${activeItem === item.id
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-400 dark:text-neutral-600"
                        }`}
                    >
                      {item.title}
                    </h3>
                    <motion.div
                      initial={false}
                      animate={{
                        height: activeItem === item.id ? "auto" : 0,
                        opacity: activeItem === item.id ? 1 : 0,
                        marginTop: activeItem === item.id ? 8 : 0,
                      }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
                        {item.description}
                      </p>
                    </motion.div>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex justify-center"
            style={{ perspective: "600px" }}
          >
            <div
              className="relative rounded-2xl p-4 sm:p-5 max-w-sm w-full border border-neutral-200/50 dark:border-neutral-700/50 bg-linear-to-br from-pink-50/80 via-blue-50/80 to-green-50/80 dark:from-neutral-800/80 dark:via-neutral-900/80 dark:to-neutral-800/80"
              style={{
                transform: "rotateY(-20deg) rotateX(8deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/40 dark:bg-neutral-900/60 backdrop-blur-sm" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4"
                >
                  {currentItem.images.map((image, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="overflow-hidden rounded-xl shadow-lg aspect-square"
                    >
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <div className="relative z-10 flex items-center justify-center gap-2 mt-6">
                {[Sparkles, Wand2, Layers, Download].map((Icon, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
