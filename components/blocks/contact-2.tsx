"use client";

import { motion } from "motion/react";
import { useState } from "react";

export default function Contact2() {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="w-full bg-white py-16 dark:bg-neutral-950 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Company Info */}
          <div className="flex flex-col justify-between">
            {/* Top Section */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="mb-4 text-2xl font-normal text-neutral-900 dark:text-white sm:text-3xl"
              >
                Ready to create
                <br />
                something amazing?
              </motion.h2>
            </div>

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-24 space-y-8 lg:mt-0"
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    PS
                  </span>
                </div>
              </div>

              {/* Address and Social Links */}
              <div className="space-y-4">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Pixel Studio Creative</p>
                  <p>42 Design Ave, San Francisco, CA</p>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <a
                    href="#"
                    className="transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Instagram
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Facebook
                  </a>
                  <a
                    href="#"
                    className="transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    Twitter
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Contact Form */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-12 text-5xl font-normal text-neutral-900 dark:text-white sm:text-6xl lg:mb-16 lg:text-7xl"
            >
              Contact us
            </motion.h1>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* First Name and Last Name */}
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <input
                    type="text"
                    placeholder="First name"
                    className="w-full border-b border-neutral-300 bg-transparent pb-3 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last name"
                    className="w-full border-b border-neutral-300 bg-transparent pb-3 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border-b border-neutral-300 bg-transparent pb-3 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white"
                />
              </div>

              {/* Company */}
              <div>
                <input
                  type="text"
                  placeholder="Company"
                  className="w-full border-b border-neutral-300 bg-transparent pb-3 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white"
                />
              </div>

              {/* Message */}
              <div>
                <textarea
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full resize-none border-b border-neutral-300 bg-transparent pb-3 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white"
                />
              </div>

              {/* Privacy Agreement */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    agreed
                      ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white"
                      : "border-neutral-400 bg-transparent dark:border-neutral-600"
                  }`}
                >
                  {agreed && (
                    <svg
                      className="h-3 w-3 text-white dark:text-neutral-950"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <label className="text-sm text-neutral-600 dark:text-neutral-400">
                  I have read and understood the{" "}
                  <a
                    href="#"
                    className="underline transition-colors hover:text-neutral-900 dark:hover:text-white"
                  >
                    privacy statement
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="rounded-xl bg-neutral-900 px-12 py-4 text-base font-medium text-white transition-all hover:scale-105 dark:bg-white dark:text-neutral-900"
                >
                  Submit
                </button>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
