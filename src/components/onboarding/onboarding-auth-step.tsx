"use client";

import {useState} from "react";
import {motion} from "motion/react";
import {Eye, EyeOff} from "lucide-react";
import type {GoogleAuthPersona} from "@/lib/auth/google-auth";
import {cn} from "@/lib/utils";
import {GoogleSignInButton} from "@/components/auth/google-sign-in-button";

export type OnboardingAuthAccent = "default" | "orange";

type OnboardingAuthStepProps = {
  accent?: OnboardingAuthAccent;
  mode?: "sign-in" | "sign-up";
  title?: string;
  subtitle?: string;
  brandName?: string;
  tagline?: string;
  googlePersona?: GoogleAuthPersona;
  googleReturnTo?: string;
  onSubmit?: (data: {email: string; password: string}) => void;
};

const accentStyles = {
  default: {
    button:
      "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200",
    focus:
      "focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-400 dark:focus:border-neutral-600",
    link: "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
  },
  orange: {
    button: "bg-orange-600 text-white hover:bg-orange-700",
    focus: "focus:ring-orange-500/40 focus:border-orange-500",
    link: "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300",
  },
} as const;

export function OnboardingAuthStep({
  accent = "default",
  mode = "sign-up",
  title,
  subtitle,
  brandName = "StatXEO",
  tagline = "AI-powered SEO & marketing, on autopilot.",
  googlePersona,
  googleReturnTo,
  onSubmit,
}: OnboardingAuthStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const styles = accentStyles[accent];
  const heading =
    title ?? (mode === "sign-up" ? "Create your account" : "Sign in to your account");
  const primaryLabel = mode === "sign-up" ? "Create account" : "Sign in";
  const alternateLabel = mode === "sign-up" ? "Already have an account?" : "No account?";
  const alternateAction = mode === "sign-up" ? "Sign in" : "Sign up";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({email, password});
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.4}}
      className="grid w-full gap-8 lg:grid-cols-2 lg:gap-12"
    >
      <motion.div className="relative hidden overflow-hidden rounded-2xl lg:flex lg:flex-col lg:justify-between">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1623410439361-22ac19216577?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-8 text-white">
          <div className="flex items-center gap-3">
            <motion.div className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <svg className="size-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17L12 12L2 17Z" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold">{brandName}</span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">{tagline}</h2>
        </div>
      </motion.div>

      <div className="flex w-full flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          {subtitle ? (
            <p className="mb-2 text-sm font-medium tracking-wide text-orange-600 uppercase dark:text-orange-400">
              {subtitle}
            </p>
          ) : null}
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
            {heading}
          </h1>

          {googlePersona ? (
            <>
              <div className="mb-6 space-y-3">
                <GoogleSignInButton
                  auth={{
                    persona: googlePersona,
                    returnTo: googleReturnTo,
                    mode,
                  }}
                />
              </div>
              <div className="mb-6 flex items-center gap-4">
                <motion.div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-sm text-neutral-500">or</span>
                <motion.div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={cn(
                "w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-900 transition-all outline-none placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
                styles.focus,
              )}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className={cn(
                  "w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 pr-12 text-neutral-900 transition-all outline-none placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
                  styles.focus,
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
              </button>
            </div>
            <button
              type="submit"
              className={cn(
                "w-full rounded-xl px-6 py-3 font-medium transition-colors duration-200",
                styles.button,
              )}
            >
              {primaryLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
            {alternateLabel}{" "}
            <button type="button" className={cn("font-medium", styles.link)}>
              {alternateAction}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
