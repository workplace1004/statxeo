"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Envelope, Plus} from "@gravity-ui/icons";
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

import {CUSTOMER_TEAM_ROLES} from "../../../server/db/schemas/customer-team";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface InviteTeamMemberModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function InviteTeamMemberModal({state: externalState, trigger}: InviteTeamMemberModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("Editor");

  function handleInvite(close: () => void) {
    if (!email.trim()) return;
    notifySuccess(`Invite sent to ${email.trim()}`);
    setName("");
    setEmail("");
    setRole("Editor");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Invite teammate</Modal.Heading>
              <p className="text-muted text-sm">
                Teammates get access to your StatXEO workspace based on their role.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField name="member-name" value={name} onChange={setName}>
                <Label>Full name</Label>
                <Input placeholder="Alex Carter" />
              </TextField>
              <TextField isRequired name="member-email" value={email} onChange={setEmail}>
                <Label>Work email</Label>
                <Input placeholder="alex@yourbusiness.com" type="email" />
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
                    {CUSTOMER_TEAM_ROLES.map((r) => (
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
              <Button isDisabled={!email.trim()} onPress={() => handleInvite(state.close)}>
                <Envelope className="size-4" />
                Send invite
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
          <Plus className="size-4" />
          Invite member
        </Button>
      }
    />
  );
}
