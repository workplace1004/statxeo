"use client";

import {ArrowDownToLine, ChartLine, Headphones, Magnifier, Target} from "@gravity-ui/icons";
import {Button} from "@heroui/react";
import {KPI, Segment} from "@heroui-pro/react";
import {useState} from "react";

import {downloadCsv} from "../../lib/export/export-csv";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

const TIME_RANGES = ["7D", "30D", "90D", "12M"] as const;

const KPI_PLACEHOLDERS = [
  {label: "Sessions"},
  {label: "Conversions"},
  {label: "Booked revenue"},
  {label: "Tracked calls"},
] as const;

export function WhiteLabelAnalyticsPage() {
  const [range, setRange] = useState<string>("30D");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Search, social, conversions, calls, and campaign ROAS — across every customer."
        showPeriod={false}
        title="Analytics"
        trailing={
          <>
            <Segment
              aria-label="Time range"
              selectedKey={range}
              size="sm"
<<<<<<< Updated upstream
              onSelectionChange={(key) => setRange(String(key))}
=======
              onSelectionChange={(key: any) => setRange(String(key))}
>>>>>>> Stashed changes
            >
              {TIME_RANGES.map((r) => (
                <Segment.Item key={r} id={r}>
                  {r}
                </Segment.Item>
              ))}
            </Segment>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                downloadCsv(
                  `analytics-${range}.csv`,
                  "metric,value\nSessions,\nConversions,\nBooked revenue,\nTracked calls,\n",
                );
                notifySuccess(`Exported analytics snapshot (${range})`);
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_PLACEHOLDERS.map((kpi) => (
          <KPI key={kpi.label}>
            <KPI.Header>
              <KPI.Title>{kpi.label}</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            </KPI.Content>
          </KPI>
        ))}
      </div>

      <EmptyState
        body="Once your customers start generating sessions, leads, and conversions, the trend will appear here."
        cta={{
          label: "Connect analytics",
          onPress: () => notifyInfo("Connect GA4 from customer onboarding or Settings"),
        }}
        icon={ChartLine}
        title="No conversion data yet"
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <EmptyState
          body="Acquisition channel breakdown will appear once analytics are connected."
          icon={Target}
          title="No channel data yet"
        />
        <EmptyState
          body="ROAS reports populate after your customers launch campaigns."
          icon={Magnifier}
          title="No campaign reports yet"
        />
      </div>

      <EmptyState
        body="Inbound calls tracked across customers will land here with outcomes."
        icon={Headphones}
        title="No tracked calls yet"
      />
    </div>
  );
}
