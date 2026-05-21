import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const ASSET_TYPES = ["Logo", "Video", "Landing", "Email", "SMS", "Ad Creative"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ASSET_FORMATS = ["PNG", "SVG", "MP4", "PDF", "HTML", "TXT", "ZIP"] as const;
export type AssetFormat = (typeof ASSET_FORMATS)[number];

export const ASSET_TAGS = ["New", "Updated", "Most used"] as const;
export type AssetTag = (typeof ASSET_TAGS)[number];

export const ASSET_TYPE_COLORS: Record<AssetType, ChipColor> = {
  "Ad Creative": "warning",
  Email: "accent",
  Landing: "success",
  Logo: "default",
  SMS: "warning",
  Video: "danger",
};

export interface MarketingAssetDoc extends BaseDoc {
  title: string;
  description: string;
  type: AssetType;
  format: AssetFormat;
  fileUrl: string | null;
  sizeBytes: number;
  /** Tailwind gradient classes — UI-only preview hint. */
  preview: string;
  /** Tailwind text-* class for the preview glyph. */
  glyphColor: string;
  tags: string[];
  tag: AssetTag | null;
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  type: AssetType;
  format: AssetFormat;
  size: string;
  preview: string;
  glyphColor: string;
  updatedAt: string;
  tag?: AssetTag;
}

export const marketingAssetInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  type: z.enum(ASSET_TYPES),
  format: z.enum(ASSET_FORMATS),
  fileUrl: z.string().url().nullable().optional(),
  sizeBytes: z.number().int().min(0).default(0),
  preview: z.string().default(""),
  glyphColor: z.string().default("text-foreground"),
  tags: z.array(z.string()).default([]),
  tag: z.enum(ASSET_TAGS).nullable().optional(),
});
export type MarketingAssetInput = z.infer<typeof marketingAssetInputSchema>;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function serializeMarketingAsset(doc: MarketingAssetDoc): Asset {
  return {
    id: idToString(doc._id),
    title: doc.title,
    description: doc.description,
    type: doc.type,
    format: doc.format,
    size: humanSize(doc.sizeBytes),
    preview: doc.preview,
    glyphColor: doc.glyphColor,
    updatedAt: dateToIso(doc.updatedAt).slice(0, 10),
    tag: doc.tag ?? undefined,
  };
}
