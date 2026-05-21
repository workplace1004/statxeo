"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Calendar, CreditCard} from "@gravity-ui/icons";
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

const PAYOUT_METHODS = [
  {id: "ach", label: "ACH (US)"},
  {id: "wire", label: "International wire"},
  {id: "paypal", label: "PayPal"},
] as const;

export interface PayoutMethodModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function PayoutMethodModal({state: externalState, trigger}: PayoutMethodModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [method, setMethod] = useState("ach");
  const [accountHolder, setAccountHolder] = useState("");
  const [routing, setRouting] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  function handleSave(close: () => void) {
    if (!accountHolder.trim()) return;
    notifySuccess("Payout method saved — bank verification may take 1–2 business days");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Set payout method</Modal.Heading>
              <p className="text-muted text-sm">
                Where we send your monthly commission after the clearance window.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <Select
                className="w-full"
                name="method"
                selectedKey={method}
                onSelectionChange={(key) => setMethod(String(key))}
              >
                <Label>Payout method</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PAYOUT_METHODS.map((m) => (
                      <ListBox.Item key={m.id} id={m.id} textValue={m.label}>
                        {m.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <TextField isRequired name="holder" value={accountHolder} onChange={setAccountHolder}>
                <Label>Account holder</Label>
                <Input placeholder="Jordan Reyes" />
              </TextField>
              <div className="grid grid-cols-2 gap-3">
                <TextField name="routing" value={routing} onChange={setRouting}>
                  <Label className="sr-only">Routing number</Label>
                  <Input placeholder="Routing number" />
                </TextField>
                <TextField name="account" value={accountNumber} onChange={setAccountNumber}>
                  <Label className="sr-only">Account number</Label>
                  <Input placeholder="Account number" />
                </TextField>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!accountHolder.trim()} onPress={() => handleSave(state.close)}>
                <CreditCard className="size-4" />
                Save method
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function PayoutMethodButton({
  label = "Set payout method",
  size = "sm",
}: {
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <PayoutMethodModal
      trigger={
        <Button size={size} variant="tertiary">
          <Calendar className="size-4" />
          {label}
        </Button>
      }
    />
  );
}
