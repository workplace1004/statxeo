import {listPlans} from "../../../server/queries/affiliate";
import {AffiliatePricingPage} from "../../../views/affiliate/pricing-page";

export default async function Page() {
  const plans = await listPlans();

  return <AffiliatePricingPage features={[]} plans={plans} promotions={[]} />;
}
