"use client";

import type {LinkChannel, LinkStatus, ReferralLink} from "../../server/db/schemas/referral-links";
import type {DataGridColumn} from "@heroui-pro/react";

import {
  ArrowDownToLine,
  ArrowUpFromSquare,
  Copy,
  EllipsisVertical,
  Funnel,
  Megaphone,
  Pause,
  Pencil,
  Plus,
  QrCode,
  TrashBin,
} from "@gravity-ui/icons";
import {Button, Card, Chip, Dropdown, Label, SearchField} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useCallback, useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {exportReferralLinksCsv} from "../../lib/export/export-affiliate-csv";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {LINK_STATUS_COLOR} from "../../server/db/schemas/referral-links";
import {GenerateQrButton} from "../../widgets/affiliate/modals/generate-qr-modal";
import {NewReferralLinkModal} from "../../widgets/affiliate/modals/new-referral-link-modal";
import {ShareLinkModal} from "../../widgets/affiliate/modals/share-link-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface AffiliateLinksPageProps {
  links: ReferralLink[];
}

const CHANNEL_LABEL: Record<LinkChannel, string> = {
  ads: "Paid Ads",
  blog: "Blog",
  email: "Email",
  qr: "QR Code",
  social: "Social",
  widget: "Widget",
};

const STATUS_LABEL: Record<LinkStatus, string> = {
  active: "Active",
  archived: "Archived",
  paused: "Paused",
};

export function AffiliateLinksPage({links: initialLinks}: AffiliateLinksPageProps) {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<LinkChannel | "all">("all");

  const filtered = useMemo<ReferralLink[]>(() => {
    let rows = links;
    if (channelFilter !== "all") {
      rows = rows.filter((l) => l.channel === channelFilter);
    }
    if (!search) return rows;
    const q = search.toLowerCase();

    return rows.filter(
      (l) =>
        l.campaign.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        CHANNEL_LABEL[l.channel].toLowerCase().includes(q),
    );
  }, [channelFilter, links, search]);

  const handleStatusChange = useCallback((id: string, status: LinkStatus) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? {...l, status} : l)));
    notifySuccess(`Link ${STATUS_LABEL[status].toLowerCase()}`);
  }, []);

  const columns = useMemo<DataGridColumn<ReferralLink>[]>(
    () => [
      {
        accessorKey: "campaign",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-foreground truncate text-sm font-medium">{item.campaign}</span>
            <div className="flex items-center gap-2">
              <code className="text-muted truncate text-xs font-normal">{item.url}</code>
              <IconButton
                label={`Copy ${item.campaign} link`}
                size="sm"
                variant="ghost"
                onPress={() => copyToClipboard(item.url, "Link copied")}
              >
                <Copy className="size-3.5" />
              </IconButton>
            </div>
          </div>
        ),
        header: "Campaign / Link",
        id: "campaign",
        isRowHeader: true,
        minWidth: 360,
      },
      {
        accessorKey: "channel",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <Chip color="default" size="sm" variant="soft">
            {CHANNEL_LABEL[item.channel]}
          </Chip>
        ),
        header: "Channel",
        id: "channel",
        minWidth: 110,
      },
      {
        accessorKey: "clicks",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <NumberValue className="tabular-nums" maximumFractionDigits={0} value={item.clicks} />
        ),
        header: "Clicks",
        id: "clicks",
        minWidth: 100,
      },
      {
        accessorKey: "conversions",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <NumberValue
            className="tabular-nums"
            maximumFractionDigits={0}
            value={item.conversions}
          />
        ),
        header: "Conversions",
        id: "conversions",
        minWidth: 120,
      },
      {
        accessorKey: "epc",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <NumberValue
            className="tabular-nums"
            currency="USD"
            maximumFractionDigits={2}
            style="currency"
            value={item.epc}
          />
        ),
        header: "EPC",
        id: "epc",
        minWidth: 90,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item: ReferralLink) => (
          <Chip color={LINK_STATUS_COLOR[item.status]} size="sm" variant="soft">
            {STATUS_LABEL[item.status]}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 110,
      },
      {
        align: "end",
        cell: (item: ReferralLink) => (
          <LinkRowActions link={item} onStatusChange={handleStatusChange} />
        ),
        header: "Actions",
        id: "actions",
        minWidth: 140,
      },
    ],
    [handleStatusChange],
  );

  const totals = useMemo(() => {
    let clicks = 0;
    let conversions = 0;
    let active = 0;
    let totalEpcWeighted = 0;
    let totalEpcClicks = 0;

    for (const link of links) {
      clicks += link.clicks;
      conversions += link.conversions;
      if (link.status === "active") active += 1;
      totalEpcWeighted += link.epc * link.clicks;
      totalEpcClicks += link.clicks;
    }

    return {
      activeLinks: active,
      avgEpc: totalEpcClicks > 0 ? totalEpcWeighted / totalEpcClicks : 0,
      clicks,
      conversions,
    };
  }, [links]);

  const isEmpty = links.length === 0;
  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://statxeo.com"}/embed/partner.js" async></script>`;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">
          Generate, share, and track every referral link, QR code, and embed.
        </p>
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Active links</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={totals.activeLinks} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Clicks · all time</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={totals.clicks} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Conversions</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={totals.conversions} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Avg. EPC</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value
                currency="USD"
                maximumFractionDigits={2}
                style="currency"
                value={totals.avgEpc}
              />
            )}
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <Card className="rounded-2xl">
        <Card.Header className="flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              aria-label="Search campaigns or URLs"
              className="w-full sm:w-[260px]"
              name="links-search"
              variant="secondary"
              onChange={setSearch}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search campaigns or URLs..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Dropdown>
              <Button size="sm" variant="secondary">
                <Funnel className="size-4" />
                {channelFilter === "all" ? "Channel" : CHANNEL_LABEL[channelFilter]}
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  selectedKeys={[channelFilter]}
                  onAction={(key) => setChannelFilter(key as LinkChannel | "all")}
                >
                  <Dropdown.Item id="all" textValue="All channels">
                    <Label>All channels</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="email" textValue="Email">
                    <Label>Email</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="social" textValue="Social">
                    <Label>Social</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="qr" textValue="QR Code">
                    <Label>QR Code</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="widget" textValue="Widget">
                    <Label>Widget</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="blog" textValue="Blog">
                    <Label>Blog</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="ads" textValue="Paid Ads">
                    <Label>Paid Ads</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                exportReferralLinksCsv(filtered);
                notifySuccess(
                  filtered.length > 0
                    ? `Exported ${filtered.length} links`
                    : "Exported link template (no rows yet)",
                );
              }}
            >
              <ArrowDownToLine className="size-4" />
              Export
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <GenerateQrButton />
            <NewReferralLinkModal
              onCreated={({campaign, channel, url}) => {
                setLinks((prev) => [
                  {
                    campaign,
                    channel,
                    clicks: 0,
                    conversions: 0,
                    createdAt: new Date().toISOString().slice(0, 10),
                    epc: 0,
                    id: `local-${Date.now()}`,
                    status: "active",
                    url,
                  },
                  ...prev,
                ]);
              }}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New link
                </Button>
              }
            />
          </div>
        </Card.Header>
        <Card.Content className="px-0">
          {isEmpty ? (
            <div className="px-5 pb-5">
              <EmptyState
                body="Create a link to start tracking clicks, signups, and commissions."
                cta={{
                  label: "New referral link",
                  onPress: () => notifyInfo("Use New link above to create your first campaign"),
                }}
                title="No referral links yet"
              />
            </div>
          ) : (
            <DataGrid
              aria-label="Referral links"
              columns={columns}
              contentClassName="min-w-[960px]"
              data={filtered}
              getRowId={(item: ReferralLink) => item.id}
            />
          )}
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-accent-soft text-accent flex size-9 items-center justify-center rounded-xl">
              <Megaphone className="size-5" />
            </div>
            <Card.Title className="text-base">Co-branded landing pages</Card.Title>
            <Card.Description>
              Spin up a vertical-specific landing page with your tracking baked in.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ShareLinkModal
              description="Share this template gallery with prospects — your affiliate ID is appended automatically."
              linkLabel="Template gallery URL"
              title="Browse templates"
              url={`${typeof window !== "undefined" ? window.location.origin : "https://statxeo.com"}/templates`}
              trigger={
                <Button size="sm" variant="secondary">
                  Browse templates
                </Button>
              }
            />
          </Card.Footer>
        </Card>
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-success-soft text-success flex size-9 items-center justify-center rounded-xl">
              <QrCode className="size-5" />
            </div>
            <Card.Title className="text-base">Print-ready QR codes</Card.Title>
            <Card.Description>
              Generate QR codes for trade shows, flyers, and door hangers.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <GenerateQrButton label="Generate QR" variant="secondary" />
          </Card.Footer>
        </Card>
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="bg-warning-soft text-warning flex size-9 items-center justify-center rounded-xl">
              <ArrowUpFromSquare className="size-5" />
            </div>
            <Card.Title className="text-base">Embeddable widgets</Card.Title>
            <Card.Description>
              Drop a 1-line script on your blog or partner site.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => copyToClipboard(embedCode, "Embed code copied")}
            >
              Get embed code
            </Button>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}

function LinkRowActions({
  link,
  onStatusChange,
}: {
  link: ReferralLink;
  onStatusChange: (id: string, status: LinkStatus) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton
        label="Copy URL"
        size="sm"
        variant="tertiary"
        onPress={() => copyToClipboard(link.url, "Link copied")}
      >
        <Copy className="size-4" />
      </IconButton>
      <IconButton
        label="Edit campaign"
        size="sm"
        variant="tertiary"
        onPress={() => notifyInfo(`Edit "${link.campaign}" — name changes sync on save`)}
      >
        <Pencil className="size-4" />
      </IconButton>
      <Dropdown>
        <IconButton label="More actions" size="sm" variant="tertiary">
          <EllipsisVertical className="size-4" />
        </IconButton>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === "pause") onStatusChange(link.id, "paused");
              if (key === "archive") onStatusChange(link.id, "archived");
            }}
          >
            <Dropdown.Item id="pause" textValue="Pause">
              <Pause />
              <Label>Pause</Label>
            </Dropdown.Item>
            <Dropdown.Item id="archive" textValue="Archive">
              <TrashBin />
              <Label>Archive</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
