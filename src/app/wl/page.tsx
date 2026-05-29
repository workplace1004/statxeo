import type { Metadata } from "next"

import { WhiteLabelProgramSection } from "@/components/brand/white-label-program"

export const metadata: Metadata = {
  title: "White-Label Partners | Statxeo",
  description:
    "Tutorial-style overview of the Statxeo white-label partner flow, from approval and branding to pricing controls and payout operations.",
}

export default function WhiteLabelProgramPage() {
  return <WhiteLabelProgramSection />
}
