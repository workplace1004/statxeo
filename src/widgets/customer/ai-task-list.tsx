"use client";

import type {AiTask} from "../../server/db/schemas/ai-tasks";

import React from "react";
import {ChartLine, FileText, Megaphone, Rocket, Sparkles} from "@gravity-ui/icons";
import {Button, Chip} from "@heroui/react";
import AnimatedList from "@/components/react-bits/animated-list";

import {AI_TASK_STATUS_COLORS} from "../../server/db/schemas/ai-tasks";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";

export interface AiTaskListProps {
  tasks: AiTask[];
}

const CATEGORY_ICONS: Record<string, {icon: React.ComponentType<{className?: string}>; bg: string}> = {
  SEO: {icon: ChartLine, bg: "bg-emerald-500/10 text-emerald-600"},
  Social: {icon: Megaphone, bg: "bg-sky-500/10 text-sky-600"},
  Website: {icon: FileText, bg: "bg-violet-500/10 text-violet-600"},
  Growth: {icon: Rocket, bg: "bg-amber-500/10 text-amber-600"},
};

export function AiTaskList({tasks}: AiTaskListProps) {
  if (tasks.length === 0) return null;

  return (
    <AnimatedList
      animationType="slide"
      autoAddDelay={0}
      className="w-full"
      enterFrom="bottom"
      fadeEdges
      height="auto"
      hoverEffect="scale"
      itemGap={8}
      items={tasks.map((task) => {
        const cat = CATEGORY_ICONS[task.category] ?? {icon: Sparkles, bg: "bg-accent/10 text-accent"};
        const CatIcon = cat.icon;
        return {
          id: task.id,
          content: (
            <div className="border-default bg-content1 hover:bg-content2 flex flex-col gap-1.5 rounded-xl border p-3 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${cat.bg}`}>
                    <CatIcon className="size-3.5" />
                  </div>
                  <span className="text-foreground line-clamp-2 text-sm font-medium leading-snug">
                    {task.title}
                  </span>
                </div>
                <Chip color={AI_TASK_STATUS_COLORS[task.status]} size="sm" variant="soft">
                  {task.status}
                </Chip>
              </div>
              <span className="text-muted pl-9 text-xs leading-snug">{task.description}</span>
              <div className="mt-1 flex items-center justify-between">
                <Chip size="sm" variant="soft">
                  {task.category}
                </Chip>
                {task.status === "Waiting for approval" ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => notifyInfo(`Dismissed "${task.title}"`)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => notifySuccess(`Approved "${task.title}"`)}
                    >
                      Approve
                    </Button>
                  </div>
                ) : task.completedAt ? (
                  <span className="text-muted text-xs">
                    Completed {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
          ),
        };
      })}
      maxItems={tasks.length}
      startFrom="top"
    />
  );
}
