"use client";

import type {LeadSource, LeadStage} from "../../../server/db/schemas/leads";
import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {PersonPlus} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {LEAD_SOURCES, LEAD_STAGES} from "../../../server/db/schemas/leads";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface AddLeadModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
  defaultStage?: LeadStage;
}

export function AddLeadModal({
  defaultStage = "New",
  state: externalState,
  trigger,
}: AddLeadModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [industry, setIndustry] = useState("");
  const [source, setSource] = useState<LeadSource>("Referral");
  const [stage, setStage] = useState<LeadStage>(defaultStage);
  const [dealValue, setDealValue] = useState("");

  function reset() {
    setCompany("");
    setContactName("");
    setIndustry("");
    setSource("Referral");
    setStage(defaultStage);
    setDealValue("");
  }

  function handleAdd(close: () => void) {
    if (!company.trim() || !contactName.trim()) return;
    notifySuccess(`${company.trim()} added to ${stage}`);
    reset();
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Add lead</Modal.Heading>
              <p className="text-muted text-sm">
                Log a prospect manually — they&apos;ll appear on your pipeline board.
              </p>
            </Modal.Header>
            <Modal.Body className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextField
                className="md:col-span-2"
                isRequired
                name="company"
                value={company}
                onChange={setCompany}
              >
                <Label>Company</Label>
                <Input placeholder="Acme HVAC" />
              </TextField>
              <TextField isRequired name="contact" value={contactName} onChange={setContactName}>
                <Label>Contact name</Label>
                <Input placeholder="Jane Smith" />
              </TextField>
              <TextField name="industry" value={industry} onChange={setIndustry}>
                <Label>Industry</Label>
                <Input placeholder="Home services" />
              </TextField>
              <Select
                className="w-full"
                name="source"
                selectedKey={source}
                onSelectionChange={(key) => setSource(key as LeadSource)}
              >
                <Label>Source</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {LEAD_SOURCES.map((s) => (
                      <ListBox.Item key={s} id={s} textValue={s}>
                        {s}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                className="w-full"
                name="stage"
                selectedKey={stage}
                onSelectionChange={(key) => setStage(key as LeadStage)}
              >
                <Label>Stage</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {LEAD_STAGES.map((s) => (
                      <ListBox.Item key={s} id={s} textValue={s}>
                        {s}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField
                className="md:col-span-2"
                name="deal-value"
                value={dealValue}
                onChange={setDealValue}
              >
                <Label>Deal value (USD)</Label>
                <Input placeholder="5000" type="number" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                isDisabled={!company.trim() || !contactName.trim()}
                onPress={() => handleAdd(state.close)}
              >
                <PersonPlus className="size-4" />
                Add lead
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function AddLeadButton({
  defaultStage,
  label = "Add lead",
  size = "sm",
}: {
  defaultStage?: LeadStage;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <AddLeadModal
      defaultStage={defaultStage}
      trigger={
        <Button size={size}>
          <PersonPlus className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
