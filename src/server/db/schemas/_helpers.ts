import type {ObjectId} from "mongodb";

import {z} from "zod";

/** Chip color slugs used across the app (matches HeroUI Chip color prop). */
export type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

/** Mongo timestamps every document carries. */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/** Base shape every server Doc inherits. */
export interface BaseDoc extends Timestamps {
  _id: ObjectId;
}

/** Convert an ObjectId-ish value to its hex string. */
export function idToString(id: ObjectId): string {
  return id.toHexString();
}

/** Convert a Date to ISO string. */
export function dateToIso(d: Date): string {
  return d.toISOString();
}

/** Zod helper for an ISO datetime string OR a Date (we usually pass Date). */
export const zDate = z.preprocess(
  (v) => (typeof v === "string" ? new Date(v) : v),
  z.date(),
);
