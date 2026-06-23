"use client";

import type {BrandVoice} from "../../server/db/schemas/branding";
import type {SocialPostAgency, SocialStatus} from "../../server/db/schemas/social-posts";
import type {UseKanbanReturn} from "@heroui-pro/react";
import type {ComponentType} from "react";

import {
  Calendar,
  CircleCheck,
  CircleDashed,
  Display,
  Heart,
  Megaphone,
  Plus,
  Star,
  Stopwatch,
  ThumbsUp,
} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, Label, Switch, useOverlayState} from "@heroui/react";
import {Kanban, NumberValue, useKanban, useKanbanColumn} from "@heroui-pro/react";
import {RouteButton} from "../../components/route-button";
import {useMemo, useState} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {SOCIAL_STATUS_COLOR} from "../../server/db/schemas/social-posts";
import {SocialComposer} from "../../widgets/white-label/social-composer";
import {SocialPostHistory} from "../../widgets/white-label/social-post-history";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/page-toolbar";

const COLUMN_ORDER: readonly SocialStatus[] = [
  "Draft",
  "Awaiting Approval",
  "Scheduled",
  "Published",
];

const COLUMN_META: Record<
  SocialStatus,
  {indicator: string; icon: ComponentType<{className?: string}>}
> = {
  "Awaiting Approval": {icon: ThumbsUp, indicator: "bg-warning"},
  Draft: {icon: CircleDashed, indicator: "bg-default"},
  Failed: {icon: CircleDashed, indicator: "bg-danger"},
  Published: {icon: CircleCheck, indicator: "bg-success"},
  Scheduled: {icon: Calendar, indicator: "bg-accent"},
};

type Post = SocialPostAgency;

function getColumn(post: Post): string {
  return post.status;
}

function setColumn(post: Post, column: string): Post {
  return {...post, status: column as SocialStatus};
}

export interface WhiteLabelSocialPageProps {
  posts: SocialPostAgency[];
  voices: BrandVoice[];
}

export function WhiteLabelSocialPage({posts, voices}: WhiteLabelSocialPageProps) {
  const composeState = useOverlayState();
  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({
    Facebook: true,
    Google: true,
    Instagram: true,
    LinkedIn: true,
    TikTok: true,
    X: false,
  });
  const kanban = useKanban<Post>({
    getColumn,
    initialItems: posts,
    setColumn,
  });

  const counts = useMemo(() => {
    const base: Record<SocialStatus, number> = {
      "Awaiting Approval": 0,
      Draft: 0,
      Failed: 0,
      Published: 0,
      Scheduled: 0,
    };

    for (const item of kanban.list.items) base[item.status] += 1;

    return base;
  }, [kanban.list.items]);

  const isEmpty = posts.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Generate, approve, and schedule posts across every channel — with brand voice baked in."
        showPeriod={false}
        title="Social Engine"
        trailing={
          <>
            <RouteButton href="/white-label/analytics" size="sm" variant="tertiary">
              <Display className="size-4" />
              Calendar
            </RouteButton>
            <SocialComposer
              state={composeState}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  Generate post
                </Button>
              }
            />
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          body="Drafted, scheduled, and published posts across all customers land here."
          cta={{label: "Compose post", onPress: composeState.open}}
          icon={Megaphone}
          title="Nothing scheduled yet"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Drafts" value={counts.Draft} />
            <SummaryStat
              color="text-warning"
              label="Awaiting approval"
              value={counts["Awaiting Approval"]}
            />
            <SummaryStat color="text-accent" label="Scheduled" value={counts.Scheduled} />
            <SummaryStat
              color="text-success"
              label="Published this week"
              value={counts.Published}
            />
          </div>

          <Kanban>
            {COLUMN_ORDER.map((column) => (
              <SocialColumn key={column} column={column} kanban={kanban} />
            ))}
          </Kanban>
        </>
      )}

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">Brand voice library</Card.Title>
            <Card.Description>How each customer should sound across channels.</Card.Description>
          </div>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => notifyInfo("Brand voice editor opens from customer onboarding")}
          >
            <Star className="size-4" />
            Manage voices
          </Button>
        </Card.Header>
        <Card.Content className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {voices.length === 0 ? (
            <p className="text-muted col-span-full py-6 text-center text-sm">
              No brand voices defined yet. Each customer gets a voice during onboarding.
            </p>
          ) : (
            voices.map((voice) => (
              <div
                key={voice.id}
                className="border-border bg-content1 flex flex-col gap-2 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-semibold">{voice.customer}</span>
                  <Chip color="accent" size="sm" variant="soft">
                    Brand
                  </Chip>
                </div>
                <span className="text-muted text-xs">
                  Tone · <span className="text-foreground">{voice.tone}</span>
                </span>
                <span className="text-muted text-xs">
                  Personality · <span className="text-foreground">{voice.personality}</span>
                </span>
                <div className="text-muted flex items-center justify-between pt-1 text-xs">
                  <span>Emoji {voice.emoji ? "✓" : "—"}</span>
                  <span>{voice.hashtags} hashtags / post</span>
                </div>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Channel publishing</Card.Title>
          <Card.Description>Enable or pause platforms agency-wide.</Card.Description>
        </Card.Header>
        <Card.Content className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["Instagram", "Facebook", "TikTok", "LinkedIn", "X", "Google"] as const).map(
            (platform) => (
              <div
                key={platform}
                className="border-border bg-content1 flex items-center justify-between rounded-xl border p-3"
              >
                <span className="text-foreground text-sm font-medium">{platform}</span>
                <Switch
                  aria-label={`${platform} publishing`}
                  isSelected={channelEnabled[platform] ?? false}
                  onChange={(selected) => {
                    setChannelEnabled((prev) => ({...prev, [platform]: selected}));
                    notifySuccess(
                      selected ? `${platform} publishing enabled` : `${platform} publishing paused`,
                    );
                  }}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Content>
                    <Label className="sr-only">{platform} publishing</Label>
                  </Switch.Content>
                </Switch>
              </div>
            ),
          )}
        </Card.Content>
      </Card>
      
      <SocialPostHistory posts={posts} />
      
      <SocialComposer state={composeState} />
    </div>
  );
}

function SummaryStat({color, label, value}: {color?: string; label: string; value: number}) {
  return (
    <Card className="rounded-2xl">
      <Card.Content className="flex flex-col gap-1 py-4">
        <span className="text-muted text-xs">{label}</span>
        <NumberValue
          className={`text-2xl font-semibold tabular-nums ${color ?? "text-foreground"}`}
          maximumFractionDigits={0}
          value={value}
        />
      </Card.Content>
    </Card>
  );
}

interface SocialColumnProps {
  column: SocialStatus;
  kanban: UseKanbanReturn<Post>;
}

function SocialColumn({column, kanban}: SocialColumnProps) {
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, column);
  const meta = COLUMN_META[column];

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator className={meta.indicator} />
        <Kanban.ColumnTitle>{column}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.CardList
          aria-label={column}
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => (
            <span className="text-muted px-3 py-4 text-xs">No posts here</span>
          )}
        >
          {(post) => (
            <Kanban.Card textValue={post.caption}>
              <PostCard post={post} />
            </Kanban.Card>
          )}
        </Kanban.CardList>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

function PostCard({post}: {post: Post}) {
  return (
    <div
      className="flex cursor-pointer flex-col gap-2 p-3"
      role="button"
      tabIndex={0}
      onClick={() => notifyInfo(`Opened ${post.platform} post for ${post.customer}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          notifyInfo(`Opened ${post.platform} post for ${post.customer}`);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <Chip size="sm" variant="soft">
          {post.platform}
        </Chip>
        <Chip color={SOCIAL_STATUS_COLOR[post.status]} size="sm" variant="soft">
          {post.status}
        </Chip>
      </div>
      <p className="text-foreground text-sm leading-snug">{post.caption}</p>
      <div className="flex items-center gap-2">
        <Avatar className="size-5">
          <Avatar.Image alt={post.customer} src={post.customerAvatar} />
          <Avatar.Fallback>
            {post.customer
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </Avatar.Fallback>
        </Avatar>
        <span className="text-muted truncate text-xs">{post.customer}</span>
      </div>
      <div className="text-muted flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1">
          <Stopwatch className="size-3" />
          {new Date(post.scheduledFor).toLocaleString("en-US", {
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            month: "short",
          })}
        </span>
        {post.status === "Published" ? (
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3" />
            {post.engagement}
          </span>
        ) : null}
      </div>
    </div>
  );
}
