"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Rocket} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextArea, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface GenerateWebsiteModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function GenerateWebsiteModal({state: externalState, trigger}: GenerateWebsiteModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [domain, setDomain] = useState("");
  const [business, setBusiness] = useState("");
  const [brief, setBrief] = useState("");

  function handleGenerate(close: () => void) {
    if (!business.trim()) return;
    notifySuccess(`Website generation started for ${business.trim()}`);
    setDomain("");
    setBusiness("");
    setBrief("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Generate website</Modal.Heading>
              <p className="text-muted text-sm">
                The AI website agent drafts pages from your brief — usually under a minute.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="site-business" value={business} onChange={setBusiness}>
                <Label>Business name</Label>
                <Input placeholder="Customer business name" />
              </TextField>
              <TextField name="site-domain" value={domain} onChange={setDomain}>
                <Label>Preferred domain</Label>
                <Input placeholder="business.com" />
              </TextField>
              <TextField name="site-brief" value={brief} onChange={setBrief}>
                <Label>Creative brief</Label>
                <TextArea
                  className="min-h-24 resize-y"
                  placeholder="Services offered, service areas, brand tone, must-have pages…"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!business.trim()} onPress={() => handleGenerate(state.close)}>
                <Rocket className="size-4" />
                Start generation
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function GenerateWebsiteButton({
  label = "Generate website",
  size = "sm",
  variant,
}: {
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "tertiary";
}) {
  return (
    <GenerateWebsiteModal
      trigger={
        <Button size={size} variant={variant}>
          <Rocket className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
