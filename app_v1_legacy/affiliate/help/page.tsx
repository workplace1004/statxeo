import type { Metadata } from "next"

import { AffiliateHelpSection } from "@/components/sections/affiliate-help"

export const metadata: Metadata = {
  title: "Affiliate Help | Statxeo",
  description:
    "Affiliate playbooks, payout guidance, link strategy, and portal help for Statxeo partners.",
}

export default function AffiliateHelpPage() {
  return <AffiliateHelpSection />
}