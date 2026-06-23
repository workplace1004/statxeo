"use client";

import type {Keyword} from "../../server/db/schemas/keywords";
import type {Competitor} from "../../server/db/schemas/competitors";
import type {DataGridColumn} from "@heroui-pro/react";

import {
  ArrowDown,
  ArrowUp,
  ArrowsRotateRight,
  Magnifier,
  MapPin,
  Plus,
  TrashBin,
} from "@gravity-ui/icons";
import {Button, Card, Chip, SearchField, Tabs, useOverlayState} from "@heroui/react";
import {DataGrid, NumberValue} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {IconButton} from "../../components/icon-button";
import {EmptyState} from "../../widgets/empty-state";
import {TrackKeywordModal} from "../../widgets/white-label/modals/track-keyword-modal";
import {AddCompetitorModal} from "../../widgets/white-label/modals/add-competitor-modal";
import {PageToolbar} from "../../widgets/page-toolbar";

function intentColor(intent: Keyword["intent"]): "success" | "warning" | "default" | "accent" {
  switch (intent) {
    case "Transactional":
      return "success";
    case "Local":
      return "accent";
    case "Informational":
      return "default";
    default:
      return "warning";
  }
}

export interface WhiteLabelSeoPageProps {
  keywords: Keyword[];
  competitors: Competitor[];
}

export function WhiteLabelSeoPage({keywords, competitors}: WhiteLabelSeoPageProps) {
  const trackState = useOverlayState();
  const competitorModalState = useOverlayState();
  const [activeTab, setActiveTab] = useState<string>("keywords");

  // Keyword tab states
  const [keywordSearch, setKeywordSearch] = useState("");
  const [recrawling, setRecrawling] = useState(false);

  // Competitor tab states
  const [competitorSearch, setCompetitorSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRemoveCompetitor = async (competitorId: string, domain: string) => {
    if (!confirm(`Are you sure you want to stop tracking ${domain}?`)) return;
    setDeletingId(competitorId);
    try {
      const res = await fetch(`/api/white-label/seo/competitors?competitorId=${competitorId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Removed ${domain} from competitor tracking`);
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to remove competitor");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while removing competitor");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredKeywords = useMemo(() => {
    if (!keywordSearch.trim()) return keywords;
    const q = keywordSearch.toLowerCase();

    return keywords.filter(
      (k) =>
        k.term.toLowerCase().includes(q) ||
        k.customer.toLowerCase().includes(q) ||
        k.city.toLowerCase().includes(q),
    );
  }, [keywords, keywordSearch]);

  const filteredCompetitors = useMemo(() => {
    if (!competitorSearch.trim()) return competitors;
    const q = competitorSearch.toLowerCase();

    return competitors.filter((c) => c.domain.toLowerCase().includes(q));
  }, [competitors, competitorSearch]);

  const keywordColumns = useMemo<DataGridColumn<Keyword>[]>(
    () => [
      {
        accessorKey: "term",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{item.term}</span>
            <span className="text-muted text-xs">{item.customer}</span>
          </div>
        ),
        header: "Keyword",
        id: "term",
        isRowHeader: true,
        minWidth: 260,
      },
      {
        accessorKey: "city",
        cell: (item) => (
          <div className="text-muted inline-flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {item.city}
          </div>
        ),
        header: "Location",
        id: "city",
        minWidth: 140,
      },
      {
        accessorKey: "rank",
        allowsSorting: true,
        cell: (item) => {
          const delta = item.previousRank - item.rank;

          return (
            <div className="flex items-center gap-2">
              <span className="text-foreground tabular-nums font-medium">#{item.rank}</span>
              {delta !== 0 ? (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs ${
                    delta > 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                  {Math.abs(delta)}
                </span>
              ) : null}
            </div>
          );
        },
        header: "Rank",
        id: "rank",
        minWidth: 110,
      },
      {
        accessorKey: "volume",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue className="tabular-nums" maximumFractionDigits={0} value={item.volume} />
        ),
        header: "Volume",
        id: "volume",
        minWidth: 100,
      },
      {
        accessorKey: "difficulty",
        allowsSorting: true,
        cell: (item) => (
          <span
            className={`tabular-nums text-sm ${
              item.difficulty >= 50
                ? "text-danger"
                : item.difficulty >= 35
                  ? "text-warning"
                  : "text-success"
            }`}
          >
            {item.difficulty}
          </span>
        ),
        header: "Difficulty",
        id: "difficulty",
        minWidth: 100,
      },
      {
        accessorKey: "intent",
        cell: (item) => (
          <Chip color={intentColor(item.intent)} size="sm" variant="soft">
            {item.intent}
          </Chip>
        ),
        header: "Intent",
        id: "intent",
        minWidth: 140,
      },
      {
        accessorKey: "ctr",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="text-muted tabular-nums"
            maximumFractionDigits={1}
            style="percent"
            value={item.ctr}
          />
        ),
        header: "CTR",
        id: "ctr",
        minWidth: 80,
      },
    ],
    [],
  );

  const competitorColumns = useMemo<DataGridColumn<Competitor>[]>(
    () => [
      {
        accessorKey: "domain",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-foreground text-sm font-medium">{item.domain}</span>
        ),
        header: "Competitor domain",
        id: "domain",
        isRowHeader: true,
        minWidth: 260,
      },
      {
        accessorKey: "visibilityScore",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-foreground font-medium tabular-nums">{item.visibilityScore}%</span>
        ),
        header: "Visibility share",
        id: "visibilityScore",
        minWidth: 150,
      },
      {
        accessorKey: "averagePosition",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-foreground font-medium tabular-nums">#{item.averagePosition}</span>
        ),
        header: "Average position",
        id: "averagePosition",
        minWidth: 150,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              label="Remove competitor"
              size="sm"
              variant="danger-soft"
              isDisabled={deletingId !== null}
              onPress={() => handleRemoveCompetitor(item.id, item.domain)}
            >
              <TrashBin className="size-4" />
            </IconButton>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 100,
      },
    ],
    [deletingId],
  );

  const isKeywordsEmpty = keywords.length === 0;
  const isCompetitorsEmpty = competitors.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Track ranks, study competitors, and let the SEO/XEO engine generate the next move."
        title="SEO / XEO Engine"
        trailing={
          <>
            {activeTab === "keywords" ? (
              <>
                <Button
                  isDisabled={recrawling}
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    setRecrawling(true);
                    notifyInfo("Recrawl started — ranks refresh in a few minutes");
                    window.setTimeout(() => setRecrawling(false), 2000);
                  }}
                >
                  <ArrowsRotateRight className="size-4" />
                  {recrawling ? "Recrawling…" : "Recrawl"}
                </Button>
                <TrackKeywordModal
                  state={trackState}
                  trigger={
                    <Button size="sm">
                      <Plus className="size-4" />
                      Track keyword
                    </Button>
                  }
                />
              </>
            ) : (
              <AddCompetitorModal
                state={competitorModalState}
                trigger={
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add competitor
                  </Button>
                }
              />
            )}
          </>
        }
      />

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="SEO tabs">
            <Tabs.Tab id="keywords">
              Keywords
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="competitors">
              Competitor tracking
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="keywords">
          {isKeywordsEmpty ? (
            <div className="pt-4">
              <EmptyState
                body="Add target keywords to start tracking ranks for each customer."
                cta={{label: "Add keyword", onPress: trackState.open}}
                icon={Magnifier}
                title="No keywords tracked yet"
              />
            </div>
          ) : (
            <Card className="rounded-2xl mt-4">
              <Card.Header className="flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Card.Title className="text-base">Tracked keywords</Card.Title>
                  <Chip size="sm" variant="soft">
                    {keywords.length}
                  </Chip>
                </div>
                <SearchField
                  aria-label="Search keywords"
                  className="w-full sm:w-[220px]"
                  name="keywords-search"
                  onChange={setKeywordSearch}
                >
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search keywords…" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </Card.Header>
              <Card.Content>
                <DataGrid
                  aria-label="Tracked keywords"
                  columns={keywordColumns}
                  contentClassName="min-w-[940px]"
                  data={filteredKeywords}
                  getRowId={(item) => item.id}
                />
              </Card.Content>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="competitors">
          {isCompetitorsEmpty ? (
            <div className="pt-4">
              <EmptyState
                body="Add domains your customers compete with to see share-of-voice and overlap."
                cta={{
                  label: "Add competitor",
                  onPress: competitorModalState.open,
                }}
                icon={Magnifier}
                title="No competitors tracked yet"
              />
            </div>
          ) : (
            <Card className="rounded-2xl mt-4">
              <Card.Header className="flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Card.Title className="text-base">Tracked competitors</Card.Title>
                  <Chip size="sm" variant="soft">
                    {competitors.length}
                  </Chip>
                </div>
                <SearchField
                  aria-label="Search competitors"
                  className="w-full sm:w-[220px]"
                  name="competitor-search"
                  onChange={setCompetitorSearch}
                >
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search competitors…" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </Card.Header>
              <Card.Content>
                <DataGrid
                  aria-label="Tracked competitors"
                  columns={competitorColumns}
                  contentClassName="min-w-[700px]"
                  data={filteredCompetitors}
                  getRowId={(item) => item.id}
                />
              </Card.Content>
            </Card>
          )}
        </Tabs.Panel>
      </Tabs>

      <TrackKeywordModal state={trackState} />
      <AddCompetitorModal state={competitorModalState} />
    </div>
  );
}
