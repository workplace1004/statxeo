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

const PAGE_TYPES = ["Landing", "Service", "Blog", "About", "Contact"] as const;

export interface GeneratePageModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function GeneratePageModal({state: externalState, trigger}: GeneratePageModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [title, setTitle] = useState("");
  const [pageType, setPageType] = useState<string>("Landing");
  const [brief, setBrief] = useState("");

  function handleGenerate(close: () => void) {
    if (!title.trim()) return;
    notifySuccess(`Page draft started for "${title.trim()}"`);
    setTitle("");
    setPageType("Landing");
    setBrief("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Generate page</Modal.Heading>
              <p className="text-muted text-sm">
                AI drafts a new page from your brief — usually ready to review in under a minute.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="page-title" value={title} onChange={setTitle}>
                <Label>Page title</Label>
                <Input placeholder="Spring AC tune-up special" />
              </TextField>
              <Select
                className="w-full"
                name="page-type"
                selectedKey={pageType}
                onSelectionChange={(key) => setPageType(String(key))}
              >
                <Label>Page type</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PAGE_TYPES.map((t) => (
                      <ListBox.Item key={t} id={t} textValue={t}>
                        {t}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField name="page-brief" value={brief} onChange={setBrief}>
                <Label>Creative brief</Label>
                <TextArea
                  className="min-h-20 resize-y"
                  placeholder="Services to highlight, tone, must-have sections…"
                />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!title.trim()} onPress={() => handleGenerate(state.close)}>
                <Sparkles className="size-4" />
                Generate page
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function NewPageButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <GeneratePageModal
      trigger={
        <Button size={size} variant="tertiary">
          <Plus className="size-4" />
          New page
        </Button>
      }
    />
  );
}
