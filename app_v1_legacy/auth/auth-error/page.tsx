import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function AuthErrorPage() {
  return (
    <section className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Alert variant="destructive">
          <AlertTitle>Authentication link is invalid or expired</AlertTitle>
          <AlertDescription>
            Try requesting a new password reset email and open the newest link.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full">
            <Link href="/white-labeler/forgot-password">Request password reset</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/white-labeler/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
