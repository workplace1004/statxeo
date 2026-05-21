import type {BaseDoc, ChipColor} from "./_helpers";

import {z} from "zod";

import {dateToIso, idToString} from "./_helpers";

export const REVIEW_PLATFORMS = ["Google", "Yelp", "Facebook", "InApp"] as const;
export type ReviewPlatform = (typeof REVIEW_PLATFORMS)[number];

export const REVIEW_STATUSES = ["Responded", "Pending response", "Flagged"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_COLORS: Record<ReviewStatus, ChipColor> = {
  Flagged: "danger",
  "Pending response": "warning",
  Responded: "success",
};

export interface ReviewDoc extends BaseDoc {
  customerOrgId: string;
  platform: ReviewPlatform;
  rating: number;
  body: string;
  authorName: string;
  authorAvatar: string | null;
  postedAt: Date;
  response: string | null;
  responseAt: Date | null;
}

export interface Review {
  id: string;
  authorName: string;
  authorAvatar: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  platform: Exclude<ReviewPlatform, "InApp"> | "Google" | "Yelp" | "Facebook";
  postedAt: string;
  status: ReviewStatus;
  response?: string;
}

export const reviewInputSchema = z.object({
  customerOrgId: z.string().min(1),
  platform: z.enum(REVIEW_PLATFORMS).default("Google"),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1),
  authorName: z.string().min(1),
  authorAvatar: z.string().url().nullable().optional(),
  postedAt: z.coerce.date().default(() => new Date()),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export function serializeReview(doc: ReviewDoc): Review {
  const platform: Review["platform"] =
    doc.platform === "InApp" ? "Google" : (doc.platform as Review["platform"]);
  const status: ReviewStatus = doc.response
    ? "Responded"
    : doc.rating <= 2
      ? "Flagged"
      : "Pending response";

  return {
    id: idToString(doc._id),
    authorName: doc.authorName,
    authorAvatar: doc.authorAvatar ?? "",
    rating: doc.rating as 1 | 2 | 3 | 4 | 5,
    body: doc.body,
    platform,
    postedAt: dateToIso(doc.postedAt).slice(0, 10),
    status,
    response: doc.response ?? undefined,
  };
}
