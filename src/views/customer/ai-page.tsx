"use client";

import type {AiSettings} from "../../server/db/schemas/ai-settings";
import type {AiTask} from "../../server/db/schemas/ai-tasks";
import type {ChatMessage} from "../../server/db/schemas/chat-messages";

import {Sparkles, ToggleOn} from "@gravity-ui/icons";
import {Button, Card, Chip, Switch, useOverlayState} from "@heroui/react";
import {Segment} from "@heroui-pro/react";
import {motion} from "motion/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";
import {AiAssistantAvatar} from "../../widgets/customer/ai-assistant-avatar";
import {VoiceToneModal} from "../../widgets/customer/modals/voice-tone-modal";
import {AiConversation} from "../../widgets/customer/ai-conversation";
import {AiTaskList} from "../../widgets/customer/ai-task-list";
import {AiTrainingGrid} from "../../widgets/customer/ai-training-grid";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerAiPageProps {
  tasks: AiTask[];
  settings: AiSettings[];
  chat: ChatMessage[];
}

type AiTab = "conversation" | "autopilot";

export function CustomerAiPage({chat, settings, tasks}: CustomerAiPageProps) {
  const [tab, setTab] = useState<AiTab>("conversation");
  const voiceState = useOverlayState();

  return (
    <div
      className={
        tab === "conversation"
          ? "flex h-[calc(100dvh-4rem)] flex-col overflow-hidden"
          : "mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4"
      }
    >
      <div
        className={
          tab === "conversation"
            ? "border-default/60 flex shrink-0 flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        {tab === "autopilot" ? (
          <motion.div
            animate={{opacity: 1, y: 0}}
            className="from-accent/15 w-full rounded-2xl bg-gradient-to-br to-transparent p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
            initial={{opacity: 0, y: 8}}
            transition={{duration: 0.25}}
          >
            <div className="flex items-center gap-3">
              <AiAssistantAvatar size={44} />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-foreground text-lg font-semibold">AI Autopilot</h2>
                  <Chip color="success" size="sm" variant="soft">
                    Active
                  </Chip>
                </div>
                <p className="text-muted text-sm">
                  Your AI assistant is running tasks automatically.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
              <Chip size="sm" variant="soft">
                {tasks.filter((t) => t.status !== "Waiting for approval").length} completed
              </Chip>
              <Chip color="warning" size="sm" variant="soft">
                {tasks.filter((t) => t.status === "Waiting for approval").length} pending approval
              </Chip>
              <Chip color="success" size="sm" variant="soft">
                Autopilot ON
              </Chip>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <AiAssistantAvatar size={40} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-lg font-semibold">Your AI Assistant</h2>
                <Chip color="success" size="sm" variant="soft">
                  Active
                </Chip>
              </div>
              <p className="text-muted text-sm">Helping your business grow on autopilot.</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Segment
            aria-label="AI assistant sections"
            selectedKey={tab}
            size="sm"
            onSelectionChange={(key) => {
              if (key === "conversation" || key === "autopilot") setTab(key);
            }}
          >
            <Segment.Item id="conversation">Conversation</Segment.Item>
            <Segment.Item id="autopilot">Autopilot</Segment.Item>
          </Segment>
          {tab === "autopilot" ? (
            <VoiceToneModal
              state={voiceState}
              trigger={
                <Button size="sm" variant="tertiary">
                  Voice &amp; tone settings
                </Button>
              }
            />
          ) : null}
        </div>
      </div>

      {tab === "conversation" ? (
        <AiConversation messages={chat} />
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">AI autopilot</Card.Title>
              <Card.Description>
                Choose what the AI can do on its own and what should always come to you first.
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {settings.length === 0 ? (
                <div className="lg:col-span-2">
                  <EmptyState
                    body="Once your AI is configured, toggle which actions run automatically here."
                    icon={ToggleOn}
                    title="No autopilot settings yet"
                  />
                </div>
              ) : (
                settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="hover:bg-content2 flex items-center justify-between gap-3 rounded-xl p-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground text-sm font-medium">{setting.label}</span>
                      <span className="text-muted text-xs leading-snug">{setting.description}</span>
                    </div>
                    <Switch
                      aria-label={setting.label}
                      defaultSelected={setting.enabled}
                      onChange={(selected) =>
                        notifySuccess(
                          selected
                            ? `${setting.label} enabled on autopilot`
                            : `${setting.label} requires your approval`,
                        )
                      }
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </div>
                ))
              )}
            </Card.Content>
          </Card>

          <Card className="rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">Suggested actions</Card.Title>
              <Card.Description>AI-recommended next steps for your business.</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              {tasks.length === 0 ? (
                <EmptyState
                  body="As your AI agents start drafting work, suggestions and approvals appear here."
                  icon={Sparkles}
                  title="AI assistant is warming up"
                />
              ) : (
                <AiTaskList tasks={tasks} />
              )}
            </Card.Content>
          </Card>

          <Card className="rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">AI training</Card.Title>
              <Card.Description>
                Help your assistant sound like you. Upload past customer emails, recordings, or
                sample posts.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <AiTrainingGrid />
            </Card.Content>
          </Card>
        </div>
      )}
      <VoiceToneModal state={voiceState} />
    </div>
  );
}
