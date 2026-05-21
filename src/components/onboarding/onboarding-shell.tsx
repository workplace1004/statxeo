"use client";

import type {ReactNode} from "react";
import Link from "next/link";
import {motion} from "motion/react";
import {Stepper} from "@heroui-pro/react";
import {Navigation3} from "@/components/blocks/navigation-3";

type OnboardingStep = {
  id: string;
  title: string;
};

type OnboardingShellProps = {
  title: string;
  description: string;
  steps: OnboardingStep[];
  currentStep: number;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
};

export function OnboardingShell({
  title,
  description,
  steps,
  currentStep,
  children,
  footer,
  backHref = "/",
}: OnboardingShellProps) {
  return (
    <motion.div className="bg-background text-foreground min-h-screen">
      <Navigation3 variant="minimal" />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <motion.div>
            <Link
              href={backHref}
              className="text-muted mb-3 inline-block text-sm no-underline hover:text-foreground"
            >
              ← Back
            </Link>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-muted mt-2 max-w-2xl text-sm sm:text-base">{description}</p>
          </motion.div>
        </motion.div>

        <Stepper className="mb-10" currentStep={currentStep}>
          {steps.map((step) => (
            <Stepper.Step key={step.id}>
              <Stepper.Indicator />
              <Stepper.Content>
                <Stepper.Title>{step.title}</Stepper.Title>
              </Stepper.Content>
              <Stepper.Separator />
            </Stepper.Step>
          ))}
        </Stepper>

        <motion.div>{children}</motion.div>
        {footer ? <motion.div className="mt-8 border-t pt-6">{footer}</motion.div> : null}
      </main>
    </motion.div>
  );
}
