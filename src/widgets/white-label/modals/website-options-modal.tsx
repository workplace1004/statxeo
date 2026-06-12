"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";
import type {Site} from "../../../server/db/schemas/sites";

import {Globe, ShieldCheck} from "@gravity-ui/icons";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

const TIERS = ["Basic", "Standard", "Enterprise"] as const;
const STATUSES = ["Published", "Draft", "Generating", "Review", "Archived"] as const;

export interface WebsiteOptionsModalProps {
  site: Site;
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function WebsiteOptionsModal({site, state: externalState, trigger}: WebsiteOptionsModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  
  const [tier, setTier] = useState<string>(site.tier || "Standard");
  const [status, setStatus] = useState<string>(site.status);
  const [previewUrl, setPreviewUrl] = useState<string>(site.preview || "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(close: () => void) {
    setIsSaving(true);
    try {
      const res = await fetch("/api/white-label/websites/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: site.id,
          tier,
          status,
          previewUrl: previewUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Website configurations for ${site.domain} updated`);
        close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to update configurations");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving website configurations");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="md">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Website configuration</Modal.Heading>
            <p className="text-muted text-sm">
              Manage subscription package tier, publishing status, and URL paths for {site.domain}.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <Select
              className="w-full"
              name="site-tier"
              selectedKey={tier}
              onSelectionChange={(key) => setTier(String(key))}
            >
              <Label>Package tier</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {TIERS.map((t) => (
                    <ListBox.Item key={t} id={t} textValue={t}>
                      {t}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              name="site-status"
              selectedKey={status}
              onSelectionChange={(key) => setStatus(String(key))}
            >
              <Label>Publishing status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {STATUSES.map((s) => (
                    <ListBox.Item key={s} id={s} textValue={s}>
                      {s}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField name="site-preview" value={previewUrl} onChange={setPreviewUrl}>
              <Label>Site preview / active URL</Label>
              <Input placeholder="https://..." type="text" />
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary" isDisabled={isSaving}>
              Cancel
            </Button>
            <Button isDisabled={isSaving} onPress={() => handleSave(state.close)}>
              {isSaving ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
              ) : (
                <Globe className="size-4 mr-1" />
              )}
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}
