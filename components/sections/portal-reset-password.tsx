"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"

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
    successRedirectHref: string
    successRedirectLabel: string
  }
> = {
  affiliate: {
    title: "Choose a new password",
    description: "Set a new password for your affiliate partner account.",
    loginHref: "/affiliate/login",
    successRedirectHref: "/affiliate/portal",
    successRedirectLabel: "affiliate portal",
  },
  customer: {
    title: "Choose a new password",
    description: "Set a new password for your customer workspace account.",
    loginHref: "/customer/login",
    successRedirectHref: "/customer",
    successRedirectLabel: "customer portal",
  },
  "white-labeler": {
    title: "Choose a new password",
    description: "Set a new password for your white-labeler partner account.",
    loginHref: "/white-labeler/login",
    successRedirectHref: "/white-labeler",
    successRedirectLabel: "white-labeler portal",
  },
}

function isEmailOtpType(value: string): value is EmailOtpType {
  return value === "signup" || value === "invite" || value === "magiclink" || value === "recovery" || value === "email_change" || value === "email"
}

export function PortalResetPasswordSection({ portal }: { portal: PortalKey }) {
  const config = portalConfig[portal]
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreparing, setIsPreparing] = useState(true)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    const initializeRecoverySession = async () => {
      setIsPreparing(true)

      try {
        const supabase = createBrowserSupabaseClient()
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        const tokenHash = params.get("token_hash")
        const type = params.get("type")

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            throw exchangeError
          }
        }

        if (tokenHash && type && isEmailOtpType(type)) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })

          if (verifyError) {
            throw verifyError
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          setIsRecoveryReady(true)
          setError("")
          return
        }

        setIsRecoveryReady(false)
        setError("This reset link is invalid or expired. Request a new password reset email.")
      } catch (sessionError) {
        if (!isMounted) return

        if (sessionError instanceof Error && sessionError.message) {
          setError(sessionError.message)
        } else {
          setError("Unable to validate reset link.")
        }

        setIsRecoveryReady(false)
      } finally {
        if (isMounted) {
          setIsPreparing(false)
        }
      }
    }

    void initializeRecoverySession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess(false)

    if (!isRecoveryReady) {
      setError("This reset link is invalid or expired. Request a new password reset email.")
      return
    }

    if (password.length < 10) {
      setError("Password must be at least 10 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)

      window.setTimeout(() => {
        router.replace(config.successRedirectHref)
        router.refresh()
      }, 1200)
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message) {
        setError(requestError.message)
      } else {
        setError("Unable to reset password right now.")
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
            {isPreparing ? (
              <Alert>
                <AlertTitle>Validating reset link</AlertTitle>
                <AlertDescription>
                  Please wait while we prepare your secure password reset session.
                </AlertDescription>
              </Alert>
            ) : null}

            {success ? (
              <Alert>
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription>
                  Your password is set. Redirecting you to the {config.successRedirectLabel}...
                </AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to reset password</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {isRecoveryReady ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor={`${portal}-reset-password`}>New password</Label>
                  <Input
                    id={`${portal}-reset-password`}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${portal}-reset-password-confirm`}>Confirm password</Label>
                  <Input
                    id={`${portal}-reset-password-confirm`}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || isPreparing}>
                  {isSubmitting ? "Updating password..." : "Update password"}
                </Button>
              </form>
            ) : null}

            <Button asChild variant="outline" className="w-full">
              <Link href={config.loginHref}>Back to sign in</Link>
            </Button>

            {!isRecoveryReady && !isPreparing ? (
              <Button asChild variant="ghost" className="w-full">
                <Link href={config.loginHref.replace("/login", "/forgot-password")}>Request a new reset link</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}