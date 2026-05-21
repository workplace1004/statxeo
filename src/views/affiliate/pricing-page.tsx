"use client";

import type {PlanTier} from "../../server/db/schemas/plans";

import {Calendar, Check, Gift, Sparkles, Xmark} from "@gravity-ui/icons";
import {Button, Card, Chip, Tabs} from "@heroui/react";
import {NumberValue} from "@heroui-pro/react";
import {useState} from "react";

import {
  PricingCardGlow,
  PricingCardSurface,
} from "@/components/pricing/pricing-card-glow";

import {ShareLinkModal} from "../../widgets/affiliate/modals/share-link-modal";
import {EmptyState} from "../../widgets/empty-state";

type Billing = "monthly" | "annual";

export interface PlanFeatureRow {
  label: string;
  starter: boolean | string;
  growth: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

export interface PlanPromotion {
  id: string;
  title: string;
  description: string;
  endsOn: string;
  discount: string;
  audience: string;
}

export interface AffiliatePricingPageProps {
  plans: PlanTier[];
  features: PlanFeatureRow[];
  promotions: PlanPromotion[];
}

export function AffiliatePricingPage({
  features,
  plans,
  promotions,
}: AffiliatePricingPageProps) {
  const [billing, setBilling] = useState<Billing>("annual");
  const isEmpty = plans.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">
          Plans, features, and current promotions you can use to close more deals.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          selectedKey={billing}
          onSelectionChange={(key) => setBilling(key as Billing)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Billing period">
              <Tabs.Tab id="monthly">
                Monthly
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="annual">
                Annual
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
        {billing === "annual" ? (
          <Chip color="success" size="md" variant="soft">
            <Sparkles className="size-3.5" />
            Save 20% on annual
          </Chip>
        ) : null}
      </div>

      {isEmpty ? (
        <EmptyState
          body="Once the platform's plans are published, they'll appear here for you to share."
          title="No plans configured"
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 px-1 md:grid-cols-2 md:gap-12 md:px-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} billing={billing} plan={plan} />
          ))}
        </div>
      )}

      {features.length > 0 ? (
        <Card className="overflow-hidden rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">Feature comparison</Card.Title>
            <Card.Description>What&apos;s included in each plan.</Card.Description>
          </Card.Header>
          <Card.Content className="px-0">
            <FeatureTable features={features} />
          </Card.Content>
        </Card>
      ) : null}

      {promotions.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {promotions.map((promo) => (
            <Card key={promo.id} className="rounded-2xl">
              <Card.Header className="flex-row items-start gap-3">
                <div className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Gift className="size-5" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Card.Title className="text-base">{promo.title}</Card.Title>
                    <Chip color="success" size="sm" variant="soft">
                      {promo.discount}
                    </Chip>
                  </div>
                  <Card.Description>{promo.description}</Card.Description>
                </div>
              </Card.Header>
              <Card.Footer className="flex-row items-center justify-between">
                <span className="text-muted inline-flex items-center gap-1.5 text-xs">
                  <Calendar className="size-3.5" />
                  Ends {promo.endsOn} · {promo.audience}
                </span>
                <ShareLinkModal
                  description={`Share this promotion with prospects — ${promo.discount} through ${promo.endsOn}.`}
                  title={promo.title}
                  url={`https://statxeo.com/promo/${promo.id}`}
                  trigger={
                    <Button size="sm" variant="secondary">
                      Get share link
                    </Button>
                  }
                />
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlanCard({billing, plan}: {billing: Billing; plan: PlanTier}) {
  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const isCustom = price === 0;

  return (
    <PricingCardGlow
      variant={plan.highlight ? "featured" : "default"}
      animated={plan.highlight}
      className="h-full"
    >
      <PricingCardSurface className="gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-base font-semibold">{plan.name}</h3>
            {plan.highlight ? (
              <Chip color="accent" size="sm" variant="soft">
                Most popular
              </Chip>
            ) : null}
          </div>
          <p className="text-muted text-sm">{plan.tagline}</p>
          <div className="flex items-baseline gap-1.5 pt-1">
            {isCustom ? (
              <span className="text-foreground text-3xl font-semibold">Custom</span>
            ) : (
              <>
                <NumberValue
                  className="text-foreground text-3xl font-semibold tabular-nums"
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={price}
                />
                <span className="text-muted text-sm">/ mo</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Chip color="success" size="sm" variant="soft">
              {plan.commissionPercent}% commission
            </Chip>
            {billing === "annual" && !isCustom ? (
              <Chip color="default" size="sm" variant="soft">
                Billed yearly
              </Chip>
            ) : null}
          </div>
        </div>
        <ul className="flex flex-1 flex-col gap-2">
          {plan.highlights.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <Check className="text-success mt-0.5 size-4 shrink-0" />
              <span className="text-foreground text-sm">{feat}</span>
            </li>
          ))}
        </ul>
        <ShareLinkModal
          description={`Share the ${plan.name} plan with your referral tracking applied.`}
          title={plan.ctaLabel}
          url={`https://statxeo.com/pricing/${plan.id}?ref=partner`}
          trigger={
            plan.highlight ? (
              <Button className="w-full" size="md">
                {plan.ctaLabel}
              </Button>
            ) : (
              <Button className="w-full" size="md" variant="secondary">
                {plan.ctaLabel}
              </Button>
            )
          }
        />
      </PricingCardSurface>
    </PricingCardGlow>
  );
}

function FeatureTable({features}: {features: PlanFeatureRow[]}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-content2 border-b text-left">
            <th className="text-muted px-5 py-3 text-xs font-medium">Feature</th>
            <th className="text-muted px-3 py-3 text-xs font-medium">Starter</th>
            <th className="text-muted px-3 py-3 text-xs font-medium">Growth</th>
            <th className="text-muted px-3 py-3 text-xs font-medium">Pro</th>
            <th className="text-muted px-3 py-3 text-xs font-medium">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feat, idx) => (
            <tr
              key={feat.label}
              className={
                idx % 2 === 0
                  ? "bg-content1 border-content2 border-b"
                  : "bg-content2/30 border-content2 border-b"
              }
            >
              <td className="text-foreground px-5 py-3 font-medium">{feat.label}</td>
              <FeatureCell value={feat.starter} />
              <FeatureCell value={feat.growth} />
              <FeatureCell value={feat.pro} />
              <FeatureCell value={feat.enterprise} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureCell({value}: {value: boolean | string}) {
  if (typeof value === "boolean") {
    return (
      <td className="px-3 py-3">
        {value ? (
          <Check className="text-success size-4" />
        ) : (
          <Xmark className="text-muted size-4" />
        )}
      </td>
    );
  }

  return <td className="text-foreground px-3 py-3 tabular-nums">{value}</td>;
}
