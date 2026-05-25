import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { WhiteLabelerBillingPage } from "@/components/white-labeler/pages/billing-page"

function BillingPageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function WhiteLabelerBillingRoutePage() {
  return (
    <Suspense fallback={<BillingPageFallback />}>
      <WhiteLabelerBillingPage />
    </Suspense>
  )
}
