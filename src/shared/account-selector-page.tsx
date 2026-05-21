"use client";

import {Briefcase, Handset, Person} from "@gravity-ui/icons";
import {Button, Card, Chip} from "@heroui/react";
import {useRouter} from "next/navigation";

const ACCOUNT_TYPES = [
  {
    badge: "Agency / Reseller",
    description:
      "Operate your own branded version of the platform. Manage customers, automate fulfillment, monitor growth.",
    features: [
      "Customer & subaccount management",
      "AI website generator + SEO/XEO engine",
      "White-label branding & reseller margins",
      "Automation center & team management",
    ],
    href: "/white-label",
    icon: Briefcase,
    label: "White-Label",
  },
  {
    badge: "Sell & Earn",
    description:
      "Sell the StatXEO platform and track commissions. Get marketing assets, training, and payouts.",
    features: [
      "Tracking links, QR codes & widgets",
      "Lead pipeline & commission tracking",
      "Marketing assets & sales training",
      "Meeting booking & payout management",
    ],
    href: "/affiliate",
    icon: Handset,
    label: "Affiliate",
  },
  {
    badge: "Grow Your Business",
    description:
      "Use AI to grow your online presence. Websites, SEO, social, reviews, calls and more — automated.",
    features: [
      "Website editor + AI page generation",
      "SEO scoring & keyword tracking",
      "Social calendar + AI content",
      "Reviews, calling & AI Assistant",
    ],
    href: "/customer",
    icon: Person,
    label: "Customer",
  },
] as const;

type AccountSelectorPageProps = {
  embedded?: boolean;
};

export function AccountSelectorPage({embedded = false}: AccountSelectorPageProps) {
  const router = useRouter();

  return (
    <div className={embedded ? "bg-white dark:bg-neutral-950" : "bg-background min-h-screen"}>
      <div
        className={`mx-auto flex max-w-6xl flex-col gap-10 px-6 ${embedded ? "py-12" : "py-16"}`}
      >
        <header className="flex flex-col items-center gap-3 text-center">
          {!embedded ? (
            <Chip color="accent" size="sm" variant="soft">
              StatXEO Platform
            </Chip>
          ) : null}
          {embedded ? (
            <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose your path to <span className="text-orange-600 dark:text-orange-400">growth</span>
            </h2>
          ) : (
            <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
              AI-powered SEO & marketing,{" "}
              <span className="text-accent">on autopilot.</span>
            </h1>
          )}
          <p className="text-muted max-w-2xl text-base sm:text-lg">
            {embedded
              ? "Whether you run a local business, sell the platform, or operate as an agency — StatXEO has a workspace for you."
              : "StatXEO builds, manages, and grows your online presence using AI. Pick the account type you want to explore."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ACCOUNT_TYPES.map((account) => {
            const Icon = account.icon;

            return (
              <Card key={account.href} className="rounded-2xl">
                <Card.Header className="flex-col items-start gap-3">
                  <div className="bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Chip size="sm" variant="soft">
                      {account.badge}
                    </Chip>
                    <Card.Title className="text-xl">{account.label}</Card.Title>
                  </div>
                </Card.Header>
                <Card.Content className="flex flex-col gap-4">
                  <p className="text-muted text-sm">{account.description}</p>
                  <ul className="flex flex-col gap-2">
                    {account.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-foreground flex items-start gap-2 text-sm"
                      >
                        <span className="bg-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card.Content>
                <Card.Footer>
                  <Button
                    className="w-full"
                    onPress={() => router.push(account.href)}
                  >
                    Open {account.label}
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>

        {!embedded ? (
          <footer className="text-muted text-center text-xs">
            StatXEO · Build websites, rank on Google, post on social, automate growth.
          </footer>
        ) : null}
      </div>
    </div>
  );
}
