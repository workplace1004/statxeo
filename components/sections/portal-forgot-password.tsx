"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

type PortalKey = "affiliate" | "customer" | "white-labeler"

const portalConfig: Record<
  PortalKey,
  {
    title: string
    description: string
    loginHref: string
    redirectPath: string
    emailLabel: string
    placeholder: string
  }
> = {
  affiliate: {
    title: "Reset affiliate password",
    description: "Enter your affiliate email and we'll send you a secure reset link.",
    loginHref: "/affiliate/login",
    redirectPath: "/affiliate/reset-password",
    emailLabel: "Affiliate email",
    placeholder: "partner@example.com",
  },
  customer: {
    title: "Reset customer password",
    description: "Enter your customer email and we'll send you a secure reset link.",
    loginHref: "/customer/login",
    redirectPath: "/customer/reset-password",
    emailLabel: "Customer email",
    placeholder: "owner@business.com",
  },
  "white-labeler": {
    title: "Reset white-labeler password",
    description: "Enter your partner email and we'll send you a secure reset link.",
    loginHref: "/white-labeler/login",
    redirectPath: "/white-labeler/reset-password",
    emailLabel: "Work email",
    placeholder: "jane@agency.com",
  },
}

function getBaseUrl() {
  if (typeof window === "undefined") return ""
  return window.location.origin
}

export function PortalForgotPasswordSection({ portal }: { portal: PortalKey }) {
  const config = portalConfig[portal]
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const redirectTo = `${getBaseUrl()}${config.redirectPath}`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message) {
        setError(requestError.message)
      } else {
        setError("Unable to send reset email right now.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-lg">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              <Alert>
                <AlertTitle>Check your email</AlertTitle>
                <AlertDescription>
                  If an account exists for this email, a password reset link has been sent.
                </AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to send reset email</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor={`${portal}-forgot-email`}>{config.emailLabel}</Label>
                <Input
                  id={`${portal}-forgot-email`}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={config.placeholder}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending reset link..." : "Send reset link"}
              </Button>
            </form>

            <Button asChild variant="outline" className="w-full">
              <Link href={config.loginHref}>Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}