"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Envelope, PersonPlus} from "@gravity-ui/icons";
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

const ROLES = ["Owner", "Admin", "Account Manager", "SEO Specialist", "Designer", "Viewer"] as const;

export interface InviteTeamMemberModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function InviteTeamMemberModal({state: externalState, trigger}: InviteTeamMemberModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("Account Manager");
  const [isSending, setIsSending] = useState(false);

  async function handleInvite(close: () => void) {
    if (!email.trim() || !name.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/white-label/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Invite sent to ${email.trim()}`);
        setName("");
        setEmail("");
        setRole("Account Manager");
        close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to send invite");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while sending invite");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="md">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Invite teammate</Modal.Heading>
            <p className="text-muted text-sm">
              Teammates get access to the agency dashboard based on their role.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <TextField isRequired name="member-name" value={name} onChange={setName}>
              <Label>Full name</Label>
              <Input placeholder="Alex Carter" />
            </TextField>
            <TextField isRequired name="member-email" value={email} onChange={setEmail}>
              <Label>Work email</Label>
              <Input placeholder="alex@agency.com" type="email" />
            </TextField>
            <Select
              className="w-full"
              name="member-role"
              selectedKey={role}
              onSelectionChange={(key) => setRole(String(key))}
            >
              <Label>Role</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ROLES.map((r) => (
                    <ListBox.Item key={r} id={r} textValue={r}>
                      {r}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button isDisabled={!email.trim() || !name.trim() || isSending} onPress={() => handleInvite(state.close)}>
              {isSending ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
              ) : (
                <Envelope className="size-4 mr-1" />
              )}
              {isSending ? "Sending…" : "Send invite"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}

export function InviteTeamMemberButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <InviteTeamMemberModal
      trigger={
        <Button size={size}>
          <PersonPlus className="size-4" />
          Invite member
        </Button>
      }
    />
  );
}
