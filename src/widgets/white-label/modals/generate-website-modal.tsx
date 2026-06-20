"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Rocket} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextArea, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";
import {useRouter} from "next/navigation";

import {notifyError, notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface GenerateWebsiteModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function GenerateWebsiteModal({state: externalState, trigger}: GenerateWebsiteModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [business, setBusiness] = useState("");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(close: () => void) {
    if (!business.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/white-label/websites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: business.trim(),
          domain: domain.trim() || undefined,
          brief: brief.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message || "Failed to start website generation");
      }

      notifySuccess(`Website generation started for ${business.trim()}`);
      setDomain("");
      setBusiness("");
      setBrief("");
      router.refresh();
      close();
    } catch (err: any) {
      console.error(err);
      notifyError(err.message || "Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
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
              <TextField isRequired name="site-business" value={business} onChange={setBusiness} isDisabled={generating}>
                <Label>Business name</Label>
                <Input placeholder="Customer business name" />
              </TextField>
              <TextField name="site-domain" value={domain} onChange={setDomain} isDisabled={generating}>
                <Label>Preferred domain</Label>
                <Input placeholder="business.com" />
              </TextField>
              <TextField name="site-brief" value={brief} onChange={setBrief} isDisabled={generating}>
                <Label>Creative brief</Label>
                <TextArea
                  className="min-h-24 resize-y"
                  placeholder="Services offered, service areas, brand tone, must-have pages…"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary" isDisabled={generating}>
                Cancel
              </Button>
              <Button isDisabled={!business.trim() || generating} onPress={() => handleGenerate(state.close)}>
                {generating ? (
                  <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                ) : (
                  <Rocket className="size-4" />
                )}
                {generating ? "Generating…" : "Start generation"}
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
