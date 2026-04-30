"use client"

import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WhiteLabelerDemoPortalFormProps = {
  variant?: "neo" | "outline" | "secondary" | "default"
  size?: "default" | "lg" | "xl"
  /** Applied to the root `<form>` */
  className?: string
  /** Applied to the submit `<Button>` */
  buttonClassName?: string
  /** Short label for tight layouts (e.g. mobile sticky bar) */
  compactLabel?: boolean
}

export function WhiteLabelerDemoPortalForm({
  variant = "secondary",
  size = "xl",
  className,
  buttonClassName,
  compactLabel = false,
}: WhiteLabelerDemoPortalFormProps) {
  return (
    <form action="/api/white-labeler/demo-login" method="POST" className={className}>
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={cn("min-h-12 w-full touch-manipulation sm:w-auto", buttonClassName)}
        data-icon="inline-start"
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        {compactLabel ? "Demo" : "Try demo portal"}
      </Button>
    </form>
  )
}
