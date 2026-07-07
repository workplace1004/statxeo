"use client";

import type {DashboardKpiTotals} from "../../widgets/affiliate/dashboard-kpi-row";
import type {EarningsChartPoint} from "../../widgets/affiliate/earnings-chart-card";
import type {LeaderboardEntry} from "../../widgets/affiliate/leaderboard-card";
import type {RecentReferral} from "../../widgets/affiliate/recent-referrals-card";
import type {ClicksOverTime} from "../../widgets/affiliate/clicks-trend-card";
import type {Meeting} from "../../server/db/schemas/meetings";

import {
  ArrowDownToLine,
  ArrowsRotateLeft,
  ArrowUpRightFromSquare,
  Calendar,
  ChevronDown,
} from "@gravity-ui/icons";
import {Button, ButtonGroup, Dropdown, Label} from "@heroui/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {exportRecentReferralsCsv} from "../../lib/export/export-affiliate-csv";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {ShareLinkModal} from "../../widgets/affiliate/modals/share-link-modal";
import {PageToolbar} from "../../widgets/page-toolbar";
import {ClicksTrendCard} from "../../widgets/affiliate/clicks-trend-card";
import {DashboardKpiRow} from "../../widgets/affiliate/dashboard-kpi-row";
import {EarningsChartCard} from "../../widgets/affiliate/earnings-chart-card";
import {LeaderboardCard} from "../../widgets/affiliate/leaderboard-card";
import {RecentReferralsCard} from "../../widgets/affiliate/recent-referrals-card";
import {UpcomingMeetingsCard} from "../../widgets/affiliate/upcoming-meetings-card";

const PERIOD_LABELS: Record<string, string> = {
  "12m": "Last 12 months",
  "30d": "Last 30 days",
  "7d": "Last 7 days",
  "90d": "Last 90 days",
};

export interface AffiliateDashboardPageProps {
  totals: DashboardKpiTotals;
  earnings: EarningsChartPoint[];
  leaderboard: LeaderboardEntry[];
  meetings: Meeting[];
  recentReferrals: RecentReferral[];
  clicksTrend: ClicksOverTime[];
}

export function AffiliateDashboardPage({
  clicksTrend,
  earnings,
  leaderboard,
  meetings,
  recentReferrals,
  totals,
}: AffiliateDashboardPageProps) {
  const [period, setPeriod] = useState("30d");

  const dashboardShareUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://statxeo.com/affiliate";

    return `${window.location.origin}/affiliate`;
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        title="Dashboard"
        description="Welcome back — here's how your affiliate book is performing."
        showPeriod={false}
        trailing={
          <>
            <IconButton
              label="Refresh data"
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Dashboard refreshed")}
            >
              <ArrowsRotateLeft className="size-4" />
            </IconButton>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportRecentReferralsCsv(recentReferrals);
                notifySuccess(
                  recentReferrals.length > 0
                    ? `Exported ${recentReferrals.length} referrals`
                    : "Exported referral template (no rows yet)",
                );
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
            <ButtonGroup size="sm" variant="tertiary">
              <Button>
                <Calendar className="size-4" />
                {PERIOD_LABELS[period] ?? "Last 30 days"}
              </Button>
              <Dropdown>
                <Button isIconOnly aria-label="Change period" size="sm" variant="tertiary">
                  <ChevronDown className="size-4" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu
                    selectedKeys={[period]}
                    onAction={(key) => setPeriod(String(key))}
                  >
                    {Object.entries(PERIOD_LABELS).map(([id, label]) => (
                      <Dropdown.Item key={id} id={id} textValue={label}>
                        <Label>{label}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </ButtonGroup>
            <ShareLinkModal
              description="Anyone with this link can view a read-only snapshot of your affiliate dashboard."
              title="Share dashboard"
              url={dashboardShareUrl}
              trigger={
                <Button size="sm">
                  Share dashboard
                  <ArrowUpRightFromSquare className="size-3.5" />
                </Button>
              }
            />
          </>
        }
      />

      <DashboardKpiRow totals={totals} />

      <EarningsChartCard data={earnings} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <LeaderboardCard entries={leaderboard} />
        <UpcomingMeetingsCard meetings={meetings} />
      </div>

      <ClicksTrendCard data={clicksTrend} />

      <RecentReferralsCard referrals={recentReferrals} />
    </div>
  );
}
