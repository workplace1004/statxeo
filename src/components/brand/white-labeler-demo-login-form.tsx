"use client"

import { Sparkles } from "@gravity-ui/icons"
import { Button } from "@heroui/react"
import { cn } from "@/lib/utils"

type WhiteLabelerDemoPortalFormProps = {
  variant?: "neo" | "outline" | "secondary" | "default"
  size?: "default" | "sm" | "md" | "lg"
  /** Applied to the root `<form>` */
  className?: string
  /** Applied to the submit `<Button>` */
  buttonClassName?: string
  /** Short label for tight layouts (e.g. mobile sticky bar) */
  compactLabel?: boolean
}

export function WhiteLabelerDemoPortalForm({
  variant = "secondary",
  size = "lg",
  className,
  buttonClassName,
  compactLabel = false,
}: WhiteLabelerDemoPortalFormProps) {
  return (
    <form action="/api/white-label/demo-login" method="POST" className={className}>
      <Button
        type="submit"
        variant={
          variant === "neo"
            ? "primary"
            : variant === "default"
              ? "primary"
              : variant
        }
        className={cn("min-h-12 w-full touch-manipulation sm:w-auto", buttonClassName)}
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        {compactLabel ? "Demo" : "Try demo portal"}
      </Button>
    </form>
  )
}
