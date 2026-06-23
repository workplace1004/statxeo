"use client";

import type {ChannelPoint} from "../../widgets/customer/channels-card";
import type {DevicePoint} from "../../widgets/customer/devices-card";
import type {TrafficPoint} from "../../widgets/customer/traffic-line-card";

import {ChartColumn, ArrowDownToLine} from "@gravity-ui/icons";
import {Button, Card} from "@heroui/react";
import {KPI, KPIGroup, Segment} from "@heroui-pro/react";
import {useState} from "react";

import {exportAnalyticsCsv} from "../../lib/export/export-customer-csv";
import {notifySuccess} from "../../lib/ui/white-label-notify";
import {ChannelsCard} from "../../widgets/customer/channels-card";
import {DevicesCard} from "../../widgets/customer/devices-card";
import {TrafficLineCard} from "../../widgets/customer/traffic-line-card";
import {PageToolbar} from "../../widgets/page-toolbar";
import {EmptyState} from "../../widgets/empty-state";

const RANGES = ["7D", "30D", "90D", "12M"] as const;

export interface LeadsPoint {
  week: string;
  leads: number;
  bookings: number;
}

export interface ConversionsPoint {
  source: string;
  conversions: number;
}

export interface CustomerAnalyticsPageProps {
  traffic: TrafficPoint[];
  channels: ChannelPoint[];
  devices: DevicePoint[];
  leads: LeadsPoint[];
  conversions: ConversionsPoint[];
}

export function CustomerAnalyticsPage({
  channels,
  conversions,
  devices,
  leads,
  traffic,
}: CustomerAnalyticsPageProps) {
  const [range, setRange] = useState<string>("30D");
  const totalLeads = leads.reduce((s, p) => s + p.leads, 0);
  const totalBookings = leads.reduce((s, p) => s + p.bookings, 0);
  const hasVisitors = traffic.length > 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        title="Analytics"
        description="See how every channel — search, social, calls — feeds your pipeline."
        showPeriod={false}
        trailing={
          <>
            <Segment
              aria-label="Time range"
              selectedKey={range}
              size="sm"
              onSelectionChange={(key: any) => setRange(String(key))}
            >
              {RANGES.map((r) => (
                <Segment.Item key={r} id={r}>
                  {r}
                </Segment.Item>
              ))}
            </Segment>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportAnalyticsCsv({range, traffic, channels, devices});
                notifySuccess(`Exported analytics snapshot (${range})`);
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
          </>
        }
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Visitors</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Leads</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {totalLeads === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={totalLeads} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Bookings</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {totalBookings === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={totalBookings} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Conversion rate</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <TrafficLineCard data={traffic} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DevicesCard data={devices} />
        <ChannelsCard data={channels} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Leads & bookings</Card.Title>
            <Card.Description>Weekly leads from all sources.</Card.Description>
          </Card.Header>
          <Card.Content>
            <EmptyState
              body="Once you start receiving leads from calls and forms, the trend appears here."
              cta={{href: "/customer/calling", label: "View calls"}}
              icon={ChartColumn}
              title="No leads data yet"
            />
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Conversions by source</Card.Title>
            <Card.Description>Where customers come from when they convert.</Card.Description>
          </Card.Header>
          <Card.Content>
            <EmptyState
              body={
                hasVisitors || conversions.length > 0
                  ? "We'll group conversions by source as data comes in."
                  : "Conversion data appears once analytics is connected and traffic starts flowing."
              }
              icon={ChartColumn}
              title="No conversions yet"
            />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
