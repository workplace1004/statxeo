"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Calendar, Plus} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface BookDemoModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function BookDemoModal({state: externalState, trigger}: BookDemoModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [company, setCompany] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setCompany("");
    setContactEmail("");
    setNotes("");
  }

  function handleBook(close: () => void) {
    if (!company.trim() || !contactEmail.trim()) return;
    notifySuccess(`Demo request sent for ${company.trim()}`);
    reset();
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Book new demo</Modal.Heading>
              <p className="text-muted text-sm">
                Request a discovery call — your assigned rep will confirm a time slot.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="company" value={company} onChange={setCompany}>
                <Label>Prospect company</Label>
                <Input placeholder="Acme Dental" />
              </TextField>
              <TextField
                isRequired
                name="contact-email"
                value={contactEmail}
                onChange={setContactEmail}
              >
                <Label>Contact email</Label>
                <Input placeholder="owner@business.com" type="email" />
              </TextField>
              <TextField name="notes" value={notes} onChange={setNotes}>
                <Label>Notes for the rep (optional)</Label>
                <TextArea
                  className="min-h-20 resize-y"
                  placeholder="Vertical, deal size, timing…"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                isDisabled={!company.trim() || !contactEmail.trim()}
                onPress={() => handleBook(state.close)}
              >
                <Calendar className="size-4" />
                Request demo
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function BookDemoButton({label = "Book new demo", size = "sm"}: {label?: string; size?: "sm" | "md"}) {
  return (
    <BookDemoModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
