import type {Customer} from "../../server/db/schemas/customers";

import {buildCsv, downloadCsv} from "./export-csv";

const CUSTOMER_COLUMNS = [
  {header: "Name", value: (c: Customer) => c.name},
  {header: "Contact name", value: (c: Customer) => c.contactName},
  {header: "Email", value: (c: Customer) => c.contactEmail},
  {header: "Industry", value: (c: Customer) => c.industry},
  {header: "City", value: (c: Customer) => c.city},
  {header: "Plan", value: (c: Customer) => c.plan},
  {header: "Status", value: (c: Customer) => c.status},
  {header: "MRR", value: (c: Customer) => c.mrr},
  {header: "Sites", value: (c: Customer) => c.sites},
  {header: "Keywords", value: (c: Customer) => c.keywords},
  {header: "Health", value: (c: Customer) => c.health},
  {header: "Joined", value: (c: Customer) => c.joinedAt},
  {header: "Last activity", value: (c: Customer) => c.lastActivity},
] as const;

export function exportCustomersCsv(customers: Customer[], filename = "customers.csv"): void {
  downloadCsv(filename, buildCsv(customers, [...CUSTOMER_COLUMNS]));
}
