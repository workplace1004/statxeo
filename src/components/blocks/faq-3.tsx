"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function FAQ3() {
  const [selectedCategory, setSelectedCategory] = useState("ordering");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = [
    { id: "ordering", label: "Ordering" },
    { id: "delivery", label: "Delivery" },
    { id: "care", label: "Plant Care" },
    { id: "greenleaf", label: "Greenleaf" },
  ];

  const faqsByCategory = {
    ordering: {
      title: "Ordering",
      faqs: [
        {
          question: "How do I start a plant subscription?",
          answer:
            "Simply create a GreenLeaf account and choose your preferred subscription plan. You can select monthly, bi-monthly, or seasonal deliveries. Customize your plant preferences and we'll curate the perfect selection for your space and skill level.",
        },
        {
          question: "Can I modify my upcoming delivery?",
          answer:
            "Yes! You can modify your order up to 3 days before the scheduled delivery date. Log into your account to swap plants, change delivery dates, or adjust quantities. Need help? Our plant specialists are here to assist.",
        },
        {
          question: "What if my plant arrives damaged?",
          answer:
            "We guarantee your plants arrive healthy and thriving. If any damage occurs during transit, snap a photo within 48 hours of delivery and we'll send a replacement at no charge. Your satisfaction is our priority.",
        },
      ],
    },
    delivery: {
      title: "Delivery",
      faqs: [
        {
          question: "How are plants packaged for shipping?",
          answer:
            "Each plant is carefully wrapped in biodegradable protective sleeves and secured in eco-friendly boxes with moisture packs. Our packaging keeps plants stable and hydrated during transit, ensuring they arrive in perfect condition.",
        },
        {
          question: "What's your delivery schedule?",
          answer:
            "We ship Tuesday through Thursday to ensure plants don't sit in warehouses over weekends. Most deliveries arrive within 2-4 business days. You'll receive tracking information as soon as your plants ship.",
        },
        {
          question: "Do you deliver to apartments?",
          answer:
            "Yes! We deliver to all residential addresses including apartments. For large orders or mature plants, we recommend being home to receive the delivery. We'll coordinate with you to ensure safe placement.",
        },
      ],
    },
    care: {
      title: "Plant Care",
      faqs: [
        {
          question: "What care instructions come with my plants?",
          answer:
            "Every plant includes a detailed care card with watering schedules, light requirements, humidity preferences, and troubleshooting tips. You'll also get access to our online care library with video tutorials and expert advice.",
        },
        {
          question: "How do I know if my plant needs water?",
          answer:
            "Most plants prefer the top 1-2 inches of soil to dry between waterings. Stick your finger in the soil – if it's dry, water thoroughly. Our care cards include specific watering guidance for each plant variety.",
        },
        {
          question: "Can I get help with my struggling plant?",
          answer:
            "Of course! Email photos to our plant experts and we'll diagnose the issue within 24 hours. We provide personalized recovery plans and tips. Our community forum also connects you with fellow plant parents for support.",
        },
      ],
    },
    greenleaf: {
      title: "Greenleaf",
      faqs: [
        {
          question: "What makes Greenleaf different?",
          answer:
            "We source plants directly from certified sustainable nurseries and prioritize rare, unique varieties you won't find in big-box stores. Our expert curation ensures you receive healthy, pest-free plants matched to your environment and experience level.",
        },
        {
          question: "Where are your plants grown?",
          answer:
            "We partner with family-owned nurseries across the US and select international growers who meet our strict sustainability standards. Every plant is quarantined and inspected before shipping to ensure premium quality.",
        },
        {
          question: "Do you have a store I can visit?",
          answer:
            "Our flagship botanical studio is located in Portland, OR, where you can browse plants, attend workshops, and consult with our horticulturists. Check our website for pop-up locations and events in other cities throughout the year.",
        },
      ],
    },
  };

  const currentCategory =
    faqsByCategory[selectedCategory as keyof typeof faqsByCategory];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setOpenIndex(null);
  };

  return (
    <section className="w-full min-h-screen flex flex-col bg-purple-300 dark:bg-purple-400">
      {/* Top Section - Title & Categories */}
      <div className="w-full py-12 px-4 sm:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-black mb-8"
          >
            Questions about plants?
          </motion.h1>

          {/* Category Tabs */}
          <div className="flex items-center flex-wrap gap-2">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <button
                  onClick={() => handleCategoryChange(category.id)}
                  className={`cursor-pointer px-6 sm:px-8 py-4 transition-transform border border-black text-black font-medium tracking-tight text-sm sm:text-base ${
                    selectedCategory === category.id
                      ? "rounded-full border-2 border-dashed rotate-12 transition-transform"
                      : "rounded-md"
                  }`}
                >
                  {category.label}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Category Title & FAQs */}
      <div className="flex-1 bg-white dark:bg-neutral-950 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 xl:gap-20">
            {/* Left Column - Category Title */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <motion.h2
                key={selectedCategory}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl sm:text-4xl md:text-5xl font-medium text-neutral-900 dark:text-white"
              >
                {currentCategory.title}
              </motion.h2>
            </div>

            {/* Right Column - FAQ Accordion */}
            <div className="flex flex-col">
              <div key={selectedCategory} className="space-y-0">
                {currentCategory.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-neutral-300 dark:border-neutral-700"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full py-6 sm:py-8 flex items-start justify-between gap-4 text-left group"
                    >
                      <span className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors duration-200 flex-1">
                        {faq.question}
                      </span>
                      <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center mt-0.5">
                        {openIndex === index ? (
                          <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                        ) : (
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: {
                              duration: 0.3,
                              ease: [0.4, 0, 0.2, 1],
                            },
                            opacity: { duration: 0.2, ease: "easeInOut" },
                          }}
                          className="overflow-hidden"
                        >
                          <div className="pb-6 sm:pb-8 pr-8">
                            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
