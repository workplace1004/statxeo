"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Auth2 } from "@/components/blocks/auth-2"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

function getNextDestination(next: string | null) {
  if (next && next.startsWith("/")) {
    return next
  }

  return "/white-labeler"
}

export function WhiteLabelerLoginSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const demo = searchParams.get("demo")
    if (!demo) return

    if (demo === "failed") {
      setError("Demo sign-in could not complete. Sign in manually or contact support if this persists.")
    } else if (demo === "config") {
      setError("Demo sign-in is not fully configured for this deployment.")
    } else if (demo === "busy") {
      setError("Too many demo sign-in attempts. Please wait a few minutes and try again.")
    }
  }, [searchParams])

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createBrowserSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const destination = getNextDestination(searchParams.get("next"))
      router.replace(destination)
      router.refresh()
    } catch (loginError) {
      if (loginError instanceof Error && loginError.message) {
        setError(loginError.message)
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return <Auth2 portal="white-labeler" onSubmit={handleLogin} isLoading={isLoading} error={error} />
}
