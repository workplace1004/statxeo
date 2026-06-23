"use client";

import type {WebsitePage} from "../../server/db/schemas/website-pages";
import type {DataGridColumn} from "@heroui-pro/react";

import {ArrowUpRightFromSquare, Display, FileText, Plus, Sparkles} from "@gravity-ui/icons";
import {Button, Card, Chip, useOverlayState} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useEffect, useMemo} from "react";
import {useRouter} from "next/navigation";

import {notifyInfo} from "../../lib/ui/white-label-notify";
import {PAGE_STATUS_COLORS} from "../../server/db/schemas/website-pages";
import {AutomationBanner} from "../../widgets/customer/automation-banner";
import {PageToolbar} from "../../widgets/page-toolbar";
import {
  GeneratePageModal,
  NewPageButton,
} from "../../widgets/customer/modals/generate-page-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerWebsitePageProps {
  pages: WebsitePage[];
  projectId: string | null;
  projectStatus: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {day: "numeric", month: "short"});
}

export function CustomerWebsitePage({pages, projectId, projectStatus}: CustomerWebsitePageProps) {
  const generateState = useOverlayState();
  const isGenerating = projectStatus === "generating" || projectStatus === "assets_pending";

  const columns = useMemo<DataGridColumn<WebsitePage>[]>(
    () => [
      {
        accessorKey: "title",
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-foreground truncate text-sm font-medium">{item.title}</span>
              {item.aiGenerated ? (
                <Chip color="accent" size="sm" variant="soft">
                  <Sparkles className="size-3" />
                  AI
                </Chip>
              ) : null}
            </div>
            <span className="text-muted truncate text-xs">{item.slug}</span>
          </div>
        ),
        header: "Page",
        id: "title",
        isRowHeader: true,
        minWidth: 280,
      },
      {
        accessorKey: "pageType",
        cell: (item) => (
          <Chip size="sm" variant="soft">
            {item.pageType}
          </Chip>
        ),
        header: "Type",
        id: "pageType",
        minWidth: 100,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={PAGE_STATUS_COLORS[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 140,
      },
      {
        accessorKey: "views",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue className="tabular-nums" maximumFractionDigits={0} value={item.views} />
        ),
        header: "Views",
        id: "views",
        minWidth: 90,
      },
      {
        accessorKey: "conversion",
        cell: (item) => (
          <NumberValue
            className="text-muted tabular-nums"
            maximumFractionDigits={1}
            style="percent"
            value={item.conversion / 100}
          />
        ),
        header: "Conv.",
        id: "conversion",
        minWidth: 90,
      },
      {
        accessorKey: "updatedAt",
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">{formatDate(item.updatedAt)}</span>
        ),
        header: "Updated",
        id: "updatedAt",
        minWidth: 100,
      },
      {
        align: "end",
        cell: (item) => (
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => notifyInfo(`Opening editor for “${item.title}”`)}
          >
            Edit
            <ArrowUpRightFromSquare className="size-3.5" />
          </Button>
        ),
        header: "",
        id: "actions",
        minWidth: 100,
      },
    ],
    [],
  );

  const publishedCount = pages.filter((p) => p.status === "Published").length;
  const draftCount = pages.filter((p) => p.status === "Draft").length;
  const totalViews = pages.reduce((s, p) => s + p.views, 0);
  const avgConversion =
    pages.length === 0
      ? 0
      : pages.reduce((s, p) => s + p.conversion, 0) / pages.length;

  const kpis = [
    {label: "Pages", value: pages.length, format: "decimal" as const, fractionDigits: 0},
    {label: "Published", value: publishedCount, format: "decimal" as const, fractionDigits: 0},
    {label: "Drafts", value: draftCount, format: "decimal" as const, fractionDigits: 0},
    {label: "Total views", value: totalViews, format: "decimal" as const, fractionDigits: 0},
  ];  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <AutomationBanner message="AI generates pages in your brand voice" />
      {isGenerating && projectId && (
        <GenerationPoller projectId={projectId} status={projectStatus ?? "generating"} />
      )}
      
      <PageToolbar
        title="Website"
        description="Your website on StatXEO — pages, blog posts, and AI-generated content."
        showPeriod={false}
        trailing={
          <>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Live preview opens when your site is published")}
            >
              <Display className="size-4" />
              Preview live
            </Button>
            <GeneratePageModal
              state={generateState}
              trigger={
                <Button size="sm">
                  <Sparkles className="size-4" />
                  Generate page
                </Button>
              }
            />
          </>
        }
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Pages</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value value={pages.length} maximumFractionDigits={0} />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Published</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {pages.length === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={publishedCount} maximumFractionDigits={0} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Drafts</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {pages.length === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={draftCount} maximumFractionDigits={0} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Total views</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {pages.length === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={totalViews} maximumFractionDigits={0} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg conversion</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {pages.length === 0 ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value value={avgConversion / 100} maximumFractionDigits={1} style="percent" />
            )}
          </KPI.Content>
        </KPI>
      </KPIGroup>

      {pages.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {pages.slice(0, 3).map((page) => (
            <Card key={page.id} className="rounded-2xl">
              <Card.Header>
                <div className="bg-content2 mb-3 flex aspect-[16/10] items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-background flex size-10 items-center justify-center rounded-xl shadow-sm">
                      <FileText className="text-muted size-5" />
                    </div>
                    <span className="text-muted text-xs">{page.slug}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Card.Title className="text-sm">{page.title}</Card.Title>
                  <Chip color={PAGE_STATUS_COLORS[page.status]} size="sm" variant="soft">
                    {page.status}
                  </Chip>
                </div>
                <Card.Description className="line-clamp-2">{page.excerpt}</Card.Description>
              </Card.Header>
              <Card.Footer className="justify-between">
                <span className="text-muted text-xs tabular-nums">
                  {page.views.toLocaleString()} views · {page.conversion}% conv.
                </span>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => notifyInfo(`Opening editor for “${page.title}”`)}
                >
                  Edit
                  <ArrowUpRightFromSquare className="size-3.5" />
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex flex-col">
            <Card.Title className="text-base">All pages</Card.Title>
            <Card.Description>Everything live and in-progress on your site.</Card.Description>
          </div>
          <NewPageButton />
        </Card.Header>
        <Card.Content>
          {pages.length === 0 ? (
            <EmptyState
              body="Pages on your StatXEO-hosted site appear here once published or drafted."
              cta={{label: "New page", onPress: generateState.open}}
              icon={FileText}
              title="No pages yet"
            />
          ) : (
            <DataGrid
              aria-label="Website pages"
              columns={columns}
              contentClassName="min-w-[820px]"
              data={pages}
              getRowId={(item) => item.id}
            />
          )}
        </Card.Content>
      </Card>
      <GeneratePageModal state={generateState} />
    </div>
  );
}

// ─── Generation poller ─────────────────────────────────────────────────────

const GENERATING_STATUSES = new Set(["generating", "assets_pending", "ready_for_generation"]);

function GenerationPoller({projectId, status}: {projectId: string; status: string}) {
  const router = useRouter();

  useEffect(() => {
    if (!GENERATING_STATUSES.has(status)) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/status/${projectId}`);
        if (!res.ok) return;
        const json = (await res.json()) as {project?: {status?: string}};
        const s = json?.project?.status;
        if (s && !GENERATING_STATUSES.has(s)) {
          clearInterval(id);
          router.refresh();
        }
      } catch {
        // network error — keep polling
      }
    }, 5000);
    return () => clearInterval(id);
  }, [projectId, status, router]);

  const messages: Record<string, string> = {
    assets_pending: "Preparing your website...",
    ready_for_generation: "Queuing generation...",
    generating: "Generating your website with AI — this usually takes 1–2 minutes.",
  };

  return (
    <Card className="rounded-xl border-primary/30 bg-primary/5">
      <Card.Content className="flex items-center gap-3 py-3">
        <div className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {messages[status] ?? "Processing your website..."}
          </span>
          <span className="text-muted-foreground text-xs">
            This page will update automatically when it&apos;s ready.
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}
