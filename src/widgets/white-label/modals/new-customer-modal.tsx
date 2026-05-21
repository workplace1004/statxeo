"use client";

import type {CustomerPlan, CustomerStatus} from "../../../server/db/schemas/customers";
import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {PersonPlus} from "@gravity-ui/icons";
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

import {
  CUSTOMER_PLANS,
  CUSTOMER_STATUSES,
} from "../../../server/db/schemas/customers";
import {notifySuccess} from "../../../lib/ui/white-label-notify";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface NewCustomerModalProps {
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function NewCustomerModal({state: externalState, trigger}: NewCustomerModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [plan, setPlan] = useState<CustomerPlan>("Growth");
  const [status, setStatus] = useState<CustomerStatus>("Onboarding");

  function reset() {
    setName("");
    setContactName("");
    setContactEmail("");
    setIndustry("");
    setCity("");
    setPlan("Growth");
    setStatus("Onboarding");
  }

  function handleCreate(close: () => void) {
    if (!name.trim() || !contactEmail.trim()) return;
    notifySuccess(`${name.trim()} added — onboarding will start automatically`);
    reset();
    close();
  }

  return (
    <ModalShell state={state} trigger={trigger}>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>New customer</Modal.Heading>
              <p className="text-muted text-sm">
                Create a customer record and kick off the onboarding wizard.
              </p>
            </Modal.Header>
            <Modal.Body className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TextField className="md:col-span-2" isRequired name="customer-name" value={name} onChange={setName}>
                <Label>Business name</Label>
                <Input placeholder="Customer business name" />
              </TextField>
              <TextField name="contact-name" value={contactName} onChange={setContactName}>
                <Label>Primary contact</Label>
                <Input placeholder="Jane Smith" />
              </TextField>
              <TextField isRequired name="contact-email" value={contactEmail} onChange={setContactEmail}>
                <Label>Contact email</Label>
                <Input placeholder="owner@business.com" type="email" />
              </TextField>
              <TextField name="industry" value={industry} onChange={setIndustry}>
                <Label>Industry</Label>
                <Input placeholder="HVAC, Dental, Roofing…" />
              </TextField>
              <TextField name="city" value={city} onChange={setCity}>
                <Label>City</Label>
                <Input placeholder="Austin, TX" />
              </TextField>
              <Select
                className="w-full"
                name="plan"
                selectedKey={plan}
                onSelectionChange={(key) => setPlan(key as CustomerPlan)}
              >
                <Label>Plan</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {CUSTOMER_PLANS.map((p) => (
                      <ListBox.Item key={p} id={p} textValue={p}>
                        {p}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Select
                className="w-full"
                name="status"
                selectedKey={status}
                onSelectionChange={(key) => setStatus(key as CustomerStatus)}
              >
                <Label>Status</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {CUSTOMER_STATUSES.map((s) => (
                      <ListBox.Item key={s} id={s} textValue={s}>
                        {s}
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
              <Button
                isDisabled={!name.trim() || !contactEmail.trim()}
                onPress={() => handleCreate(state.close)}
              >
                <PersonPlus className="size-4" />
                Create customer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </ModalShell>
  );
}

export function NewCustomerButton({size = "sm"}: {size?: "sm" | "md"}) {
  return (
    <NewCustomerModal
      trigger={
        <Button size={size}>
          <PersonPlus className="size-4" />
          New customer
        </Button>
      }
    />
  );
}
