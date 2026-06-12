"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Thunderbolt, Plus} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

const TRIGGERS = [
  "New lead",
  "Form submission",
  "Review posted",
  "Schedule",
  "Rank change",
  "Booking",
  "Webhook",
] as const;

export interface NewWorkflowModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function NewWorkflowModal({state: externalState, trigger}: NewWorkflowModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerKind, setTriggerKind] = useState<string>("New lead");
  const [customerName, setCustomerName] = useState("");
  const [steps, setSteps] = useState("3");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(close: () => void) {
    if (!name.trim() || !customerName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/white-label/automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          trigger: triggerKind,
          customerName: customerName.trim(),
          steps: Number(steps) || 2,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Workflow "${name.trim()}" created successfully`);
        setName("");
        setDescription("");
        setTriggerKind("New lead");
        setCustomerName("");
        setSteps("3");
        close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to create workflow");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while creating workflow");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="md">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Create automation workflow</Modal.Heading>
            <p className="text-muted text-sm">
              Design a new custom trigger and actions sequence for a customer.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <TextField isRequired name="w-name" value={name} onChange={setName}>
              <Label>Workflow name</Label>
              <Input placeholder="e.g. Lead Qualification Engine" />
            </TextField>
            <TextField name="w-desc" value={description} onChange={setDescription}>
              <Label>Description</Label>
              <TextArea placeholder="Qualify new inbound leads using local AI and SMS the owner." className="min-h-16" />
            </TextField>
            <TextField isRequired name="w-customer" value={customerName} onChange={setCustomerName}>
              <Label>Customer account name</Label>
              <Input placeholder="Acme Corp" />
            </TextField>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                className="w-full"
                name="w-trigger"
                selectedKey={triggerKind}
                onSelectionChange={(key) => setTriggerKind(String(key))}
              >
                <Label>Trigger event</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {TRIGGERS.map((t) => (
                      <ListBox.Item key={t} id={t} textValue={t}>
                        {t}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField isRequired name="w-steps" value={steps} onChange={setSteps}>
                <Label>Number of steps</Label>
                <Input type="number" />
              </TextField>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary" isDisabled={isSaving}>
              Cancel
            </Button>
            <Button isDisabled={!name.trim() || !customerName.trim() || isSaving} onPress={() => handleSave(state.close)}>
              {isSaving ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
              ) : (
                <Thunderbolt className="size-4 mr-1" />
              )}
              {isSaving ? "Creating…" : "Create workflow"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}

export function NewWorkflowButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <NewWorkflowModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          New workflow
        </Button>
      }
    />
  );
}
