import type { BoostPackageId, WebsitePackageId } from "@/lib/statxeo/catalog"

export const STATXEO_PURCHASE_INTENT_EVENT = "statxeo:purchase-intent"

export type PurchaseIntent =
  | {
      purchaseType: "website"
      packageId: WebsitePackageId
    }
  | {
      purchaseType: "boost"
      packageId: BoostPackageId
    }

export function dispatchPurchaseIntent(intent: PurchaseIntent) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent<PurchaseIntent>(STATXEO_PURCHASE_INTENT_EVENT, {
      detail: intent,
    }),
  )
}