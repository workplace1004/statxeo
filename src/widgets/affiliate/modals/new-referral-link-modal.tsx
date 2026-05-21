"use client";

import type {LinkChannel} from "../../../server/db/schemas/referral-links";
import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Plus} from "@gravity-ui/icons";
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

import {copyToClipboard} from "../../../lib/ui/copy-to-clipboard";
import {LINK_CHANNELS} from "../../../server/db/schemas/referral-links";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

const CHANNEL_LABEL: Record<LinkChannel, string> = {
  ads: "Paid Ads",
  blog: "Blog",
  email: "Email",
  qr: "QR Code",
  social: "Social",
  widget: "Widget",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function buildReferralUrl(slug: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://statxeo.com";

  return `${origin}/r/${slug || "partner"}`;
}

export interface NewReferralLinkModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
  onCreated?: (payload: {campaign: string; url: string; channel: LinkChannel}) => void;
}

export function NewReferralLinkModal({
  onCreated,
  state: externalState,
  trigger,
}: NewReferralLinkModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [campaign, setCampaign] = useState("");
  const [channel, setChannel] = useState<LinkChannel>("email");
  const [destination, setDestination] = useState("/");

  function reset() {
    setCampaign("");
    setChannel("email");
    setDestination("/");
  }

  function handleCreate(close: () => void) {
    if (!campaign.trim()) return;
    const slug = slugify(campaign);
    const url = buildReferralUrl(slug);

    onCreated?.({campaign: campaign.trim(), channel, url});
    notifySuccess(`Link created for "${campaign.trim()}"`);
    copyToClipboard(url, "Referral link copied");
    reset();
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>New referral link</Modal.Heading>
              <p className="text-muted text-sm">
                Name your campaign and pick a channel — we&apos;ll generate a tracked URL.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="campaign" value={campaign} onChange={setCampaign}>
                <Label>Campaign name</Label>
                <Input placeholder="Spring newsletter" />
              </TextField>
              <Select
                className="w-full"
                name="channel"
                selectedKey={channel}
                onSelectionChange={(key) => setChannel(key as LinkChannel)}
              >
                <Label>Channel</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {LINK_CHANNELS.map((ch) => (
                      <ListBox.Item key={ch} id={ch} textValue={CHANNEL_LABEL[ch]}>
                        {CHANNEL_LABEL[ch]}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField name="destination" value={destination} onChange={setDestination}>
                <Label>Destination path</Label>
                <Input placeholder="/" />
              </TextField>
              {campaign.trim() ? (
                <p className="text-muted text-xs">
                  Preview:{" "}
                  <code className="text-foreground">{buildReferralUrl(slugify(campaign))}</code>
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!campaign.trim()} onPress={() => handleCreate(state.close)}>
                <Plus className="size-4" />
                Create link
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function NewReferralLinkButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <NewReferralLinkModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          New link
        </Button>
      }
    />
  );
}
