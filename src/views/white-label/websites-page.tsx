"use client";

import type {Site} from "../../server/db/schemas/sites";

import {
  ArrowRight,
  Display,
  EllipsisVertical,
  Eye,
  Globe,
  Pencil,
  Plus,
  Rocket,
} from "@gravity-ui/icons";
import {Avatar, Button, Card, Chip, SearchField, Tabs, useOverlayState} from "@heroui/react";
import {KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {
  GenerateWebsiteButton,
  GenerateWebsiteModal,
} from "../../widgets/white-label/modals/generate-website-modal";
import {WebsiteOptionsModal} from "../../widgets/white-label/modals/website-options-modal";
import {SITE_STATUS_COLOR} from "../../server/db/schemas/sites";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/page-toolbar";

export interface WhiteLabelWebsitesPageProps {
  sites: Site[];
}

export function WhiteLabelWebsitesPage({sites}: WhiteLabelWebsitesPageProps) {
  const generateState = useOverlayState();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const published = sites.filter((s) => s.status === "Published").length;
  const generating = sites.filter((s) => s.status === "Generating").length;
  const review = sites.filter((s) => s.status === "Review").length;
  const visits = sites.reduce((sum, s) => sum + s.monthlyVisits, 0);

  const filteredSites = useMemo(() => {
    let rows = [...sites];
    if (tab === "published") rows = rows.filter((s) => s.status === "Published");
    if (tab === "drafts") rows = rows.filter((s) => s.status === "Review" || s.status === "Draft");
    if (tab === "generating") rows = rows.filter((s) => s.status === "Generating");
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) => s.domain.toLowerCase().includes(q) || s.customer.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [sites, tab, search]);

  const isEmpty = sites.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Generate, edit, and publish customer websites with the AI website agent."
        showPeriod={false}
        title="Websites"
        trailing={
          <>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifyInfo("Theme library opens from Branding")}
            >
              <Globe className="size-4" />
              Manage themes
            </Button>
            <GenerateWebsiteModal
              state={generateState}
              trigger={
                <Button size="sm">
                  <Rocket className="size-4" />
                  Generate website
                </Button>
              }
            />
          </>
        }
      />

      {isEmpty ? (
        <EmptyState
          body="Sites you publish for customers will appear here."
          cta={{label: "New site", onPress: generateState.open}}
          icon={Globe}
          title="No websites yet"
        />
      ) : (
        <>
          <KPIGroup>
            <KPI>
              <KPI.Header>
                <KPI.Icon status="success">
                  <Display />
                </KPI.Icon>
                <KPI.Title>Published</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={published} />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Icon status="warning">
                  <Pencil />
                </KPI.Icon>
                <KPI.Title>In review</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={review} />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Icon status="warning">
                  <Rocket />
                </KPI.Icon>
                <KPI.Title>Generating</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={generating} />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Total monthly visits</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={visits} />
              </KPI.Content>
            </KPI>
          </KPIGroup>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
              <Tabs.ListContainer>
                <Tabs.List aria-label="Website filter">
                  <Tabs.Tab id="all">
                    All
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="published">
                    Published
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="drafts">
                    Drafts & review
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="generating">
                    Generating
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            <SearchField
              aria-label="Search domains"
              className="w-full sm:w-[220px]"
              name="sites-search"
              onChange={setSearch}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search domains…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => (
              <Card key={site.id} className="overflow-hidden rounded-2xl">
                <div className="bg-content2 relative aspect-video w-full overflow-hidden">
                  {site.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${site.customer} site preview`}
                      className="size-full object-cover"
                      loading="lazy"
                      src={site.preview}
                    />
                  ) : (
                    <div className="text-muted flex size-full items-center justify-center text-xs">
                      No preview
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Chip color={SITE_STATUS_COLOR[site.status]} size="sm" variant="soft">
                      {site.status}
                    </Chip>
                  </div>
                </div>
                <Card.Header className="flex-row items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Card.Title className="truncate text-sm">{site.domain}</Card.Title>
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="size-5">
                        <Avatar.Image alt={site.customer} src={site.customerAvatar} />
                        <Avatar.Fallback>
                          {site.customer
                            .split(" ")
                            .map((p) => p[0])
                            .join("")}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="text-muted truncate text-xs">{site.customer}</span>
                    </div>
                  </div>
                  <WebsiteOptionsModal
                    site={site}
                    trigger={
                      <IconButton
                        label="More options"
                        size="sm"
                        variant="tertiary"
                      >
                        <EllipsisVertical className="size-4" />
                      </IconButton>
                    }
                  />
                </Card.Header>
                <Card.Content className="flex flex-col gap-2 pt-0">
                  <div className="text-muted flex items-center justify-between text-xs">
                    <span>{site.theme}</span>
                    <span className="tabular-nums">{site.pages} pages</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Monthly visits</span>
                    <NumberValue
                      className="text-foreground font-medium tabular-nums"
                      maximumFractionDigits={0}
                      value={site.monthlyVisits}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Last published</span>
                    <span className="text-foreground tabular-nums">{site.lastPublished}</span>
                  </div>
                </Card.Content>
                <Card.Footer className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() =>
                      site.preview
                        ? window.open(site.preview, "_blank", "noopener,noreferrer")
                        : notifyInfo("No preview available yet")
                    }
                  >
                    <Eye className="size-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onPress={() => notifyInfo(`Opening editor for ${site.domain}`)}
                  >
                    Open editor
                    <ArrowRight className="size-4" />
                  </Button>
                </Card.Footer>
              </Card>
            ))}
            <Card className="border-border rounded-2xl border-2 border-dashed">
              <Card.Content className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-2xl">
                  <Plus className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-foreground text-sm font-semibold">Generate a new site</span>
                  <span className="text-muted text-xs">
                    Describe the business and our AI website agent will draft 12 pages in under a minute.
                  </span>
                </div>
                <GenerateWebsiteButton label="Start generation" />
              </Card.Content>
            </Card>
          </div>
        </>
      )}
      <GenerateWebsiteModal state={generateState} />
    </div>
  );
}
