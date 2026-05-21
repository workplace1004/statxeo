"use client";

import type {Asset, AssetType} from "../../server/db/schemas/marketing-assets";

import {ArrowDownToLine, ArrowUpFromSquare, Copy, Funnel, Picture} from "@gravity-ui/icons";
import {Button, Card, Chip, Dropdown, Label, SearchField} from "@heroui/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {exportAssetsCsv} from "../../lib/export/export-affiliate-csv";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {ASSET_TYPE_COLORS, type AssetFormat} from "../../server/db/schemas/marketing-assets";
import {ShareLinkModal} from "../../widgets/affiliate/modals/share-link-modal";
import {EmptyState} from "../../widgets/empty-state";

const ASSET_TYPE_TABS: readonly (AssetType | "All")[] = [
  "All",
  "Logo",
  "Video",
  "Landing",
  "Email",
  "SMS",
  "Ad Creative",
];

export interface AffiliateAssetsPageProps {
  assets: Asset[];
}

export function AffiliateAssetsPage({assets}: AffiliateAssetsPageProps) {
  const [activeType, setActiveType] = useState<AssetType | "All">("All");
  const [formatFilter, setFormatFilter] = useState<AssetFormat | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo<Asset[]>(() => {
    let result: Asset[] = assets;

    if (activeType !== "All") {
      result = result.filter((a) => a.type === activeType);
    }
    if (formatFilter !== "all") {
      result = result.filter((a) => a.format === formatFilter);
    }
    if (search) {
      const q = search.toLowerCase();

      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q),
      );
    }

    return result;
  }, [activeType, assets, formatFilter, search]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">
          Polished, brand-safe assets for every campaign — logos, videos, landing pages, ad
          creative, and more.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ASSET_TYPE_TABS.map((type) => {
            const isActive = activeType === type;

            return isActive ? (
              <Button key={type} size="sm" onPress={() => setActiveType(type)}>
                {type}
              </Button>
            ) : (
              <Button
                key={type}
                size="sm"
                variant="tertiary"
                onPress={() => setActiveType(type)}
              >
                {type}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            aria-label="Search assets"
            className="w-full sm:w-[240px]"
            name="assets-search"
            variant="secondary"
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search assets..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Dropdown>
            <Button size="sm" variant="secondary">
              <Funnel className="size-4" />
              {formatFilter === "all" ? "Format" : formatFilter}
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                selectedKeys={[formatFilter]}
                onAction={(key) => setFormatFilter(key as AssetFormat | "all")}
              >
                <Dropdown.Item id="all" textValue="All formats">
                  <Label>All formats</Label>
                </Dropdown.Item>
                <Dropdown.Item id="PNG" textValue="PNG">
                  <Label>PNG</Label>
                </Dropdown.Item>
                <Dropdown.Item id="SVG" textValue="SVG">
                  <Label>SVG</Label>
                </Dropdown.Item>
                <Dropdown.Item id="MP4" textValue="MP4">
                  <Label>MP4</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              exportAssetsCsv(filtered);
              notifySuccess(
                filtered.length > 0
                  ? `Exported ${filtered.length} assets`
                  : "Exported asset template (no rows yet)",
              );
            }}
          >
            <ArrowDownToLine className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          body="Logos, videos, landing pages, and ad creative will appear here."
          title="Asset library coming soon"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} shareUrl={`https://statxeo.com/assets/${asset.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetCard({asset, shareUrl}: {asset: Asset; shareUrl: string}) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <div
        className={`bg-linear-to-br ${asset.preview} border-content2 flex aspect-[16/10] items-center justify-center border-b`}
      >
        <div
          className={`bg-content1/80 flex size-16 items-center justify-center rounded-2xl backdrop-blur-sm ${asset.glyphColor}`}
        >
          <Picture className="size-8" />
        </div>
      </div>
      <Card.Header className="gap-2">
        <div className="flex items-center gap-2">
          <Chip color={ASSET_TYPE_COLORS[asset.type]} size="sm" variant="soft">
            {asset.type}
          </Chip>
          <Chip color="default" size="sm" variant="soft">
            {asset.format}
          </Chip>
          {asset.tag ? (
            <Chip color="accent" size="sm" variant="soft">
              {asset.tag}
            </Chip>
          ) : null}
        </div>
        <Card.Title className="text-base">{asset.title}</Card.Title>
        <Card.Description>{asset.description}</Card.Description>
      </Card.Header>
      <Card.Footer className="flex-row items-center justify-between gap-2">
        <span className="text-muted text-xs">{asset.size}</span>
        <div className="flex items-center gap-1">
          <IconButton
            label="Copy share link"
            size="sm"
            variant="tertiary"
            onPress={() => copyToClipboard(shareUrl, "Share link copied")}
          >
            <Copy className="size-4" />
          </IconButton>
          <ShareLinkModal
            description={`Share "${asset.title}" with prospects or co-marketing partners.`}
            title="Share asset"
            url={shareUrl}
            trigger={
              <IconButton label="Share asset" size="sm" variant="tertiary">
                <ArrowUpFromSquare className="size-4" />
              </IconButton>
            }
          />
          <Button
            size="sm"
            variant="secondary"
            onPress={() => notifyInfo(`Downloading ${asset.title} (${asset.format})`)}
          >
            <ArrowDownToLine className="size-4" />
            Download
          </Button>
        </div>
      </Card.Footer>
    </Card>
  );
}
