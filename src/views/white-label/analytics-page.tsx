"use client";

import {ArrowDownToLine, ChartLine, Headphones, Magnifier, Target} from "@gravity-ui/icons";
import {Button, Skeleton} from "@heroui/react";
import {KPI, Segment, BarChart, LineChart, PieChart} from "@heroui-pro/react";
import {useCallback, useEffect, useState} from "react";
import {downloadCsv} from "../../lib/export/export-csv";
import {notifyError, notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

const TIME_RANGES = ["7D", "30D", "90D", "12M"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

interface AnalyticsSummary {
  kpis: {
    totalSpend: number;
    activeCampaigns: number;
    totalCustomers: number;
    publishedPosts: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    ctr: number;
    completedWorkflows: number;
  };
  charts: {
    spendTrend: Array<{date: string; spend: number}>;
    channelSplit: Array<{name: string; value: number}>;
  };
}

function fmt(n: number, style: "currency" | "percent" | "number" = "number"): string {
  if (style === "currency") return new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0}).format(n);
  if (style === "percent") return `${n.toFixed(2)}%`;
  return new Intl.NumberFormat("en-US").format(n);
}

export function WhiteLabelAnalyticsPage() {
  const [range, setRange] = useState<TimeRange>("30D");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (r: TimeRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/summary?range=${r}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      notifyError("Could not load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const kpiCards = data
    ? [
        {label: "Total Ad Spend", value: fmt(data.kpis.totalSpend, "currency")},
        {label: "Active Campaigns", value: String(data.kpis.activeCampaigns)},
        {label: "Total Customers", value: String(data.kpis.totalCustomers)},
        {label: "Posts Published", value: String(data.kpis.publishedPosts)},
        {label: "Impressions", value: fmt(data.kpis.totalImpressions)},
        {label: "Clicks", value: fmt(data.kpis.totalClicks)},
        {label: "Conversions", value: fmt(data.kpis.totalConversions)},
        {label: "CTR", value: fmt(data.kpis.ctr, "percent")},
      ]
    : Array(8).fill(null);

  const hasSpendData = (data?.charts.spendTrend ?? []).some((d) => d.spend > 0);
  const hasChannelData = (data?.charts.channelSplit ?? []).length > 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-10 pt-4">
      <PageToolbar
        description="Ad spend, impressions, clicks, conversions, and campaign ROAS — across every customer."
        showPeriod={false}
        title="Analytics"
        trailing={
          <>
            <Segment
              aria-label="Time range"
              selectedKey={range}
              size="sm"
              onSelectionChange={(key: any) => {
                const next = String(key) as TimeRange;
                setRange(next);
              }}
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
                if (!data) return;
                const rows = [
                  "metric,value",
                  `Total Ad Spend,${data.kpis.totalSpend}`,
                  `Active Campaigns,${data.kpis.activeCampaigns}`,
                  `Total Customers,${data.kpis.totalCustomers}`,
                  `Posts Published,${data.kpis.publishedPosts}`,
                  `Impressions,${data.kpis.totalImpressions}`,
                  `Clicks,${data.kpis.totalClicks}`,
                  `Conversions,${data.kpis.totalConversions}`,
                  `CTR,${data.kpis.ctr}%`,
                ].join("\n");
                downloadCsv(`analytics-${range}.csv`, rows);
                notifySuccess(`Exported analytics snapshot (${range})`);
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
          </>
        }
      />

      {/* ── KPI Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpiCards.map((kpi, i) => (
          <KPI key={kpi?.label ?? i}>
            <KPI.Header>
              <KPI.Title>{kpi?.label ?? ""}</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              {loading ? (
                <Skeleton className="h-7 w-16 rounded-lg" />
              ) : (
                <span className="text-foreground text-xl font-bold tabular-nums">{kpi?.value ?? "—"}</span>
              )}
            </KPI.Content>
          </KPI>
        ))}
      </div>

      {/* ── Spend Trend Chart ──────────────────────────────────────────── */}
      <div className="bg-content1 rounded-2xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Ad Spend Trend ({range})</h3>
        {loading ? (
          <Skeleton className="h-52 w-full rounded-xl" />
        ) : hasSpendData ? (
          <LineChart data={data!.charts.spendTrend} height={220}>
            <LineChart.Grid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <LineChart.XAxis dataKey="date" tick={{fontSize: 11, fill: "#9ca3af"}} axisLine={false} tickLine={false} />
            <LineChart.YAxis tick={{fontSize: 11, fill: "#9ca3af"}} axisLine={false} tickLine={false} />
            <LineChart.Tooltip content={<LineChart.TooltipContent />} cursor={{fill: "rgba(255,255,255,0.04)"}} />
            <LineChart.Line dataKey="spend" type="monotone" stroke="#6366f1" strokeWidth={2} dot={{r: 3, fill: "#6366f1"}} activeDot={{r: 5}} />
          </LineChart>
        ) : (
          <EmptyState
            body="Spend data will appear here once campaigns are running."
            icon={ChartLine}
            title="No spend data yet"
          />
        )}
      </div>

      {/* ── Channel Split + Completed Workflows ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-content1 rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Channel Split</h3>
          {loading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : hasChannelData ? (
            <PieChart height={220}>
              <PieChart.Pie data={data!.charts.channelSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                {data!.charts.channelSplit.map((_, index) => (
                  <PieChart.Cell key={`cell-${index}`} fill={["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#a78bfa"][index % 6]} />
                ))}
              </PieChart.Pie>
              <PieChart.Tooltip content={<PieChart.TooltipContent />} />
            </PieChart>
          ) : (
            <EmptyState
              body="Channel breakdown appears once Meta or Google campaigns are active."
              icon={Target}
              title="No channel data yet"
            />
          )}
        </div>

        <div className="bg-content1 rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Completed Workflows ({range})</h3>
          {loading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (data?.kpis.completedWorkflows ?? 0) > 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2">
              <span className="text-5xl font-black text-indigo-400 tabular-nums">
                {data?.kpis.completedWorkflows}
              </span>
              <span className="text-sm text-muted">workflows completed in {range}</span>
            </div>
          ) : (
            <EmptyState
              body="Local SEO and campaign workflows will appear here once complete."
              icon={Magnifier}
              title="No completed workflows yet"
            />
          )}
        </div>
      </div>

      {/* ── Call Tracking placeholder ──────────────────────────────────── */}
      <EmptyState
        body="Inbound calls tracked across customers will land here with outcomes."
        icon={Headphones}
        title="No tracked calls yet"
      />
    </div>
  );
}
