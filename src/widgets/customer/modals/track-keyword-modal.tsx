"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Magnifier, Plus} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface TrackKeywordModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function TrackKeywordModal({state: externalState, trigger}: TrackKeywordModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [term, setTerm] = useState("");
  const [city, setCity] = useState("");

  function handleTrack(close: () => void) {
    if (!term.trim()) return;
    notifySuccess(`Now tracking "${term.trim()}"${city.trim() ? ` in ${city.trim()}` : ""}`);
    setTerm("");
    setCity("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Track keyword</Modal.Heading>
              <p className="text-muted text-sm">
                Add a search term to monitor rank, volume, and intent in your service areas.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="keyword-term" value={term} onChange={setTerm}>
                <Label>Keyword</Label>
                <Input placeholder="emergency plumber austin" />
              </TextField>
              <TextField name="keyword-city" value={city} onChange={setCity}>
                <Label>Target city</Label>
                <Input placeholder="Austin, TX" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!term.trim()} onPress={() => handleTrack(state.close)}>
                <Magnifier className="size-4" />
                Start tracking
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function TrackKeywordButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <TrackKeywordModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          Track keyword
        </Button>
      }
    />
  );
}
