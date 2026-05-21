"use client";

import type {AiTask} from "../../server/db/schemas/ai-tasks";

import {ArrowUpRightFromSquare, Sparkles} from "@gravity-ui/icons";
import {Card, Chip} from "@heroui/react";
import {motion} from "motion/react";

import {RouteButton} from "../../components/route-button";
import {AiAssistantAvatar} from "./ai-assistant-avatar";
import {AiTaskList} from "./ai-task-list";

export interface AutomationSpotlightCardProps {
  tasks: AiTask[];
}

export function AutomationSpotlightCard({tasks}: AutomationSpotlightCardProps) {
  const pendingCount = tasks.filter((t) => t.status === "Waiting for approval").length;

  return (
    <Card className="relative overflow-hidden rounded-2xl">
      <div className="from-accent/12 pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent" />

      <Card.Header className="relative flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AiAssistantAvatar size={36} />
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Card.Title className="text-base">AI automation</Card.Title>
              <Chip color="success" size="sm" variant="soft">
                Autopilot active
              </Chip>
              {pendingCount > 0 ? (
                <motion.div
                  animate={{scale: [1, 1.08, 1]}}
                  transition={{duration: 1.6, repeat: Infinity, repeatDelay: 3}}
                >
                  <Chip color="warning" size="sm" variant="soft">
                    {pendingCount} waiting
                  </Chip>
                </motion.div>
              ) : null}
            </div>
            <Card.Description>
              {pendingCount === 0
                ? "Your AI is working — nothing needs your attention right now."
                : `${pendingCount} task${pendingCount === 1 ? "" : "s"} drafted and waiting on your approval.`}
            </Card.Description>
          </div>
        </div>
        <RouteButton href="/customer/ai" size="sm" variant="tertiary">
          AI assistant
          <ArrowUpRightFromSquare className="size-3.5" />
        </RouteButton>
      </Card.Header>

      <Card.Content className="relative flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="border-default/60 rounded-xl border border-dashed p-5 text-center">
            <div className="bg-accent/10 text-accent mx-auto mb-3 flex size-10 items-center justify-center rounded-xl">
              <Sparkles className="size-5" />
            </div>
            <p className="text-foreground text-sm font-medium">AI assistant is warming up</p>
            <p className="text-muted mt-1 text-xs">
              As your AI agents start drafting work, suggestions appear here for your approval.
            </p>
            <div className="mt-3">
              <RouteButton href="/customer/ai" size="sm" variant="tertiary">
                Configure autopilot
              </RouteButton>
            </div>
          </div>
        ) : (
          <AiTaskList tasks={tasks} />
        )}
      </Card.Content>
    </Card>
  );
}
