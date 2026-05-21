"use client";

import type {TrainingModule, TrainingStatus} from "../../server/db/schemas/training";

import {BookOpen, CircleCheck, Clock, Cup, Play} from "@gravity-ui/icons";
import {Button, Card, Chip, ProgressBar} from "@heroui/react";
import {KPI, KPIGroup} from "@heroui-pro/react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {TRAINING_STATUS_COLORS} from "../../server/db/schemas/training";
import {EmptyState} from "../../widgets/empty-state";

const STATUS_LABEL: Record<TrainingStatus, string> = {
  Completed: "Completed",
  "In Progress": "In Progress",
  "Not Started": "Not started",
};

export interface AffiliateTrainingPageProps {
  modules: TrainingModule[];
  stats: {
    completed: number;
    inProgress: number;
    totalMinutes: number;
    certifications: number;
  };
}

export function AffiliateTrainingPage({modules, stats}: AffiliateTrainingPageProps) {
  const requiredCompleted = modules.filter(
    (m) => m.isRequired && m.status === "Completed",
  ).length;
  const totalRequired = modules.filter((m) => m.isRequired).length;
  const requiredProgress = totalRequired > 0 ? requiredCompleted / totalRequired : 0;
  const hoursInvested = Math.floor(stats.totalMinutes / 60);
  const minutesInvested = stats.totalMinutes % 60;
  const isEmpty = modules.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-1">
        <p className="text-muted text-sm">
          Earn certifications, sharpen your sales motion, and stay compliant.
        </p>
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Modules completed</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={stats.completed} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>In progress</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={stats.inProgress} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Time invested</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">
              {isEmpty ? "—" : `${hoursInvested}h ${minutesInvested}m`}
            </span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Certifications</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={stats.certifications} />
            )}
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center gap-3">
          <div className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Cup className="size-5" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Card.Title className="text-base">Required certification track</Card.Title>
            <Card.Description>
              Complete all required modules to promote Pro and Enterprise plans.
            </Card.Description>
          </div>
          <span className="text-foreground text-sm font-medium tabular-nums">
            {requiredCompleted}/{totalRequired}
          </span>
        </Card.Header>
        <Card.Content>
          <ProgressBar
            aria-label="Required training progress"
            color="accent"
            size="md"
            value={requiredProgress * 100}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </Card.Content>
      </Card>

      {isEmpty ? (
        <EmptyState
          body="Onboarding, sales, and compliance training will appear here."
          title="No training modules yet"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {modules.map((m) => (
            <TrainingCard key={m.id} module={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrainingCard({module: m}: {module: TrainingModule}) {
  const isComplete = m.status === "Completed";
  const isStarted = m.status === "In Progress";

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div
        className={`bg-linear-to-br ${m.thumbnail} border-content2 flex aspect-[16/7] items-center justify-center border-b`}
      >
        <div className="bg-content1/80 text-foreground flex size-14 items-center justify-center rounded-2xl backdrop-blur-sm">
          {isComplete ? <CircleCheck className="size-7" /> : <Play className="size-7" />}
        </div>
      </div>
      <Card.Header className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip color={TRAINING_STATUS_COLORS[m.status]} size="sm" variant="soft">
            {STATUS_LABEL[m.status]}
          </Chip>
          <Chip color="default" size="sm" variant="soft">
            <BookOpen className="size-3" />
            {m.lessons} lessons
          </Chip>
          <Chip color="default" size="sm" variant="soft">
            <Clock className="size-3" />
            {m.durationMinutes} min
          </Chip>
          {m.isRequired ? (
            <Chip color="warning" size="sm" variant="soft">
              Required
            </Chip>
          ) : null}
          {m.badge ? (
            <Chip color="accent" size="sm" variant="soft">
              {m.badge}
            </Chip>
          ) : null}
        </div>
        <Card.Title className="text-base">{m.title}</Card.Title>
        <Card.Description>{m.description}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <ProgressBar
          aria-label={`${m.title} progress`}
          color={isComplete ? "success" : "accent"}
          size="sm"
          value={m.progress}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted text-xs tabular-nums">{m.progress}% complete</span>
          <Button
            size="sm"
            variant={isComplete ? "tertiary" : "secondary"}
            onPress={() =>
              isComplete
                ? notifyInfo(`Reviewing "${m.title}"`)
                : notifySuccess(
                    isStarted ? `Continuing "${m.title}"` : `Started "${m.title}"`,
                  )
            }
          >
            {isComplete ? "Review" : isStarted ? "Continue" : "Start module"}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
