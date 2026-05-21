"use client";

import {Bell, Comment, Envelope, Rocket, Sparkles} from "@gravity-ui/icons";
import {Button, Card, Chip} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";

const CAPABILITIES_SMS = [
  "Two-way messaging with AI-suggested replies",
  "Bulk SMS campaigns with smart sending windows",
  "Drip sequences for new leads and quote follow-ups",
  "Booking links and quick replies in every message",
];

const CAPABILITIES_EMAIL = [
  "AI-drafted newsletters in your tone of voice",
  "Customer segments (new leads, maintenance plans, etc.)",
  "Automated re-engagement and seasonal promos",
  "Deliverability monitoring + spam-safe sending",
];

export function CustomerCampaignsPage() {
  const [notified, setNotified] = useState(false);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-10 pt-4">
      <Card className="rounded-2xl">
        <div className="from-accent/15 via-background to-background absolute inset-0 rounded-2xl bg-gradient-to-br" />
        <Card.Content className="relative flex flex-col items-center gap-5 px-8 py-12 text-center">
          <div className="bg-accent/10 text-accent flex size-14 items-center justify-center rounded-2xl">
            <Rocket className="size-7" />
          </div>
          <div className="flex flex-col gap-2">
            <Chip color="accent" size="sm" variant="soft">
              <Sparkles className="size-3" />
              Coming Q3 2026
            </Chip>
            <h1 className="text-foreground max-w-2xl text-3xl font-semibold leading-tight">
              SMS & email campaigns are coming to StatXEO
            </h1>
            <p className="text-muted max-w-xl text-sm leading-relaxed">
              We're integrating <span className="text-foreground font-medium">STATXT</span> for
              two-way SMS and <span className="text-foreground font-medium">STATXE</span> for
              drag-and-drop email — both powered by your AI assistant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              isDisabled={notified}
              size="md"
              onPress={() => {
                setNotified(true);
                notifySuccess("You're on the list — we'll email you when campaigns launch");
              }}
            >
              <Bell className="size-4" />
              {notified ? "We'll let you know" : "Notify me when it's ready"}
            </Button>
            <Button
              size="md"
              variant="tertiary"
              onPress={() =>
                window.open("https://statxeo.com/roadmap", "_blank", "noopener,noreferrer")
              }
            >
              Read the roadmap
            </Button>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Comment className="size-5" />
              </div>
              <div className="flex flex-col">
                <Card.Title className="text-base">STATXT · SMS</Card.Title>
                <Card.Description>
                  Conversational text messaging with built-in AI replies.
                </Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="flex flex-col gap-2.5">
            {CAPABILITIES_SMS.map((cap) => (
              <div key={cap} className="flex items-start gap-2.5">
                <span className="text-success mt-1 size-1.5 rounded-full bg-current" />
                <span className="text-foreground text-sm leading-relaxed">{cap}</span>
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <Envelope className="size-5" />
              </div>
              <div className="flex flex-col">
                <Card.Title className="text-base">STATXE · Email</Card.Title>
                <Card.Description>
                  Beautiful, AI-drafted email campaigns that convert.
                </Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="flex flex-col gap-2.5">
            {CAPABILITIES_EMAIL.map((cap) => (
              <div key={cap} className="flex items-start gap-2.5">
                <span className="text-success mt-1 size-1.5 rounded-full bg-current" />
                <span className="text-foreground text-sm leading-relaxed">{cap}</span>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Card.Content className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold">
              Want early beta access?
            </span>
            <span className="text-muted text-sm">
              We're rolling out STATXT and STATXE to a handful of partners first.
            </span>
          </div>
          <Button
            size="sm"
            onPress={() => notifySuccess("Beta access request received — we'll be in touch")}
          >
            Request beta access
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
