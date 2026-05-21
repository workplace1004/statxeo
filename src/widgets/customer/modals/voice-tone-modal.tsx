"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Microphone} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextArea, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface VoiceToneModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function VoiceToneModal({state: externalState, trigger}: VoiceToneModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [tone, setTone] = useState("Friendly, local, and professional");
  const [notes, setNotes] = useState("");

  function handleSave(close: () => void) {
    notifySuccess("Voice & tone settings saved");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Voice & tone</Modal.Heading>
              <p className="text-muted text-sm">
                Calibrate how your AI assistant writes posts, emails, and replies.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="tone" value={tone} onChange={setTone}>
                <Label>Tone</Label>
                <Input placeholder="Friendly, local, and professional" />
              </TextField>
              <TextField name="notes" value={notes} onChange={setNotes}>
                <Label>Additional guidance</Label>
                <TextArea
                  className="min-h-20 resize-y"
                  placeholder="Avoid jargon. Mention same-day service when relevant."
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button onPress={() => handleSave(state.close)}>
                <Microphone className="size-4" />
                Save settings
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}
