"use client";

import type {SupportCategory} from "../../../server/db/schemas/support-tickets";
import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {LifeRing, Plus} from "@gravity-ui/icons";
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

import {SUPPORT_CATEGORIES} from "../../../server/db/schemas/support-tickets";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface NewSupportTicketModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function NewSupportTicketModal({state: externalState, trigger}: NewSupportTicketModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("Other");
  const [message, setMessage] = useState("");

  function reset() {
    setSubject("");
    setCategory("Other");
    setMessage("");
  }

  function handleSubmit(close: () => void) {
    if (!subject.trim() || !message.trim()) return;
    notifySuccess("Ticket opened — the StatXEO team will reply within one business day");
    reset();
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>New support ticket</Modal.Heading>
              <p className="text-muted text-sm">
                Describe your issue — billing, AI, SEO, calling, or account access.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="subject" value={subject} onChange={setSubject}>
                <Label>Subject</Label>
                <Input placeholder="Call recordings not appearing" />
              </TextField>
              <Select
                className="w-full"
                name="category"
                selectedKey={category}
                onSelectionChange={(key) => setCategory(key as SupportCategory)}
              >
                <Label>Category</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {SUPPORT_CATEGORIES.map((c) => (
                      <ListBox.Item key={c} id={c} textValue={c}>
                        {c}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField isRequired name="message" value={message} onChange={setMessage}>
                <Label>Message</Label>
                <TextArea
                  className="min-h-24 resize-y"
                  placeholder="Include dates, phone numbers, or anything that helps us resolve this faster."
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                isDisabled={!subject.trim() || !message.trim()}
                onPress={() => handleSubmit(state.close)}
              >
                <LifeRing className="size-4" />
                Submit ticket
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function NewSupportTicketButton({
  label = "New ticket",
  size = "sm",
  variant,
}: {
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "tertiary" | "secondary";
}) {
  return (
    <NewSupportTicketModal
      trigger={
        <Button size={size} variant={variant ?? "primary"}>
          <Plus className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
