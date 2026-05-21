"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Plus, Sparkles} from "@gravity-ui/icons";
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

const PLATFORMS = ["Instagram", "Facebook", "Google", "TikTok", "LinkedIn", "X"] as const;

export interface GeneratePostModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function GeneratePostModal({state: externalState, trigger}: GeneratePostModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<string>("Instagram");

  function handleGenerate(close: () => void) {
    if (!brief.trim()) return;
    notifySuccess("Draft post queued — check Social Media in a moment");
    setBrief("");
    setPlatform("Instagram");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Generate posts</Modal.Heading>
              <p className="text-muted text-sm">
                Describe what you want — AI drafts copy in your brand voice.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
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
                <Sparkles className="size-4" />
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
          <Sparkles className="size-4" />
          Generate posts
        </Button>
      }
    />
  );
}

export function NewPostButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <GeneratePostModal
      trigger={
        <Button size={size} variant="tertiary">
          <Plus className="size-4" />
          New post
        </Button>
      }
    />
  );
}
