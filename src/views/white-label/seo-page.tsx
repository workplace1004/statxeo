"use client";

import type {Keyword} from "../../server/db/schemas/keywords";
import type {DataGridColumn} from "@heroui-pro/react";

import {
  ArrowDown,
  ArrowUp,
  ArrowsRotateRight,
  Magnifier,
  MapPin,
  Plus,
} from "@gravity-ui/icons";
import {Button, Card, Chip, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid, NumberValue} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../../widgets/empty-state";
import {TrackKeywordModal} from "../../widgets/white-label/modals/track-keyword-modal";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

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
}

export function WhiteLabelSeoPage({keywords}: WhiteLabelSeoPageProps) {
  const trackState = useOverlayState();
  const [search, setSearch] = useState("");
  const [recrawling, setRecrawling] = useState(false);

  const filteredKeywords = useMemo(() => {
    if (!search.trim()) return keywords;
    const q = search.toLowerCase();

    return keywords.filter(
      (k) =>
        k.term.toLowerCase().includes(q) ||
        k.customer.toLowerCase().includes(q) ||
        k.city.toLowerCase().includes(q),
    );
  }, [keywords, search]);

  const columns = useMemo<DataGridColumn<Keyword>[]>(
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

  const isEmpty = keywords.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Track ranks, study competitors, and let the SEO/XEO engine generate the next move."
        title="SEO / XEO Engine"
        trailing={
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
        }
      />

      {isEmpty ? (
        <EmptyState
          body="Add target keywords to start tracking ranks for each customer."
          cta={{label: "Add keyword", onPress: trackState.open}}
          icon={Magnifier}
          title="No keywords tracked yet"
        />
      ) : (
        <>
          <Card className="rounded-2xl">
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
                onChange={setSearch}
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
                columns={columns}
                contentClassName="min-w-[940px]"
                data={filteredKeywords}
                getRowId={(item) => item.id}
              />
            </Card.Content>
          </Card>

          <EmptyState
            body="Add domains your customers compete with to see share-of-voice and overlap."
            cta={{
              label: "Add competitor",
              onPress: () => notifySuccess("Competitor tracking will be available in the next release"),
            }}
            icon={Magnifier}
            title="No competitors tracked yet"
          />
        </>
      )}
      <TrackKeywordModal state={trackState} />
    </div>
  );
}
