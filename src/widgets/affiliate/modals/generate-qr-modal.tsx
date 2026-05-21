"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Copy, QrCode} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {copyToClipboard} from "../../../lib/ui/copy-to-clipboard";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface GenerateQrModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
  defaultUrl?: string;
}

export function GenerateQrModal({
  defaultUrl = "",
  state: externalState,
  trigger,
}: GenerateQrModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [url, setUrl] = useState(defaultUrl);

  function handleGenerate() {
    if (!url.trim()) return;
    notifySuccess("QR code ready — download from your assets or print at 300 DPI");
    copyToClipboard(url.trim(), "QR destination URL copied");
    state.close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Generate QR code</Modal.Heading>
              <p className="text-muted text-sm">
                Point a QR code at any referral URL — great for events, flyers, and door hangers.
              </p>
            </Modal.Header>
            <Modal.Body>
              <TextField isRequired name="qr-url" value={url} onChange={setUrl}>
                <Label>Destination URL</Label>
                <Input placeholder="https://statxeo.com/r/your-campaign" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!url.trim()} onPress={handleGenerate}>
                <QrCode className="size-4" />
                Generate QR
              </Button>
              <Button
                isDisabled={!url.trim()}
                variant="secondary"
                onPress={() => copyToClipboard(url.trim(), "URL copied")}
              >
                <Copy className="size-4" />
                Copy URL
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function GenerateQrButton({
  defaultUrl,
  label = "Generate QR",
  size = "sm",
  variant = "tertiary",
}: {
  defaultUrl?: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "tertiary";
}) {
  return (
    <GenerateQrModal
      defaultUrl={defaultUrl}
      trigger={
        <Button size={size} variant={variant}>
          <QrCode className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
