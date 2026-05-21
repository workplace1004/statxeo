import {getCurrentCustomerOrgId} from "../../../server/context";
import {listCustomerInvoices} from "../../../server/queries/customer";
import {CustomerBillingPage} from "../../../views/customer/billing-page";

export default async function Page() {
  const customerOrgId = await getCurrentCustomerOrgId();
  const invoices = await listCustomerInvoices({customerOrgId});

  return <CustomerBillingPage invoices={invoices} />;
}
