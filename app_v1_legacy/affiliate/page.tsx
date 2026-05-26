import type { Metadata } from "next"

import { AffiliateProgramSection } from "@/components/sections/affiliate-program"

export const metadata: Metadata = {
  title: "Affiliate Program | Statxeo",
  description:
    "Tutorial-style affiliate overview for Statxeo partners covering referral flow, portal use, commission lanes, and payout logic.",
}

export default function AffiliateProgramPage() {
  return <AffiliateProgramSection />
}