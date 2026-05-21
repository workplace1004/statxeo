"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Copy, Link as LinkIcon} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";

import {copyToClipboard} from "../../../lib/ui/copy-to-clipboard";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface ShareLinkModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
  title: string;
  description: string;
  url: string;
  linkLabel?: string;
}

export function ShareLinkModal({
  description,
  linkLabel = "Share link",
  state: externalState,
  title,
  trigger,
  url,
}: ShareLinkModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
              <p className="text-muted text-sm">{description}</p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isReadOnly name="share-url" value={url}>
                <Label>{linkLabel}</Label>
                <Input />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Close
              </Button>
              <Button onPress={() => copyToClipboard(url, "Link copied")}>
                <Copy className="size-4" />
                Copy link
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function ShareLinkButton({
  description,
  label,
  size = "sm",
  url,
  variant = "secondary",
}: {
  label: string;
  description: string;
  url: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "tertiary";
}) {
  return (
    <ShareLinkModal
      description={description}
      title={label}
      url={url}
      trigger={
        <Button size={size} variant={variant}>
          <LinkIcon className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
