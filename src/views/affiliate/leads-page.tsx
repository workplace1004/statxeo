"use client";

import type {Lead, LeadStage} from "../../server/db/schemas/leads";
import type {UseKanbanReturn} from "@heroui-pro/react";

import {ArrowDownToLine, ArrowRight, Plus} from "@gravity-ui/icons";
import {Avatar, Button, Chip} from "@heroui/react";
import {KPI, KPIGroup, Kanban, NumberValue, useKanban, useKanbanColumn} from "@heroui-pro/react";
import {useMemo} from "react";

import {IconButton} from "../../components/icon-button";
import {exportLeadsCsv} from "../../lib/export/export-affiliate-csv";
import {notifySuccess} from "../../lib/ui/white-label-notify";
import {LEAD_STAGES, STAGE_INDICATOR} from "../../server/db/schemas/leads";
import {AddLeadButton, AddLeadModal} from "../../widgets/affiliate/modals/add-lead-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface AffiliateLeadsPageProps {
  leads: Lead[];
}

function getLeadColumn(lead: Lead): string {
  return lead.stage;
}

function setLeadColumn(lead: Lead, column: string): Lead {
  return {...lead, stage: column as LeadStage};
}

export function AffiliateLeadsPage({leads}: AffiliateLeadsPageProps) {
  const kanban = useKanban<Lead>({
    getColumn: getLeadColumn,
    initialItems: leads,
    setColumn: setLeadColumn,
  });

  const summary = useMemo(() => {
    let pipelineValue = 0;
    let won = 0;
    let demos = 0;
    let qualified = 0;

    for (const lead of kanban.list.items) {
      if (lead.stage !== "Closed Lost") pipelineValue += lead.dealValue;
      if (lead.stage === "Closed Won") won += 1;
      if (lead.stage === "Demo Booked") demos += 1;
      if (lead.stage === "Qualified") qualified += 1;
    }

    return {demos, pipelineValue, qualified, won};
  }, [kanban.list.items]);

  const isEmpty = leads.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Move leads through the pipeline. Drag a card to change stage.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => {
              exportLeadsCsv(kanban.list.items);
              notifySuccess(
                kanban.list.items.length > 0
                  ? `Exported ${kanban.list.items.length} leads`
                  : "Exported lead template (no rows yet)",
              );
            }}
          >
            <ArrowDownToLine className="size-4" />
            Export CSV
          </Button>
          <AddLeadButton />
        </div>
      </div>

      <KPIGroup>
        <KPI>
          <KPI.Header>
            <KPI.Title>Pipeline value</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value
                currency="USD"
                maximumFractionDigits={0}
                style="currency"
                value={summary.pipelineValue}
              />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Qualified</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={summary.qualified} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Demos booked</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={summary.demos} />
            )}
          </KPI.Content>
        </KPI>
        <KPIGroup.Separator />
        <KPI>
          <KPI.Header>
            <KPI.Title>Won this month</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            {isEmpty ? (
              <span className="text-foreground text-2xl font-semibold tabular-nums">—</span>
            ) : (
              <KPI.Value maximumFractionDigits={0} value={summary.won} />
            )}
          </KPI.Content>
        </KPI>
      </KPIGroup>

      {isEmpty ? (
        <EmptyState
          body="Leads from your referral links will appear here as they come in."
          cta={{label: "Add lead", onPress: () => notifySuccess("Use Add lead above")}}
          title="No leads yet"
        />
      ) : (
        <Kanban>
          {LEAD_STAGES.map((stage) => (
            <LeadColumn key={stage} kanban={kanban} stage={stage} />
          ))}
        </Kanban>
      )}
    </div>
  );
}

interface LeadColumnProps {
  stage: LeadStage;
  kanban: UseKanbanReturn<Lead>;
}

function LeadColumn({kanban, stage}: LeadColumnProps) {
  const {dragAndDropHooks, items} = useKanbanColumn(kanban, stage);

  return (
    <Kanban.Column>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator className={STAGE_INDICATOR[stage]} />
        <Kanban.ColumnTitle>{stage}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>
        <Kanban.ColumnActions>
          <AddLeadModal
            defaultStage={stage}
            trigger={
              <IconButton label={`Add lead to ${stage}`} size="sm" variant="ghost">
                <Plus className="size-4" />
              </IconButton>
            }
          />
        </Kanban.ColumnActions>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.CardList
          aria-label={stage}
          dragAndDropHooks={dragAndDropHooks}
          items={items}
          renderEmptyState={() => (
            <span className="text-muted text-xs">Drop leads here</span>
          )}
        >
          {(lead) => (
            <Kanban.Card textValue={lead.company}>
              <LeadCardContent lead={lead} />
            </Kanban.Card>
          )}
        </Kanban.CardList>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

function LeadCardContent({lead}: {lead: Lead}) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <Chip color={lead.tag.color} size="sm" variant="soft">
          {lead.tag.label}
        </Chip>
        <span className="text-muted inline-flex items-center gap-1 text-xs">
          {lead.source}
        </span>
      </div>
      <span className="text-foreground text-sm font-medium leading-snug">
        {lead.company}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted text-xs">{lead.industry}</span>
        <NumberValue
          className="text-foreground text-xs font-semibold tabular-nums"
          currency="USD"
          maximumFractionDigits={0}
          style="currency"
          value={lead.dealValue}
        />
      </div>
      {lead.note ? (
        <span className="text-muted text-xs leading-snug">{lead.note}</span>
      ) : null}
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-5">
            <Avatar.Image alt={lead.contactName} src={lead.contactAvatar} />
            <Avatar.Fallback>
              {lead.contactName
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </Avatar.Fallback>
          </Avatar>
          <span className="text-muted text-xs">{lead.contactName.split(" ")[0]}</span>
        </div>
        <span className="text-muted inline-flex items-center gap-1 text-xs tabular-nums">
          <ArrowRight className="size-3" />
          {lead.expectedClose}
        </span>
      </div>
    </div>
  );
}
