"use client";

import {ChartLine} from "@gravity-ui/icons";

import {EmptyState} from "../empty-state";

export interface CampaignPerformanceCardProps {
  data?: never[];
}

export function CampaignPerformanceCard(_props: CampaignPerformanceCardProps = {}) {
  return (
    <EmptyState
      body="Once campaigns are running across customers, sessions, top-3 ranks, and conversions will trend here."
      icon={ChartLine}
      title="No campaign performance yet"
    />
  );
}
