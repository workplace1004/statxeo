"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {FileText, Plus} from "@gravity-ui/icons";
import {Button, Input, Label, Modal, TextField, useOverlayState} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface NewInvoiceModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function NewInvoiceModal({state: externalState, trigger}: NewInvoiceModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");

  function handleCreate(close: () => void) {
    if (!customer.trim() || !amount.trim()) return;
    notifySuccess(`Invoice drafted for ${customer.trim()}`);
    setCustomer("");
    setAmount("");
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>New invoice</Modal.Heading>
              <p className="text-muted text-sm">Create a draft invoice for a customer subscription or add-on.</p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired name="invoice-customer" value={customer} onChange={setCustomer}>
                <Label>Customer</Label>
                <Input placeholder="Customer name" />
              </TextField>
              <TextField isRequired name="invoice-amount" value={amount} onChange={setAmount}>
                <Label>Amount (USD)</Label>
                <Input inputMode="decimal" placeholder="499" type="number" />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button
                isDisabled={!customer.trim() || !amount.trim()}
                onPress={() => handleCreate(state.close)}
              >
                <FileText className="size-4" />
                Create invoice
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function NewInvoiceButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <NewInvoiceModal
      trigger={
        <Button size={size}>
          <Plus className="size-4" />
          New invoice
        </Button>
      }
    />
  );
}
