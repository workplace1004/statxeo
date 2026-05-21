"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Megaphone, Plus} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "X", "Google"] as const;

export interface GeneratePostModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function GeneratePostModal({state: externalState, trigger}: GeneratePostModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [brief, setBrief] = useState("");
  const [customer, setCustomer] = useState("");
  const [platform, setPlatform] = useState<string>("Instagram");

  function handleGenerate(close: () => void) {
    if (!brief.trim()) return;
    notifySuccess("Draft post queued — check the Draft column in a moment");
    setBrief("");
    setCustomer("");
    setPlatform("Instagram");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Generate post</Modal.Heading>
              <p className="text-muted text-sm">
                Describe what you want — AI drafts copy in the customer&apos;s brand voice.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="post-customer" value={customer} onChange={setCustomer}>
                <Label>Customer</Label>
                <Input placeholder="Which customer is this for?" />
              </TextField>
              <Select
                className="w-full"
                name="post-platform"
                selectedKey={platform}
                onSelectionChange={(key) => setPlatform(String(key))}
              >
                <Label>Platform</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PLATFORMS.map((p) => (
                      <ListBox.Item key={p} id={p} textValue={p}>
                        {p}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField isRequired name="post-brief" value={brief} onChange={setBrief}>
                <Label>Brief</Label>
                <TextArea
                  className="min-h-24 resize-y"
                  placeholder="Promote spring AC tune-ups with a friendly, local tone…"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!brief.trim()} onPress={() => handleGenerate(state.close)}>
                <Megaphone className="size-4" />
                Generate draft
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function GeneratePostButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <GeneratePostModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          Generate post
        </Button>
      }
    />
  );
}
