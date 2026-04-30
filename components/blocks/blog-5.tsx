"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Clock, Eye, Share2, Sparkles } from "lucide-react";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "overview", title: "Platform Overview" },
  { id: "key-features", title: "Key Features" },
  { id: "use-cases", title: "Common Use Cases" },
  { id: "conclusion", title: "Conclusion" },
];

const sources = [
  {
    name: "TechCrunch",
    title: "Breaking: New Platform Launches with AI Integration...",
    color: "bg-green-500",
  },
  {
    name: "Wired",
    title: "How This Startup is Changing Developer Workflows...",
    color: "bg-purple-500",
  },
  {
    name: "The Verge",
    title: "Exclusive: Inside the Future of Code Generation...",
    color: "bg-orange-500",
  },
];

export function Blog5() {
  const [activeSection, setActiveSection] = useState("introduction");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((section) => {
      const el = sectionRefs.current[section.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <article className="w-full bg-white dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-[21/9] sm:aspect-[3/1] overflow-hidden"
      >
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=640&fit=crop"
          alt="Technology visualization"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 text-xs text-white/70 bg-black/40 px-2 py-1 rounded">
          Photo credit · unsplash.com
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            <div className="flex-1 min-w-0">
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white mb-6 leading-tight">
                  New AI Platform Revolutionizes Developer Experience
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
                      alt="Author"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        Curated by <span className="font-medium text-neutral-900 dark:text-white">devnews</span>
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-500">
                        3 min read
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 ml-auto">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Dec 20, 2024
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      49,122
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" />
                      967
                    </span>
                  </div>
                </div>
              </motion.header>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="prose prose-neutral dark:prose-invert max-w-none mb-8"
              >
                <section
                  id="introduction"
                  ref={(el) => { sectionRefs.current["introduction"] = el; }}
                  className="scroll-mt-24"
                >
                  <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                    The technology landscape is witnessing a major shift as a new AI-powered development platform launches globally. Industry experts are calling it one of the most significant advancements in developer tooling in recent years.
                  </p>
                </section>

                <section
                  id="overview"
                  ref={(el) => { sectionRefs.current["overview"] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
                    Platform Overview
                  </h2>
                  <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                    The platform combines advanced machine learning models with intuitive developer interfaces. It supports multiple programming languages and integrates seamlessly with existing workflows and tools.
                  </p>
                </section>

                <section
                  id="key-features"
                  ref={(el) => { sectionRefs.current["key-features"] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
                    Key Features
                  </h2>
                  <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                    Core capabilities include intelligent code completion, automated refactoring suggestions, natural language code generation, and real-time collaboration features. The AI understands context across entire codebases.
                  </p>
                </section>

                <section
                  id="use-cases"
                  ref={(el) => { sectionRefs.current["use-cases"] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
                    Common Use Cases
                  </h2>
                  <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                    Teams are using the platform for rapid prototyping, code review assistance, documentation generation, and onboarding new developers. Enterprise adoption has been particularly strong in fintech and healthcare sectors.
                  </p>
                </section>

                <section
                  id="conclusion"
                  ref={(el) => { sectionRefs.current["conclusion"] = el; }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
                    Conclusion
                  </h2>
                  <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                    As AI continues to evolve, tools like this are setting new standards for developer productivity. The future of software development is being rewritten, one intelligent suggestion at a time.
                  </p>
                </section>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
              >
                {sources.map((source, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <div className={`w-5 h-5 rounded ${source.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {source.name[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-neutral-900 dark:text-white">
                        {source.name}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {source.title}
                      </span>
                    </div>
                  </a>
                ))}
                <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    +6 sources
                  </span>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-xl"
              >
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Ask follow-up"
                  className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
                />
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block w-64 flex-shrink-0"
            >
              <nav className="sticky top-8">
                <ul className="space-y-1 border-l-2 border-neutral-200 dark:border-neutral-800">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`block pl-4 py-1.5 text-sm transition-colors ${activeSection === section.id
                          ? "text-purple-600 dark:text-purple-400 border-l-2 border-purple-600 dark:border-purple-400 -ml-[2px] font-medium"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.aside>
          </div>
        </div>
      </div>
    </article>
  );
}
