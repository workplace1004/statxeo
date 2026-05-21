import {Suspense} from "react";
import {CustomerOnboardingFlow} from "@/shared/onboarding/customer-onboarding-flow";

export default function CustomerOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <CustomerOnboardingFlow />
    </Suspense>
  );
}
