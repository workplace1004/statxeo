"use client";

import type {Customer} from "../../server/db/schemas/customers";

import {ArrowRight} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, ProgressBar} from "@heroui/react";
import {NumberValue, TrendChip} from "@heroui-pro/react";
import {RouteButton} from "../../components/route-button";

import {
  CUSTOMER_PLAN_COLOR,
  CUSTOMER_STATUS_COLOR,
} from "../../server/db/schemas/customers";

export interface CustomersPreviewCardProps {
  customers: Customer[];
}

export function CustomersPreviewCard({customers}: CustomersPreviewCardProps) {
  const top = [...customers].sort((a, b) => b.mrr - a.mrr).slice(0, 6);

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <div className="flex flex-col">
          <Card.Title className="text-base">Top customers</Card.Title>
          <Card.Description>Ranked by monthly recurring revenue.</Card.Description>
        </div>
        <RouteButton href="/white-label/customers" size="sm" variant="tertiary">
          View all
          <ArrowRight className="size-4" />
        </RouteButton>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1">
        {top.length === 0 ? (
          <p className="text-muted py-10 text-center text-sm">
            Customers you invite to your white-label will appear here.
          </p>
        ) : (
          <>
            <div className="text-muted hidden grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_0.6fr] gap-3 px-2 pb-1 text-xs font-medium md:grid">
              <span>Customer</span>
              <span>Plan</span>
              <span>Status</span>
              <span>MRR</span>
              <span>Health</span>
            </div>
            {top.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_0.6fr] items-center gap-3 rounded-xl px-2 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <Avatar.Image alt={customer.name} src={customer.avatar} />
                    <Avatar.Fallback>
                      {customer.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-foreground text-sm font-medium leading-tight">
                      {customer.name}
                    </span>
                    <span className="text-muted text-xs leading-tight">{customer.city}</span>
                  </div>
                </div>
                <Chip color={CUSTOMER_PLAN_COLOR[customer.plan]} size="sm" variant="soft">
                  {customer.plan}
                </Chip>
                <Chip color={CUSTOMER_STATUS_COLOR[customer.status]} size="sm" variant="soft">
                  {customer.status}
                </Chip>
                <div className="flex items-center gap-1.5">
                  <NumberValue
                    className="text-foreground text-sm font-medium tabular-nums"
                    currency="USD"
                    maximumFractionDigits={0}
                    style="currency"
                    value={customer.mrr}
                  />
                  <TrendChip
                    className="bg-transparent"
                    trend={customer.health >= 80 ? "up" : "neutral"}
                  >
                    {customer.health >= 80 ? "+" : ""}
                    {(customer.health - 80).toFixed(0)}%
                  </TrendChip>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    aria-label={`Health for ${customer.name}`}
                    className="flex-1"
                    color={
                      customer.health >= 80
                        ? "success"
                        : customer.health >= 65
                          ? "warning"
                          : "danger"
                    }
                    size="sm"
                    value={customer.health}
                  >
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  <span className="text-muted w-7 text-right text-xs tabular-nums">
                    {customer.health}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
