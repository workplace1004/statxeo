import type {Call} from "../../server/db/schemas/calls";
import type {CustomerKeyword} from "../../server/db/schemas/customer-keywords";
import type {InvoiceCustomer} from "../../server/db/schemas/invoices";
import type {SocialPostCustomer} from "../../server/db/schemas/social-posts";
import type {WebsitePage} from "../../server/db/schemas/website-pages";

import type {ChannelPoint} from "../../widgets/customer/channels-card";
import type {DevicePoint} from "../../widgets/customer/devices-card";
import type {TrafficPoint} from "../../widgets/customer/traffic-line-card";

import {buildCsv, downloadCsv} from "./export-csv";

export function exportKeywordsCsv(
  keywords: CustomerKeyword[],
  filename = "keywords.csv",
): void {
  downloadCsv(
    filename,
    buildCsv(keywords, [
      {header: "Keyword", value: (k) => k.keyword},
      {header: "URL", value: (k) => k.url},
      {header: "Intent", value: (k) => k.intent},
      {header: "Position", value: (k) => k.position},
      {header: "Change", value: (k) => k.change},
      {header: "Search volume", value: (k) => k.searchVolume},
      {header: "Difficulty", value: (k) => k.difficulty},
    ]),
  );
}

export function exportWebsitePagesCsv(pages: WebsitePage[], filename = "website-pages.csv"): void {
  downloadCsv(
    filename,
    buildCsv(pages, [
      {header: "Title", value: (p) => p.title},
      {header: "Slug", value: (p) => p.slug},
      {header: "Type", value: (p) => p.pageType},
      {header: "Status", value: (p) => p.status},
      {header: "Views", value: (p) => p.views},
      {header: "Conversion %", value: (p) => p.conversion},
      {header: "AI generated", value: (p) => (p.aiGenerated ? "Yes" : "No")},
      {header: "Updated", value: (p) => p.updatedAt},
    ]),
  );
}

export function exportCallsCsv(calls: Call[], filename = "calls.csv"): void {
  downloadCsv(
    filename,
    buildCsv(calls, [
      {header: "Caller", value: (c) => c.callerName},
      {header: "Phone", value: (c) => c.callerPhone},
      {header: "Direction", value: (c) => c.direction},
      {header: "Tag", value: (c) => c.tag},
      {header: "Summary", value: (c) => c.aiSummary},
      {header: "Duration (s)", value: (c) => c.durationSeconds},
      {header: "Booked job", value: (c) => (c.bookedJob ? "Yes" : "No")},
      {header: "Started", value: (c) => c.startedAt},
    ]),
  );
}

export function exportSocialPostsCsv(
  posts: SocialPostCustomer[],
  filename = "social-posts.csv",
): void {
  downloadCsv(
    filename,
    buildCsv(posts, [
      {header: "Title", value: (p) => p.title},
      {header: "Platform", value: (p) => p.platform},
      {header: "Status", value: (p) => p.status},
      {header: "Scheduled", value: (p) => p.scheduledFor},
      {header: "Impressions", value: (p) => p.engagement.impressions},
      {header: "Likes", value: (p) => p.engagement.likes},
      {header: "Comments", value: (p) => p.engagement.comments},
      {header: "Shares", value: (p) => p.engagement.shares},
    ]),
  );
}

export function exportCustomerInvoicesCsv(
  invoices: InvoiceCustomer[],
  filename = "invoices.csv",
): void {
  downloadCsv(
    filename,
    buildCsv(invoices, [
      {header: "Invoice", value: (i) => i.invoiceNumber},
      {header: "Period", value: (i) => i.period},
      {header: "Issued", value: (i) => i.date},
      {header: "Amount", value: (i) => i.amount},
      {header: "Currency", value: (i) => i.currency},
      {header: "Status", value: (i) => i.status},
    ]),
  );
}

export function exportAnalyticsCsv(
  opts: {
    range: string;
    traffic: TrafficPoint[];
    channels: ChannelPoint[];
    devices: DevicePoint[];
  },
  filename?: string,
): void {
  const name = filename ?? `analytics-${opts.range}.csv`;
  const sections: string[] = [`# Analytics snapshot (${opts.range})`, ""];

  if (opts.traffic.length > 0) {
    sections.push(
      buildCsv(opts.traffic, [
        {header: "Day", value: (r) => r.day},
        {header: "Visitors", value: (r) => r.visitors},
        {header: "Organic", value: (r) => r.organic},
        {header: "Direct", value: (r) => r.direct},
      ]),
      "",
    );
  }

  if (opts.channels.length > 0) {
    sections.push(
      buildCsv(opts.channels, [
        {header: "Channel", value: (r) => r.channel},
        {header: "Sessions", value: (r) => r.sessions},
      ]),
      "",
    );
  }

  if (opts.devices.length > 0) {
    sections.push(
      buildCsv(opts.devices, [
        {header: "Device", value: (r) => r.name},
        {header: "Sessions", value: (r) => r.value},
      ]),
    );
  }

  if (opts.traffic.length === 0 && opts.channels.length === 0 && opts.devices.length === 0) {
    sections.push("metric,value", "Visitors,", "Leads,", "Bookings,", "Conversion rate,");
  }

  downloadCsv(name, sections.join("\n").trim());
}
