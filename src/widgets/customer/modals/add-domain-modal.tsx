"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Globe, Plus} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface AddDomainModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function AddDomainModal({state: externalState, trigger}: AddDomainModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [domain, setDomain] = useState("");

  function handleAdd(close: () => void) {
    if (!domain.trim()) return;
    notifySuccess(`Domain ${domain.trim()} added — DNS verification pending`);
    setDomain("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Add domain</Modal.Heading>
              <p className="text-muted text-sm">
                Point a custom domain at your StatXEO-hosted website.
              </p>
            </Modal.Header>
            <Modal.Body>
              <TextField isRequired name="domain" value={domain} onChange={setDomain}>
                <Label>Domain</Label>
                <Input placeholder="www.yourbusiness.com" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!domain.trim()} onPress={() => handleAdd(state.close)}>
                <Globe className="size-4" />
                Add domain
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function AddDomainButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <AddDomainModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          Add domain
        </Button>
      }
    />
  );
}
