"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Envelope, PersonPlus} from "@gravity-ui/icons";
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

export interface InviteCustomerModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function InviteCustomerModal({state: externalState, trigger}: InviteCustomerModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function handleSend(close: () => void) {
    if (!email.trim()) return;
    notifySuccess(`Invitation sent to ${email.trim()}`);
    setEmail("");
    setName("");
    setMessage("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Invite customer</Modal.Heading>
              <p className="text-muted text-sm">
                Send a branded invite so they can access their white-label workspace.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="invite-name" value={name} onChange={setName}>
                <Label>Business name</Label>
                <Input placeholder="Acme HVAC" />
              </TextField>
              <TextField isRequired name="invite-email" value={email} onChange={setEmail}>
                <Label>Contact email</Label>
                <Input placeholder="owner@business.com" type="email" />
              </TextField>
              <TextField name="invite-message" value={message} onChange={setMessage}>
                <Label>Personal note (optional)</Label>
                <TextArea
                  className="min-h-20 resize-y"
                  placeholder="Welcome aboard — here's what to expect in your first week."
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!email.trim()} onPress={() => handleSend(state.close)}>
                <Envelope className="size-4" />
                Send invite
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function InviteCustomerButton({
  size = "sm",
  variant,
}: {
  size?: "sm" | "md";
  variant?: "primary" | "tertiary";
}) {
  return (
    <InviteCustomerModal
      trigger={
        <Button size={size} variant={variant}>
          <PersonPlus className="size-4" />
          Invite customer
        </Button>
      }
    />
  );
}
