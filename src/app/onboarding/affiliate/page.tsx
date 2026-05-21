import {Suspense} from "react";
import {AffiliateOnboardingFlow} from "@/shared/onboarding/affiliate-onboarding-flow";

export default function AffiliateOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <AffiliateOnboardingFlow />
    </Suspense>
  );
}
