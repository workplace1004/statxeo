import type {BaseDoc} from "./_helpers";

import {z} from "zod";

import {idToString} from "./_helpers";

export const CHAT_ROLES = ["user", "assistant", "system"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export interface ChatMessageDoc extends BaseDoc {
  customerOrgId: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  sentAt: Date;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export const chatMessageInputSchema = z.object({
  customerOrgId: z.string().min(1),
  conversationId: z.string().min(1).default("default"),
  role: z.enum(CHAT_ROLES),
  content: z.string().min(1),
});
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function serializeChatMessage(doc: ChatMessageDoc): ChatMessage {
  return {
    id: idToString(doc._id),
    role: doc.role,
    content: doc.content,
    timestamp: TIME.format(doc.sentAt).toLowerCase().replace(" ", ""),
  };
}
