import {getCurrentCustomerOrgId} from "../../../server/context";
import {listCalls, listPhoneNumbers} from "../../../server/queries/customer";
import {CustomerCallingPage} from "../../../views/customer/calling-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const [calls, phones] = await Promise.all([
    listCalls({customerOrgId}),
    listPhoneNumbers({customerOrgId}),
  ]);

  return <CustomerCallingPage calls={calls} phones={phones} />;
}
