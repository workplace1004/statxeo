"use client";

import type {ChipColor} from "../../server/db/schemas/_helpers";

import {ArrowRight} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip} from "@heroui/react";
import {NumberValue} from "@heroui-pro/react";
import {useRouter} from "next/navigation";

import {EmptyState} from "../empty-state";

export type RecentReferralStatus = "Signed up" | "Demo booked" | "Trial started" | "Closed-won";

export interface RecentReferral {
  id: string;
  company: string;
  contact: {
    name: string;
    avatar: string;
  };
  source: string;
  amount: number;
  status: RecentReferralStatus;
  whenLabel: string;
}

export interface RecentReferralsCardProps {
  referrals: readonly RecentReferral[];
}

const REFERRAL_STATUS_COLORS: Record<RecentReferralStatus, ChipColor> = {
  "Closed-won": "success",
  "Demo booked": "accent",
  "Signed up": "default",
  "Trial started": "warning",
};

export function RecentReferralsCard({referrals}: RecentReferralsCardProps) {
  const router = useRouter();

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Card.Title className="text-base">Recent referrals</Card.Title>
          <Card.Description>Latest signups and conversions.</Card.Description>
        </div>
        <Button size="sm" variant="tertiary" onPress={() => router.push("/affiliate/leads")}>
          View all
          <ArrowRight className="size-4" />
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-0">
        {referrals.length === 0 ? (
          <EmptyState
            body="Leads from your referral links will appear here as they come in."
            cta={{href: "/affiliate/leads", label: "Add lead"}}
            title="No referrals yet"
          />
        ) : (
          referrals.slice(0, 6).map((ref) => (
            <div
              key={ref.id}
              className="border-content2 flex items-center gap-3 border-b py-2.5 last:border-b-0"
            >
              <Avatar className="size-8 shrink-0">
                <Avatar.Image alt={ref.contact.name} src={ref.contact.avatar} />
                <Avatar.Fallback>
                  {ref.contact.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground truncate text-sm font-medium">
                  {ref.company}
                </span>
                <span className="text-muted truncate text-xs">
                  {ref.source} · {ref.whenLabel}
                </span>
              </div>
              <Chip color={REFERRAL_STATUS_COLORS[ref.status]} size="sm" variant="soft">
                {ref.status}
              </Chip>
              <NumberValue
                className="text-foreground w-16 text-right text-sm font-semibold tabular-nums"
                currency="USD"
                maximumFractionDigits={0}
                style="currency"
                value={ref.amount}
              />
            </div>
          ))
        )}
      </Card.Content>
    </Card>
  );
}
