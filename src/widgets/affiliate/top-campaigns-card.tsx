"use client";

import {Card} from "@heroui/react";
import {BarChart} from "@heroui-pro/react";

import {EmptyState} from "../empty-state";

export type TopCampaignPoint = {
  campaign: string;
  earnings: number;
};

export interface TopCampaignsCardProps {
  data: TopCampaignPoint[];
}

function formatThousands(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`;
}

export function TopCampaignsCard({data}: TopCampaignsCardProps) {
  const hasData = data.length > 0;

  return (
    <Card className="h-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Top campaigns</Card.Title>
        <Card.Description>Highest-earning referral campaigns this quarter.</Card.Description>
      </Card.Header>
      <Card.Content>
        {hasData ? (
          <BarChart data={data as Array<Record<string, string | number>>} height={300} layout="vertical">
            <BarChart.Grid horizontal={false} />
            <BarChart.XAxis tickFormatter={formatThousands} tickMargin={4} type="number" />
            <BarChart.YAxis dataKey="campaign" tickMargin={4} type="category" width={150} />
            <BarChart.Bar
              barSize={16}
              dataKey="earnings"
              fill="var(--chart-3)"
              name="Earnings"
              radius={[0, 16, 16, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        ) : (
          <EmptyState
            body="Once your campaigns start generating commissions, the top earners rank here."
            title="No campaign earnings yet"
          />
        )}
      </Card.Content>
    </Card>
  );
}
