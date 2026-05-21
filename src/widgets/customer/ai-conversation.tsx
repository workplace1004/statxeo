"use client";

import type {ChatMessage} from "../../server/db/schemas/chat-messages";

import {ArrowRight, Sparkles} from "@gravity-ui/icons";
import {ScrollShadow} from "@heroui/react";
import {motion} from "motion/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../empty-state";
import {AiChatComposer} from "./ai-chat-composer";
import {AiMessageActions} from "./ai-message-actions";

const SUGGESTED_PROMPTS = [
  "What should I focus on this week to improve local SEO?",
  "Draft a social post promoting our spring tune-up special.",
  "Summarize my pending AI tasks and what needs my approval.",
  "How is my website traffic trending compared to last month?",
  "Write a friendly reply to a customer asking about pricing.",
  "What keywords am I ranking for, and where can I improve?",
] as const;

export interface AiConversationProps {
  messages: ChatMessage[];
}

export function AiConversation({messages: initialMessages}: AiConversationProps) {
  const [messages, setMessages] = useState(initialMessages);
  const hasMessages = messages.length > 0;

  function handleSend(text: string) {
    const now = new Date().toLocaleTimeString("en-US", {hour: "numeric", minute: "2-digit"});
    setMessages((prev) => [
      ...prev,
      {id: `local-${Date.now()}`, role: "user", content: text, timestamp: now},
    ]);
  }

  function handleSuggestedPrompt(prompt: string) {
    handleSend(prompt);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {hasMessages ? (
        <ScrollShadow className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto overscroll-contain">
          <motion.div
            animate={{opacity: 1}}
            className="mx-auto flex w-full max-w-[714px] flex-col gap-6 px-4 pb-6 pt-6"
            initial={{opacity: 0}}
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex flex-col items-end gap-1">
                  <div className="bg-accent/15 border-accent/25 max-w-[85%] rounded-2xl rounded-br-md border px-4 py-3">
                    <p className="text-foreground text-base leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-muted text-xs">{message.timestamp}</span>
                </div>
              ) : message.role === "assistant" ? (
                <div key={message.id} className="flex flex-col items-start gap-2 py-1 pl-1 pr-12">
                  <div className="border-default/80 max-w-[92%] border-l-2 border-l-[#6366F1] py-1 pl-4">
                    <p className="text-foreground text-base leading-relaxed">{message.content}</p>
                  </div>
                  <span className="text-muted text-xs">{message.timestamp}</span>
                  <AiMessageActions content={message.content} />
                </div>
              ) : null,
            )}
          </motion.div>
        </ScrollShadow>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-[714px] flex-col justify-center gap-8 px-4 py-10">
            <EmptyState
              body="Ask about SEO, social, reviews, or anything else — your assistant has full business context."
              icon={Sparkles}
              title="What do you want to work on?"
            />
            <div className="flex flex-col gap-3">
              <p className="text-muted text-center text-xs font-medium tracking-wide uppercase">
                Suggested prompts
              </p>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={prompt}
                    className="border-default text-foreground hover:border-accent/40 hover:bg-accent/5 group flex w-full items-start justify-between gap-3 rounded-full border bg-transparent px-4 py-3 text-left text-sm leading-snug transition-colors"
                    initial={{opacity: 0, y: 12}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.25, delay: index * 0.04}}
                    type="button"
                    whileHover={{scale: 1.01}}
                    whileTap={{scale: 0.99}}
                    onClick={() => handleSuggestedPrompt(prompt)}
                  >
                    <span className="min-w-0 flex-1 text-pretty">{prompt}</span>
                    <ArrowRight className="text-muted mt-0.5 size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background shrink-0 border-t px-4 pb-4 pt-3">
        <div className="mx-auto flex w-full max-w-[714px] flex-col items-center gap-1">
          <AiChatComposer
            className="w-full"
            variant={hasMessages ? "default" : "pill"}
            onSend={handleSend}
          />
          <p className="text-muted text-center text-xs">
            AI can make mistakes. Check important info before publishing.
          </p>
        </div>
      </div>
    </div>
  );
}
