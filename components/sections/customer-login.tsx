"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Auth2 } from "@/components/blocks/auth-2"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

function getNextDestination(next: string | null) {
  if (next && next.startsWith("/")) {
    return next
  }

  return "/customer"
}

export function CustomerLoginSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

  return <Auth2 portal="customer" onSubmit={handleLogin} isLoading={isLoading} error={error} />
}
