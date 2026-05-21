"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Handset, Plus} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface AddPhoneModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function AddPhoneModal({state: externalState, trigger}: AddPhoneModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [label, setLabel] = useState("");
  const [forwarding, setForwarding] = useState("");

  function handleAdd(close: () => void) {
    if (!forwarding.trim()) return;
    notifySuccess("Tracking number provisioning started — we'll email DNS steps if needed");
    setLabel("");
    setForwarding("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Add phone number</Modal.Heading>
              <p className="text-muted text-sm">
                Add a local or toll-free tracking number that forwards to your main line.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="phone-label" value={label} onChange={setLabel}>
                <Label>Label</Label>
                <Input placeholder="Main line · Google Ads" />
              </TextField>
              <TextField isRequired name="phone-forward" value={forwarding} onChange={setForwarding}>
                <Label>Forwards to</Label>
                <Input placeholder="(512) 555-0100" type="tel" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!forwarding.trim()} onPress={() => handleAdd(state.close)}>
                <Handset className="size-4" />
                Add number
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function AddPhoneButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <AddPhoneModal
      trigger={
        <Button size={size} variant="tertiary">
          <Plus className="size-4" />
          Add number
        </Button>
      }
    />
  );
}
