import Link from "next/link"

export const dynamic = "force-dynamic"

export default function AuthErrorPage() {
  return (
    <section className="min-h-screen bg-neutral-950 px-4 py-16 text-white sm:px-6 flex items-center justify-center">
      <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-lg backdrop-blur-md">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-rose-500">Authentication Link Invalid or Expired</h2>
          <p className="text-sm text-neutral-400">
            The login link you opened is invalid, expired, or has already been used. Please request a new link or try signing in again.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login/partners"
            className="w-full inline-flex justify-center items-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm font-medium px-4 py-3 text-white transition-colors"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="w-full inline-flex justify-center items-center rounded-full border border-neutral-850 hover:bg-neutral-850 text-sm font-medium px-4 py-3 text-neutral-300 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </section>
  )
}
