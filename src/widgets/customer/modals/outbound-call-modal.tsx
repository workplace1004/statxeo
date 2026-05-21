"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Handset} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface OutboundCallModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function OutboundCallModal({state: externalState, trigger}: OutboundCallModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleCall(close: () => void) {
    if (!phone.trim()) return;
    notifySuccess(`Outbound call queued to ${phone.trim()}`);
    setName("");
    setPhone("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Place outbound call</Modal.Heading>
              <p className="text-muted text-sm">
                Your AI assistant will dial out using your primary tracking number.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="call-name" value={name} onChange={setName}>
                <Label>Contact name</Label>
                <Input placeholder="Jordan Lee" />
              </TextField>
              <TextField isRequired name="call-phone" value={phone} onChange={setPhone}>
                <Label>Phone number</Label>
                <Input placeholder="(512) 555-0142" type="tel" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!phone.trim()} onPress={() => handleCall(state.close)}>
                <Handset className="size-4" />
                Start call
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function OutboundCallButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <OutboundCallModal
      trigger={
        <Button size={size}>
          <Handset className="size-4" />
          Place outbound call
        </Button>
      }
    />
  );
}
