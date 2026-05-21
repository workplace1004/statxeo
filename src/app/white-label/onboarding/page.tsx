import {getCurrentAgencyOrgId} from "../../../server/context";
import {
  listOnboardingFlows,
  listOnboardingSteps,
  listServiceOptions,
} from "../../../server/queries/agency";
import {WhiteLabelOnboardingPage} from "../../../views/white-label/onboarding-page";

export default async function Page() {
  const agencyOrgId = await getCurrentAgencyOrgId();

  const [steps, queue, services] = await Promise.all([
    listOnboardingSteps({agencyOrgId}),
    listOnboardingFlows({agencyOrgId}),
    listServiceOptions({agencyOrgId}),
  ]);

  return <WhiteLabelOnboardingPage queue={queue} services={services} steps={steps} />;
}
