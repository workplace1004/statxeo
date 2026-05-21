import {Suspense} from "react";
import {WhiteLabelOnboardingFlow} from "@/shared/onboarding/white-label-onboarding-flow";

export default function WhiteLabelOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <WhiteLabelOnboardingFlow />
    </Suspense>
  );
}
