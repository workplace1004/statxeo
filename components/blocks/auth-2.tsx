"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";

type AuthPortal = "affiliate" | "white-labeler" | "customer";

interface Auth2Props {
  onSubmit?: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  portal?: AuthPortal;
}

const portalContent: Record<
  AuthPortal,
  {
    leftTitleLine1: string;
    leftTitleLine2: string;
    heading: string;
    description: string;
    helperText: string;
    helperHref: string;
    helperCta: string;
    forgotPasswordHref?: string;
    leftTints: string[];
  }
> = {
  affiliate: {
    leftTitleLine1: "Affiliate",
    leftTitleLine2: "Portal",
    heading: "Affiliate sign in",
    description:
      "Sign in with your affiliate credentials to manage links, commissions, and payouts.",
    helperText: "Need access? Contact your Statxt admin to be invited as an affiliate.",
    helperHref: "/affiliate/help",
    helperCta: "View affiliate help",
    forgotPasswordHref: "/affiliate/forgot-password",
    leftTints: [
      "linear-gradient(135deg, rgba(56,189,248,0.42), rgba(59,130,246,0.24))",
      "linear-gradient(135deg, rgba(34,197,94,0.38), rgba(6,182,212,0.25))",
      "linear-gradient(135deg, rgba(249,115,22,0.34), rgba(56,189,248,0.24))",
    ],
  },
  "white-labeler": {
    leftTitleLine1: "White-Labeler",
    leftTitleLine2: "Portal",
    heading: "White-labeler sign in",
    description:
      "Sign in with your white-labeler credentials to manage branding, pricing controls, and payout operations.",
    helperText: "Need access? Apply to become a white-label partner.",
    helperHref: "/white-labeler/apply",
    helperCta: "Apply for white-label access",
    forgotPasswordHref: "/white-labeler/forgot-password",
    leftTints: [
      "linear-gradient(135deg, rgba(251,146,60,0.46), rgba(59,130,246,0.24))",
      "linear-gradient(135deg, rgba(236,72,153,0.38), rgba(251,146,60,0.28))",
      "linear-gradient(135deg, rgba(45,212,191,0.4), rgba(249,115,22,0.26))",
      "linear-gradient(135deg, rgba(168,85,247,0.36), rgba(14,165,233,0.24))",
    ],
  },
  customer: {
    leftTitleLine1: "Customer",
    leftTitleLine2: "Portal",
    heading: "Customer sign in",
    description:
      "Sign in with your customer credentials to view your workspace and support operations.",
    helperText: "Need access? Contact your Statxeo account owner for an invite.",
    helperHref: "/help",
    helperCta: "Get support",
    forgotPasswordHref: "/customer/forgot-password",
    leftTints: [
      "linear-gradient(135deg, rgba(14,165,233,0.36), rgba(99,102,241,0.24))",
      "linear-gradient(135deg, rgba(34,197,94,0.32), rgba(56,189,248,0.22))",
      "linear-gradient(135deg, rgba(148,163,184,0.34), rgba(59,130,246,0.22))",
    ],
  },
};

export function Auth2({ onSubmit, isLoading = false, error = "", portal = "affiliate" }: Auth2Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTintIndex, setActiveTintIndex] = useState(0);

  const content = portalContent[portal];
  const animateRandomTint = portal === "white-labeler";

  const leftTints = useMemo(() => content.leftTints, [content.leftTints]);

  useEffect(() => {
    if (!animateRandomTint || leftTints.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveTintIndex((current) => {
        let next = current;
        while (next === current) {
          next = Math.floor(Math.random() * leftTints.length);
        }
        return next;
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [animateRandomTint, leftTints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(email, password);
    } else {
      console.log("Sign in:", { email, password });
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-neutral-950">
      {/* Left Column - Gradient Background with Logo & Tagline */}
      <div className="hidden lg:flex lg:w-1/2 p-4 bg-white dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full rounded-md p-12 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-bottom"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1623410439361-22ac19216577?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
              transform: "scale(1.2)",
            }}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTintIndex}
              className="absolute inset-0"
              style={{ background: leftTints[activeTintIndex] }}
              initial={{ opacity: 0.32 }}
              animate={{ opacity: 0.62 }}
              exit={{ opacity: 0.18 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img src="/whiteNBG.png" alt="Statxeo" className="h-16 w-auto xl:h-20" />
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-4xl font-bold text-neutral-900 leading-tight">
                {content.leftTitleLine1}
                <br />
                {content.leftTitleLine2}
              </h2>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Title */}
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
              {content.heading}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
              {content.description}
            </p>
          </div>

          {/* Email/Password Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-400 dark:focus:border-neutral-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-400 dark:focus:border-neutral-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Sign In Button */}
            {content.forgotPasswordHref ? (
              <div className="text-right">
                <Link
                  href={content.forgotPasswordHref}
                  className="inline-flex text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </motion.form>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-6 space-y-3 text-center"
          >
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {content.helperText}
            </p>
            <Link
              href={content.helperHref}
              className="inline-flex text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              {content.helperCta}
            </Link>
            <Link
              href="/"
              className="inline-flex text-sm text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Back to home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth2;
