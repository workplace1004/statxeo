"use client";

import type {ReactNode} from "react";

import {CircleCheck, CreditCard} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Switch,
  Tabs,
  TextArea,
  TextField,
} from "@heroui/react";

import {notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../../widgets/empty-state";

const PAYOUT_METHODS = [
  {id: "ach", label: "ACH (US)"},
  {id: "wire", label: "International wire"},
  {id: "paypal", label: "PayPal"},
] as const;

const COUNTRIES = [
  {id: "us", label: "United States"},
  {id: "ca", label: "Canada"},
  {id: "uk", label: "United Kingdom"},
  {id: "au", label: "Australia"},
] as const;

export function AffiliateSettingsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">
        Manage your affiliate profile, payout method, tax docs, and notifications.
      </p>

      <Tabs defaultSelectedKey="payout">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Settings tabs">
            <Tabs.Tab id="payout">
              Payout
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="tax">
              Tax
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="profile">
              Profile
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="notifications">
              Notifications
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-6" id="payout">
          <PayoutSettings />
        </Tabs.Panel>
        <Tabs.Panel className="pt-6" id="tax">
          <TaxSettings />
        </Tabs.Panel>
        <Tabs.Panel className="pt-6" id="profile">
          <ProfileSettings />
        </Tabs.Panel>
        <Tabs.Panel className="pt-6" id="notifications">
          <NotificationSettings />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function PayoutSettings() {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        notifySuccess("Payout settings saved");
      }}
    >
      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center gap-3">
          <div className="bg-success-soft text-success flex size-10 items-center justify-center rounded-xl">
            <CreditCard className="size-5" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Card.Title className="text-base">Payout method</Card.Title>
            <Card.Description>
              How you&apos;d like StatXEO to send your monthly commission.
            </Card.Description>
          </div>
          <Chip color="default" size="md" variant="soft">
            <CircleCheck className="size-4" />
            Not set up
          </Chip>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <SettingsRow description="Currency you'd like to receive payments in." label="Currency">
            <Select defaultValue="usd" name="payout-currency">
              <Label className="sr-only">Currency</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="usd" textValue="USD - US Dollar">
                    USD - US Dollar
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="cad" textValue="CAD - Canadian Dollar">
                    CAD - Canadian Dollar
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="eur" textValue="EUR - Euro">
                    EUR - Euro
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </SettingsRow>
          <Separator />
          <SettingsRow description="The method we'll use to send your payouts." label="Payout method">
            <Select defaultValue="ach" name="payout-method">
              <Label className="sr-only">Payout method</Label>
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
          </SettingsRow>
          <Separator />
          <SettingsRow description="Bank account where deposits will land." label="Bank account">
            <TextField name="account-holder">
              <Label className="sr-only">Account holder</Label>
              <Input fullWidth placeholder="Account holder name" />
            </TextField>
            <div className="grid grid-cols-2 gap-3">
              <TextField name="routing">
                <Label className="sr-only">Routing number</Label>
                <Input fullWidth placeholder="Routing number" />
              </TextField>
              <TextField name="account-number">
                <Label className="sr-only">Account number</Label>
                <Input fullWidth placeholder="Account number" />
              </TextField>
            </div>
          </SettingsRow>
          <Separator />
          <SettingsRow
            description="When your monthly commission falls below this threshold, we'll roll it into the next payout cycle."
            label="Payout threshold"
          >
            <TextField name="threshold">
              <Label className="sr-only">Payout threshold</Label>
              <Input fullWidth placeholder="$100" />
            </TextField>
          </SettingsRow>
        </Card.Content>
        <Card.Footer className="justify-end gap-2">
          <Button type="reset" variant="ghost">
            Reset
          </Button>
          <Button type="submit">Save payout settings</Button>
        </Card.Footer>
      </Card>
    </form>
  );
}

function TaxSettings() {
  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Tax documents</Card.Title>
        <Card.Description>
          Your filed forms and tax statements. Statements are generated annually.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <EmptyState
          body="W-9, W-8BEN, and your annual 1099/1042 statements will appear here once we have your tax info on file."
          cta={{
            label: "Upload W-9",
            onPress: () => notifySuccess("Tax document upload will be available once your account is verified"),
          }}
          title="No tax documents yet"
        />
      </Card.Content>
    </Card>
  );
}

function ProfileSettings() {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        notifySuccess("Profile saved");
      }}
    >
      <Card className="rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Affiliate profile</Card.Title>
          <Card.Description>How you appear on co-branded materials.</Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <Avatar.Fallback>?</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-muted text-xs">No avatar uploaded yet</span>
              <Button
                className="self-start"
                size="sm"
                variant="tertiary"
                onPress={() => notifySuccess("Avatar upload opens in a new window when storage is connected")}
              >
                Upload avatar
              </Button>
            </div>
          </div>
          <Separator />
          <SettingsRow description="Public name shown on landing pages." label="Display name">
            <TextField name="display-name">
              <Label className="sr-only">Display name</Label>
              <Input fullWidth placeholder="Your name" />
            </TextField>
          </SettingsRow>
          <Separator />
          <SettingsRow description="Where you're based — used for time zone defaults." label="Country">
            <Select defaultValue="us" name="country">
              <Label className="sr-only">Country</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {COUNTRIES.map((c) => (
                    <ListBox.Item key={c.id} id={c.id} textValue={c.label}>
                      {c.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </SettingsRow>
          <Separator />
          <SettingsRow
            description="Short bio for your partner page. Max 240 characters."
            label="Bio"
          >
            <TextField name="bio">
              <Label className="sr-only">Bio</Label>
              <TextArea
                fullWidth
                className="min-h-24 resize-y"
                maxLength={240}
                placeholder="Tell customers about you"
              />
            </TextField>
          </SettingsRow>
        </Card.Content>
        <Card.Footer className="justify-end gap-2">
          <Button type="reset" variant="ghost">
            Reset
          </Button>
          <Button type="submit">Save profile</Button>
        </Card.Footer>
      </Card>
    </form>
  );
}

function NotificationSettings() {
  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Notification preferences</Card.Title>
        <Card.Description>
          Pick what we email and SMS you about. Required compliance alerts can&apos;t be turned off.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <NotificationRow
          defaultOn
          description="A new sign-up converts on one of your referral links."
          title="New conversions"
        />
        <Separator />
        <NotificationRow
          defaultOn
          description="A scheduled payout has been initiated to your bank."
          title="Payout sent"
        />
        <Separator />
        <NotificationRow
          defaultOn
          description="A commission has been clawed back due to refund or churn."
          title="Clawback events"
        />
        <Separator />
        <NotificationRow
          description="Your weekly performance digest, delivered Monday morning."
          title="Weekly digest"
        />
        <Separator />
        <NotificationRow
          description="Marketing tips, vertical playbooks, and partner-only beta invites."
          title="Marketing & beta updates"
        />
      </Card.Content>
    </Card>
  );
}

function NotificationRow({
  defaultOn,
  description,
  title,
}: {
  defaultOn?: boolean;
  description: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{title}</span>
        <span className="text-muted text-xs">{description}</span>
      </div>
      <Switch aria-label={title} defaultSelected={defaultOn}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}

interface SettingsRowProps {
  description: string;
  label: string;
  children: ReactNode;
}

function SettingsRow({children, description, label}: SettingsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-10">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <p className="text-muted text-xs leading-snug">{description}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
