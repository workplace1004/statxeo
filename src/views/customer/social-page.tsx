"use client";

import type {SocialPlatform, SocialPostCustomer} from "../../server/db/schemas/social-posts";

import {Calendar, ChartLine, Megaphone, Plus, Sparkles} from "@gravity-ui/icons";
import {Button, Card, Chip, useOverlayState} from "@heroui/react";
import {KPI, KPIGroup} from "@heroui-pro/react";
import {useState} from "react";

import {notifyInfo} from "../../lib/ui/white-label-notify";
import {SOCIAL_STATUS_COLOR} from "../../server/db/schemas/social-posts";
import {AutomationBanner} from "../../widgets/customer/automation-banner";
import {
  GeneratePostModal,
  NewPostButton,
} from "../../widgets/customer/modals/generate-post-modal";
import {PageToolbar} from "../../widgets/page-toolbar";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerSocialPageProps {
  posts: SocialPostCustomer[];
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLATFORM_DOT: Record<SocialPlatform, string> = {
  Facebook: "var(--chart-2)",
  Google: "var(--color-warning)",
  Instagram: "var(--chart-3)",
  LinkedIn: "var(--chart-4)",
  TikTok: "var(--color-foreground)",
  X: "var(--color-foreground)",
  YouTube: "var(--color-danger)",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function dayOfWeek(iso: string): number {
  const day = new Date(iso).getDay();

  return day === 0 ? 6 : day - 1;
}

export function CustomerSocialPage({posts}: CustomerSocialPageProps) {
  const composeState = useOverlayState();
  const [isCalendarView, setIsCalendarView] = useState(false);
  const published = posts.filter((p) => p.status === "Published");
  const scheduled = posts.filter((p) => p.status === "Scheduled");
  const totalImpressions = published.reduce((s, p) => s + p.engagement.impressions, 0);
  const totalEngagement = published.reduce(
    (s, p) => s + p.engagement.likes + p.engagement.comments + p.engagement.shares,
    0,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <AutomationBanner message="AI generates and schedules posts automatically" />
      <PageToolbar
        title="Social Media"
        description="Plan, schedule, and analyze your social posts across Facebook, Instagram, and Google Business."
        showPeriod={false}
        trailing={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isCalendarView ? "secondary" : "tertiary"}
              onPress={() => setIsCalendarView((v) => !v)}
            >
              <Calendar className="size-4" />
              {isCalendarView ? "List view" : "Calendar view"}
            </Button>
            <GeneratePostModal
              state={composeState}
              trigger={
                <Button size="sm">
                  <Sparkles className="size-4" />
                  Generate posts
                </Button>
              }
            />
          </div>
        }
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Published this month</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={published.length} />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Total impressions</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {totalImpressions === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={totalImpressions} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Engagement</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {totalEngagement === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={totalEngagement} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Scheduled</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={scheduled.length} />
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">This week's content calendar</Card.Title>
            <Card.Description>Scheduled and AI-drafted posts across all platforms.</Card.Description>
          </div>
          <NewPostButton />
        </Card.Header>
        <Card.Content>
          {isCalendarView ? (
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day, idx) => {
                const dayPosts = posts.filter((p) => dayOfWeek(p.scheduledFor) === idx);

                return (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="text-muted text-center text-xs font-medium">{day}</div>
                    <div className="bg-content2/40 flex min-h-[180px] flex-col gap-1.5 rounded-xl p-2">
                      {dayPosts.length === 0 ? (
                        <span className="text-muted/60 text-xs">—</span>
                      ) : (
                        dayPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-background flex flex-col gap-1 rounded-lg p-2 shadow-sm"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2 rounded-full"
                                style={{backgroundColor: PLATFORM_DOT[post.platform]}}
                              />
                              <span className="text-muted truncate text-xs">{post.platform}</span>
                            </div>
                            <span className="text-foreground line-clamp-2 text-xs leading-tight">
                              {post.title}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {posts.length === 0 ? (
                <EmptyState
                  body="Drafted, scheduled, and published social posts appear here."
                  cta={{label: "Compose post", onPress: composeState.open}}
                  icon={Megaphone}
                  title="No social posts yet"
                />
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="hover:bg-content2 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground text-sm font-medium">{post.title}</span>
                        <Chip color={SOCIAL_STATUS_COLOR[post.status]} size="sm" variant="soft">
                          {post.status}
                        </Chip>
                        {post.aiGenerated ? (
                          <Chip color="accent" size="sm" variant="soft">
                            <Sparkles className="size-3" />
                            AI
                          </Chip>
                        ) : null}
                      </div>
                      <span className="text-muted line-clamp-1 text-xs">{post.body}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{backgroundColor: PLATFORM_DOT[post.platform]}}
                        />
                        <span className="text-muted text-xs">{post.platform}</span>
                      </div>
                      <span className="text-muted w-32 text-right text-xs tabular-nums">
                        {formatTime(post.scheduledFor)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card.Content>
      </Card>
      <GeneratePostModal state={composeState} />
    </div>
  );
}
