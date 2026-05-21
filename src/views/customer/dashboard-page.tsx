"use client";

import type {AiTask} from "../../server/db/schemas/ai-tasks";
import type {BusinessProfile} from "../../server/db/schemas/business-profile";
import type {CustomerKeyword} from "../../server/db/schemas/customer-keywords";

import {Chip} from "@heroui/react";
import {motion} from "motion/react";
import Link from "next/link";

import {RouteButton} from "../../components/route-button";
import {AutomationSpotlightCard} from "../../widgets/customer/automation-spotlight-card";
import {ChannelsCard} from "../../widgets/customer/channels-card";
import {DashboardKpiRow} from "../../widgets/customer/dashboard-kpi-row";
import {DevicesCard} from "../../widgets/customer/devices-card";
import {EmailComingSoon} from "../../widgets/customer/email-coming-soon";
import {KeywordPreviewCard} from "../../widgets/customer/keyword-preview-card";
import {MessagesComingSoon} from "../../widgets/customer/messages-coming-soon";
import {QuickActionsStrip} from "../../widgets/customer/quick-actions-strip";
import {TrafficLineCard} from "../../widgets/customer/traffic-line-card";

export interface CustomerDashboardPageProps {
  businessProfile: BusinessProfile | null;
  pendingAi: AiTask[];
  keywords: CustomerKeyword[];
  avgRank: number | null;
  showWebsiteSetupBanner?: boolean;
}

export function CustomerDashboardPage({
  avgRank,
  businessProfile,
  keywords,
  pendingAi,
  showWebsiteSetupBanner = false,
}: CustomerDashboardPageProps) {
  const businessName = businessProfile?.name ?? "StatXEO";
  const pendingCount = pendingAi.filter((t) => t.status === "Waiting for approval").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      {/* Hero welcome row */}
      <motion.div
        animate={{opacity: 1, y: 0}}
        className="from-accent/10 flex flex-col gap-4 rounded-2xl bg-gradient-to-br to-transparent p-5 sm:flex-row sm:items-center sm:justify-between"
        initial={{opacity: 0, y: 10}}
        transition={{duration: 0.3}}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground text-xl font-semibold">{businessName}</h2>
            {!businessProfile ? (
              <Link href="/customer/settings">
                <Chip color="warning" size="sm" variant="soft">
                  Setup business profile
                </Chip>
              </Link>
            ) : (
              <Chip color="success" size="sm" variant="soft">
                AI active
              </Chip>
            )}
          </div>
          <p className="text-muted text-sm">
            {businessProfile
              ? "Here's a quick look at how things are running today."
              : "Add your business details to unlock your personalized overview."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pendingCount > 0 ? (
            <RouteButton href="/customer/ai" size="sm" variant="secondary">
              <span className="bg-accent flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white tabular-nums">
                {pendingCount}
              </span>
              Review AI tasks
            </RouteButton>
          ) : null}
          <RouteButton href="/customer/ai" size="sm">
            Open AI assistant
          </RouteButton>
        </div>
      </motion.div>

      {showWebsiteSetupBanner && (
        <div className="border-warning/30 bg-warning/10 flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Your website is ready to build</span>
            <span className="text-muted text-xs">
              Complete the 5-step setup to generate your AI-powered site.
            </span>
          </div>
          <RouteButton href="/customer/website/setup" size="sm">
            Set up website
          </RouteButton>
        </div>
      )}

      {/* Quick actions strip */}
      <QuickActionsStrip pendingAiCount={pendingCount} />

      <DashboardKpiRow
        totals={{
          avgRank,
          campaigns: 0,
          visitors: 0,
        }}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrafficLineCard data={[]} />
        </div>
        <KeywordPreviewCard keywords={keywords} />
      </div>

      {/* AI automation spotlight */}
      <AutomationSpotlightCard tasks={pendingAi} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChannelsCard data={[]} />
        <DevicesCard data={[]} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <MessagesComingSoon />
        <EmailComingSoon />
      </div>
    </div>
  );
}
