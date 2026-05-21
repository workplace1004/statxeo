import "server-only";

import {validationError} from "./errors";

const BLOCKED_PATTERNS = [
  /\bguaranteed?\s+results?\b/i,
  /\b100%\s+(cure|success)\b/i,
  /\bno\s+risk\b/i,
  /\bcrypto\s+doubl(e|ing)\b/i,
];

const REGULATED_KEYWORDS = ["medical claim", "fda approved", "investment advice", "legal advice"];

export interface ContentSafetyResult {
  passed: boolean;
  flags: string[];
}

export function runContentSafetyGate(text: string): ContentSafetyResult {
  const flags: string[] = [];
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) flags.push("spam_or_misleading_claim");
  }
  for (const kw of REGULATED_KEYWORDS) {
    if (text.toLowerCase().includes(kw)) flags.push("regulated_industry");
  }
  if (text.split(/\s+/).length > 50) {
    const words = text.toLowerCase().split(/\s+/);
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
    const maxFreq = Math.max(...freq.values());
    if (maxFreq / words.length > 0.15) flags.push("keyword_stuffing");
  }
  return {passed: flags.length === 0, flags};
}

export function assertContentSafety(text: string): void {
  const result = runContentSafetyGate(text);
  if (!result.passed) {
    throw validationError("Content failed safety review", {flags: result.flags});
  }
}
