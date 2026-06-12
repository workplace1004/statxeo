"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Globe, Plus} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface AddCompetitorModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function AddCompetitorModal({state: externalState, trigger}: AddCompetitorModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [domain, setDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd(close: () => void) {
    if (!domain.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/white-label/seo/competitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domain.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Now tracking competitor: ${domain.trim()}`);
        setDomain("");
        close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to add competitor");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while adding competitor");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="md">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Add competitor</Modal.Heading>
            <p className="text-muted text-sm">
              Add a competitor's domain to track their visibility score and average position.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <TextField isRequired name="competitor-domain" value={domain} onChange={setDomain}>
              <Label>Domain / Website URL</Label>
              <Input placeholder="competitor.com" type="text" />
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary" isDisabled={isAdding}>
              Cancel
            </Button>
            <Button isDisabled={!domain.trim() || isAdding} onPress={() => handleAdd(state.close)}>
              {isAdding ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
              ) : (
                <Globe className="size-4 mr-1" />
              )}
              {isAdding ? "Adding…" : "Add domain"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}

export function AddCompetitorButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <AddCompetitorModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          Add competitor
        </Button>
      }
    />
  );
}
