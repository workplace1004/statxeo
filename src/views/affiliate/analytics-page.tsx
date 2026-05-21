"use client";

import {ArrowDownToLine} from "@gravity-ui/icons";
import {Button, Card} from "@heroui/react";
import {KPI, KPIGroup, Segment} from "@heroui-pro/react";
import {useState} from "react";

import {exportReferralLinksCsv} from "../../lib/export/export-affiliate-csv";
import {notifySuccess} from "../../lib/ui/white-label-notify";
import {ClicksTrendCard} from "../../widgets/affiliate/clicks-trend-card";
import {ConversionFunnelCard} from "../../widgets/affiliate/conversion-funnel-card";
import {TopCampaignsCard} from "../../widgets/affiliate/top-campaigns-card";
import {EmptyState} from "../../widgets/empty-state";

const TIME_RANGES = ["7D", "30D", "90D", "12M"] as const;

export function AffiliateAnalyticsPage() {
  const [range, setRange] = useState<string>("30D");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Drill into earnings, conversion funnels, and your top-performing campaigns.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              exportReferralLinksCsv([]);
              notifySuccess("Analytics export ready (empty until campaigns have data)");
            }}
          >
            <ArrowDownToLine className="size-4" />
            Export
          </Button>
          <Segment
            aria-label="Time range"
            selectedKey={range}
            size="sm"
            onSelectionChange={(key) => setRange(String(key))}
          >
            {TIME_RANGES.map((r) => (
              <Segment.Item key={r} id={r}>
                {r}
              </Segment.Item>
            ))}
          </Segment>
        </div>
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Earnings · 30d</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Conversions</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg. EPC</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
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

      <ClicksTrendCard data={[]} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ConversionFunnelCard data={[]} />
        <TopCampaignsCard data={[]} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">EPC by vertical</Card.Title>
            <Card.Description>Earnings per click, last 90 days.</Card.Description>
          </Card.Header>
          <Card.Content>
            <EmptyState
              body="Per-vertical EPC ranks here once your campaigns deliver clicks."
              title="No vertical data yet"
            />
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Channel mix</Card.Title>
            <Card.Description>Where your conversions come from.</Card.Description>
          </Card.Header>
          <Card.Content>
            <EmptyState
              body="Channel-by-channel attribution will populate as conversions come in."
              title="No channel mix yet"
            />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
