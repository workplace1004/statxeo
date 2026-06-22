"use client";

import type {Competitor} from "../../server/db/schemas/competitors";
import type {CustomerKeyword} from "../../server/db/schemas/customer-keywords";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowDown, ArrowUp, ChartLine, Magnifier, Plus, Sparkles, Target} from "@gravity-ui/icons";
import {Button, Card, Chip, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid, KPI, LineChart, NumberValue, TrendChip} from "@heroui-pro/react";
import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";

import {TrackKeywordModal} from "../../widgets/customer/modals/track-keyword-modal";
import {AutomationBanner} from "../../widgets/customer/automation-banner";
import {EmptyState} from "../../widgets/empty-state";
import {SeoWorkflowWizard} from "../../widgets/customer/seo-workflow-wizard";

export interface RankingPoint {
  week: string;
  average: number;
}

export interface SeoScore {
  label: string;
  description: string;
  value: number | null;
}

export interface CustomerSeoPageProps {
  keywords: CustomerKeyword[];
  competitors: Competitor[];
  rankingHistory: RankingPoint[];
  scores: SeoScore[];
  avgRank: number | null;
  activeWorkflow: any;
  clientOrgId: string;
}

function ChangeBadge({change}: {change: number}) {
  if (change === 0) return <span className="text-muted text-xs">–</span>;
  const isUp = change > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
        isUp ? "text-success" : "text-danger"
      }`}
    >
      {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(change)}
    </span>
  );
}

function ScoreGauge({score}: {score: number | null}) {
  const safeScore = score ?? 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  const color =
    safeScore >= 80
      ? "var(--color-success)"
      : safeScore >= 60
        ? "var(--color-warning)"
        : "var(--color-danger)";

  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg className="-rotate-90" height="80" width="80">
        <circle
          cx="40"
          cy="40"
          fill="none"
          r={radius}
          stroke="var(--color-content2)"
          strokeWidth="6"
        />
        {score !== null ? (
          <circle
            cx="40"
            cy="40"
            fill="none"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="6"
          />
        ) : null}
      </svg>
      <span className="text-foreground absolute text-base font-semibold tabular-nums">
        {score === null ? "—" : score}
      </span>
    </div>
  );
}

export function CustomerSeoPage({
  avgRank,
  competitors,
  keywords,
  rankingHistory,
  scores,
  activeWorkflow,
  clientOrgId,
}: CustomerSeoPageProps) {
  const router = useRouter();
  const trackState = useOverlayState();
  const [search, setSearch] = useState("");

  const filteredKeywords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return keywords;

    return keywords.filter(
      (k) =>
        k.keyword.toLowerCase().includes(q) ||
        k.url.toLowerCase().includes(q) ||
        k.intent.toLowerCase().includes(q),
    );
  }, [keywords, search]);

  const columns = useMemo<DataGridColumn<CustomerKeyword>[]>(
    () => [
      {
        accessorKey: "keyword",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{item.keyword}</span>
            <span className="text-muted truncate text-xs">{item.url}</span>
          </div>
        ),
        header: "Keyword",
        id: "keyword",
        isRowHeader: true,
        minWidth: 260,
      },
      {
        accessorKey: "intent",
        cell: (item) => (
          <Chip size="sm" variant="soft">
            {item.intent}
          </Chip>
        ),
        header: "Intent",
        id: "intent",
        minWidth: 110,
      },
      {
        accessorKey: "position",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-foreground text-sm font-semibold tabular-nums">
            #{item.position}
          </span>
        ),
        header: "Pos.",
        id: "position",
        minWidth: 70,
      },
      {
        accessorKey: "change",
        cell: (item) => <ChangeBadge change={item.change} />,
        header: "Change",
        id: "change",
        minWidth: 90,
      },
      {
        accessorKey: "searchVolume",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="text-muted tabular-nums"
            maximumFractionDigits={0}
            value={item.searchVolume}
          />
        ),
        header: "Volume",
        id: "searchVolume",
        minWidth: 100,
      },
      {
        accessorKey: "difficulty",
        cell: (item) => (
          <div className="flex items-center gap-2">
            <div className="bg-content2 h-1.5 w-16 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor:
                    item.difficulty < 40
                      ? "var(--color-success)"
                      : item.difficulty < 60
                        ? "var(--color-warning)"
                        : "var(--color-danger)",
                  width: `${item.difficulty}%`,
                }}
              />
            </div>
            <span className="text-muted text-xs tabular-nums">{item.difficulty}</span>
          </div>
        ),
        header: "Difficulty",
        id: "difficulty",
        minWidth: 140,
      },
    ],
    [],
  );

  const topThreeCount = keywords.filter((k) => k.position > 0 && k.position <= 3).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <AutomationBanner message="AI is monitoring your keywords — rankings update daily" />
      <SeoWorkflowWizard
        activeWorkflow={activeWorkflow}
        clientOrgId={clientOrgId}
        onRefresh={() => router.refresh()}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Track your search visibility, beat the competition, and find new keywords to win.
        </p>
        <TrackKeywordModal
          state={trackState}
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Track keyword
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map((score) => (
          <Card key={score.label} className="rounded-2xl">
            <Card.Content className="flex items-center gap-4 py-4">
              <ScoreGauge score={score.value} />
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground text-sm font-semibold">{score.label}</span>
                <span className="text-muted text-xs">{score.description}</span>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-start justify-between">
          <div className="flex flex-col gap-1">
            <Card.Title className="text-base">Average ranking over time</Card.Title>
            <div className="flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-semibold tabular-nums">
                {avgRank === null ? "—" : `#${avgRank}`}
              </span>
              {rankingHistory.length > 0 ? <TrendChip trend="neutral">10 weeks</TrendChip> : null}
            </div>
            <span className="text-muted text-xs">Lower is better</span>
          </div>
          <KPI>
            <KPI.Header>
              <KPI.Title>Top-3 keywords</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <KPI.Value value={topThreeCount} />
            </KPI.Content>
          </KPI>
        </Card.Header>
        <Card.Content>
          {rankingHistory.length === 0 ? (
            <EmptyState
              body="Once we've tracked your keywords for a few weeks, the ranking trend will appear here."
              icon={ChartLine}
              title="No ranking history yet"
            />
          ) : (
            <LineChart
              data={rankingHistory as unknown as Array<Record<string, string | number>>}
              height={220}
            >
              <LineChart.Grid vertical={false} />
              <LineChart.XAxis dataKey="week" tickMargin={8} />
              <LineChart.YAxis reversed width={30} />
              <LineChart.Line
                dataKey="average"
                dot={false}
                name="Avg position"
                stroke="var(--color-accent)"
                strokeWidth={2}
                type="monotone"
              />
              <LineChart.Tooltip content={<LineChart.TooltipContent />} />
            </LineChart>
          )}
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">Keyword tracker</Card.Title>
            <Card.Description>
              {keywords.length} keywords tracked across your service areas.
            </Card.Description>
          </div>
          <SearchField
            aria-label="Search keywords"
            className="w-[240px]"
            name="keyword-search"
            value={search}
            variant="secondary"
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search keywords..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Card.Header>
        <Card.Content>
          {keywords.length === 0 ? (
            <div className="from-accent/8 flex flex-col items-center gap-4 rounded-xl bg-gradient-to-br to-transparent p-6 text-center">
              <div className="bg-accent/10 text-accent flex size-12 items-center justify-center rounded-2xl">
                <Sparkles className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-foreground text-base font-semibold">
                  AI Keyword Discovery
                </span>
                <span className="text-muted max-w-xs text-sm">
                  Let the AI analyze your business and suggest high-value keywords to target.
                </span>
              </div>
              <TrackKeywordModal
                state={trackState}
                trigger={
                  <Button size="sm">
                    <Sparkles className="size-4" />
                    Set up keyword automation
                  </Button>
                }
              />
            </div>
          ) : filteredKeywords.length === 0 ? (
            <p className="text-muted py-10 text-center text-sm">No keywords match your search.</p>
          ) : (
            <DataGrid
              aria-label="Keyword tracker"
              columns={columns}
              contentClassName="min-w-[820px]"
              data={filteredKeywords}
              getRowId={(item) => item.id}
            />
          )}
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {competitors.length === 0 ? (
          <div className="lg:col-span-3">
            <EmptyState
              body="Add up to 5 local competitors to compare visibility against."
              icon={Magnifier}
              title="No competitors yet"
            />
          </div>
        ) : (
          competitors.map((comp) => (
            <Card key={comp.id} className="rounded-2xl">
              <Card.Header>
                <div className="flex items-center justify-between gap-2">
                  <Card.Title className="text-sm">{comp.name}</Card.Title>
                  <TrendChip trend={comp.trend}>{comp.trendValue}</TrendChip>
                </div>
                <Card.Description className="text-xs">{comp.domain}</Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col">
                    <span className="text-foreground text-base font-semibold tabular-nums">
                      {comp.visibility}%
                    </span>
                    <span className="text-muted text-xs">Visibility</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-base font-semibold tabular-nums">
                      {comp.keywords}
                    </span>
                    <span className="text-muted text-xs">Keywords</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground text-base font-semibold tabular-nums">
                      {comp.domainRating}
                    </span>
                    <span className="text-muted text-xs">DR</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted text-xs">Keyword overlap</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="bg-content2 h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-accent h-full rounded-full"
                        style={{width: `${comp.overlap}%`}}
                      />
                    </div>
                    <span className="text-foreground text-xs font-medium tabular-nums">
                      {comp.overlap}%
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))
        )}
      </div>

      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Keyword gaps</Card.Title>
          <Card.Description>
            Where competitors are out-ranking you — opportunities AI can target this quarter.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <EmptyState
            body="Add competitors and tracked keywords — we'll surface opportunity gaps here."
            icon={Target}
            title="No keyword gaps yet"
          />
        </Card.Content>
      </Card>
      <TrackKeywordModal state={trackState} />
    </div>
  );
}
