"use client";

import type {Workflow} from "../../server/db/schemas/workflows";
import type {DataGridColumn} from "@heroui-pro/react";

import {
  CirclePause,
  CirclePlay,
  EllipsisVertical,
  FileText,
  Magnifier,
  Pencil,
  Plus,
  Rocket,
  Stopwatch,
  Thunderbolt,
} from "@gravity-ui/icons";
import {Button, Card, Chip, SearchField, useOverlayState} from "@heroui/react";
import {DataGrid, KPI, KPIGroup, NumberValue} from "@heroui-pro/react";
import {useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {WORKFLOW_STATUS_COLOR} from "../../server/db/schemas/workflows";
import {EmptyState} from "../../widgets/empty-state";
import {NewWorkflowModal} from "../../widgets/white-label/modals/new-workflow-modal";
import {PageToolbar} from "../../widgets/page-toolbar";

export interface WhiteLabelAutomationPageProps {
  workflows: Workflow[];
}

export function WhiteLabelAutomationPage({workflows}: WhiteLabelAutomationPageProps) {
  const newWorkflowState = useOverlayState();
  const [search, setSearch] = useState("");

  const filteredWorkflows = useMemo(() => {
    if (!search.trim()) return workflows;
    const q = search.toLowerCase();
    return workflows.filter(
      (w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
    );
  }, [workflows, search]);

  const kpis = useMemo(() => {
    const active = workflows.filter((w) => w.status === "Active").length;
    const runs = workflows.reduce((sum, w) => sum + w.runsLast7Days, 0);
    const totalRuns = runs;
    const successRate = totalRuns > 0
      ? workflows.reduce((sum, w) => sum + (w.successRate * w.runsLast7Days), 0) / totalRuns
      : 0;
    // Assume 15 minutes saved per run
    const timeSavedHrs = (runs * 15) / 60;

    return {active, runs, successRate, timeSavedHrs};
  }, [workflows]);
  const columns = useMemo<DataGridColumn<Workflow>[]>(
    () => [
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">{item.name}</span>
            <span className="text-muted text-xs">{item.description}</span>
          </div>
        ),
        header: "Workflow",
        id: "name",
        isRowHeader: true,
        minWidth: 360,
      },
      {
        accessorKey: "trigger",
        cell: (item) => (
          <Chip size="sm" variant="soft">
            <Thunderbolt className="size-3" />
            {item.trigger}
          </Chip>
        ),
        header: "Trigger",
        id: "trigger",
        minWidth: 170,
      },
      {
        accessorKey: "customer",
        cell: (item) => <span className="text-muted text-xs">{item.customer}</span>,
        header: "Customer",
        id: "customer",
        minWidth: 180,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={WORKFLOW_STATUS_COLOR[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 110,
      },
      {
        accessorKey: "steps",
        cell: (item) => <span className="text-muted tabular-nums">{item.steps} steps</span>,
        header: "Steps",
        id: "steps",
        minWidth: 90,
      },
      {
        accessorKey: "runsLast7Days",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className="tabular-nums"
            maximumFractionDigits={0}
            value={item.runsLast7Days}
          />
        ),
        header: "Runs (7d)",
        id: "runsLast7Days",
        minWidth: 110,
      },
      {
        accessorKey: "successRate",
        allowsSorting: true,
        cell: (item) => (
          <NumberValue
            className={`tabular-nums ${
              item.successRate >= 0.95
                ? "text-success"
                : item.successRate >= 0.85
                  ? "text-warning"
                  : "text-danger"
            }`}
            maximumFractionDigits={1}
            style="percent"
            value={item.successRate}
          />
        ),
        header: "Success",
        id: "successRate",
        minWidth: 100,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-0.5" data-workflow-id={item.id}>
            <IconButton
              label={item.status === "Active" ? "Pause" : "Resume"}
              size="sm"
              variant="tertiary"
            >
              {item.status === "Active" ? (
                <CirclePause className="size-4" />
              ) : (
                <CirclePlay className="size-4" />
              )}
            </IconButton>
            <IconButton label="Edit workflow" size="sm" variant="tertiary">
              <Pencil className="size-4" />
            </IconButton>
            <IconButton label="More options" size="sm" variant="tertiary">
              <EllipsisVertical className="size-4" />
            </IconButton>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 140,
      },
    ],
    [],
  );

  const isEmpty = workflows.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Visual workflow builder. Trigger AI agents from forms, schedules, calls, and rank changes."
        showPeriod={false}
        title="Automation"
        trailing={
          <>
            <Button size="sm" variant="tertiary">
              <FileText className="size-4" />
              Templates
            </Button>
            <NewWorkflowModal
              state={newWorkflowState}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  New workflow
                </Button>
              }
            />
          </>
        }
      />

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Active workflows</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">{kpis.active}</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Runs (7d)</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">{kpis.runs}</span>
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Success rate</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <NumberValue
              className="text-foreground text-2xl font-semibold tabular-nums"
              maximumFractionDigits={1}
              style="percent"
              value={kpis.successRate}
            />
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Time saved</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <span className="text-foreground text-2xl font-semibold tabular-nums">
              {kpis.timeSavedHrs.toFixed(1)} hrs
            </span>
          </KPI.Content>
        </KPI>
      </KPIGroup>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <TemplateCard
          accent="bg-accent-soft text-accent"
          description="When a form is submitted, qualify with AI and SMS the owner within 5 minutes."
          icon={Thunderbolt}
          title="Lead instant follow-up"
        />
        <TemplateCard
          accent="bg-success-soft text-success"
          description="Every Monday, generate 3 social posts for each active customer from recent work."
          icon={Stopwatch}
          title="Weekly social roundup"
        />
        <TemplateCard
          accent="bg-warning-soft text-warning"
          description="When a tracked keyword drops > 5 spots, auto-draft a content brief for review."
          icon={Magnifier}
          title="Rank drop content brief"
        />
      </div>

      {isEmpty ? (
        <EmptyState
          body="Build your first automation to react to leads, reviews, or schedules."
          cta={{label: "New workflow", onPress: newWorkflowState.open}}
          icon={Thunderbolt}
          title="No workflows yet"
        />
      ) : (
        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Card.Title className="text-base">Workflows</Card.Title>
              <Chip size="sm" variant="soft">
                {workflows.length}
              </Chip>
            </div>
            <SearchField
              aria-label="Search workflows"
              className="w-full sm:w-[220px]"
              name="workflows-search"
              onChange={setSearch}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search workflows…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </Card.Header>
          <Card.Content>
            <DataGrid
              aria-label="Workflows"
              columns={columns}
              contentClassName="min-w-[1100px]"
              data={filteredWorkflows}
              getRowId={(item) => item.id}
            />
          </Card.Content>
        </Card>
      )}
      <NewWorkflowModal state={newWorkflowState} />
    </div>
  );
}

function TemplateCard({
  accent,
  description,
  icon: Icon,
  title,
}: {
  accent: string;
  description: string;
  icon: typeof Thunderbolt;
  title: string;
}) {
  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <div className="flex items-center gap-2">
          <span className={`${accent} flex size-9 items-center justify-center rounded-xl`}>
            <Icon className="size-4" />
          </span>
          <Card.Title className="text-base">{title}</Card.Title>
        </div>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button size="sm" variant="tertiary">
          <Rocket className="size-4" />
          Use template
        </Button>
      </Card.Footer>
    </Card>
  );
}
