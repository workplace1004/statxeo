import type {InvoiceAgency} from "../../server/db/schemas/invoices";

import {buildCsv, downloadCsv} from "./export-csv";

export function exportInvoicesCsv(invoices: InvoiceAgency[], filename = "invoices.csv"): void {
  downloadCsv(
    filename,
    buildCsv(invoices, [
      {header: "Invoice", value: (i) => i.number},
      {header: "Customer", value: (i) => i.customer},
      {header: "Amount", value: (i) => i.amount},
      {header: "Currency", value: (i) => i.currency},
      {header: "Status", value: (i) => i.status},
      {header: "Issued", value: (i) => i.issuedAt},
      {header: "Due", value: (i) => i.dueAt},
    ]),
  );
}
