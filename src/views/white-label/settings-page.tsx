"use client";

import type {ReactNode} from "react";
import {useState} from "react";

import {Key, Plus, ShieldCheck} from "@gravity-ui/icons";
import {
  Button,
  Card,
  Checkbox,
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

import type {Organization} from "../../server/db/schemas/organizations";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

const TIMEZONES = [
  {id: "et", label: "Eastern Time (US)"},
  {id: "ct", label: "Central Time (US)"},
  {id: "mt", label: "Mountain Time (US)"},
  {id: "pt", label: "Pacific Time (US)"},
] as const;

export interface WhiteLabelSettingsPageProps {
  organization: Organization | null;
}

export function WhiteLabelSettingsPage({organization}: WhiteLabelSettingsPageProps) {
  const [isSaving, setIsSaving] = useState(false);

  // General settings state
  const [agencyName, setAgencyName] = useState(organization?.name ?? "");
  const [timezone, setTimezone] = useState(organization?.timezone ?? "et");
  const [defaultAiTone, setDefaultAiTone] = useState(organization?.defaultAiTone ?? "");
  const [showPoweredByBadge, setShowPoweredByBadge] = useState(organization?.showPoweredByBadge ?? true);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/white-label/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agencyName,
          timezone,
          defaultAiTone,
          showPoweredByBadge,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess("Agency settings saved");
      } else {
        alert(data.error?.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      alert("An unexpected error occurred while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Agency-wide defaults that apply to every customer workspace."
        showPeriod={false}
        title="Settings"
        trailing={
          <Button
            size="sm"
            isDisabled={isSaving || !agencyName.trim()}
            onPress={handleSaveSettings}
          >
            {isSaving ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <Tabs defaultSelectedKey="general">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Settings tabs">
            <Tabs.Tab id="general">
              General
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="notifications">
              Notifications
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="security">
              Security
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="api">
              API keys
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="general">
          <form className="flex flex-col gap-1 pt-4" onSubmit={(e) => e.preventDefault()}>
            <SettingsRow
              description="Shown on every customer-facing surface."
              label="Agency name"
            >
              <TextField name="agency-name" value={agencyName} onChange={setAgencyName}>
                <Label className="sr-only">Agency name</Label>
                <Input fullWidth placeholder="Your agency" />
              </TextField>
            </SettingsRow>
            <Separator />
            <SettingsRow
              description="Default timezone for reports and scheduling."
              label="Timezone"
            >
              <Select
                name="tz"
                selectedKey={timezone}
                onSelectionChange={(key) => setTimezone(String(key))}
              >
                <Label className="sr-only">Timezone</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {TIMEZONES.map((t) => (
                      <ListBox.Item key={t.id} id={t.id} textValue={t.label}>
                        {t.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </SettingsRow>
            <Separator />
            <SettingsRow description="Default tone for AI-generated content." label="Default AI tone">
              <TextField name="ai-tone" value={defaultAiTone} onChange={setDefaultAiTone}>
                <Label className="sr-only">Default AI tone</Label>
                <TextArea
                  className="min-h-24"
                  placeholder="Friendly, plain-spoken, locally specific."
                />
              </TextField>
            </SettingsRow>
            <Separator />
            <SettingsRow
              description="Quietly publish a powered-by badge on customer sites."
              label="Powered-by badge"
            >
              <Switch
                aria-label="Show powered-by badge on customer sites"
                isSelected={showPoweredByBadge}
                onChange={setShowPoweredByBadge}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Content>
                  <Label className="text-sm">Show on customer sites</Label>
                </Switch.Content>
              </Switch>
            </SettingsRow>
          </form>
        </Tabs.Panel>

        <Tabs.Panel id="notifications">
          <div className="flex flex-col gap-3 pt-4">
            {[
              {desc: "Email when a customer is past due on payment.", id: "n-billing", label: "Billing alerts"},
              {desc: "Slack ping when a tracked keyword changes by more than 5 spots.", id: "n-rank", label: "Rank movement"},
              {desc: "Daily digest of pending approvals across customers.", id: "n-approvals", label: "Approvals digest"},
              {desc: "Email when an AI agent encounters a content guardrail.", id: "n-guardrail", label: "AI guardrail triggered"},
            ].map((item) => (
              <Card key={item.id} className="rounded-2xl">
                <Card.Content className="flex items-center justify-between gap-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{item.label}</span>
                    <span className="text-muted text-xs">{item.desc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox defaultSelected id={`${item.id}-email`}>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label htmlFor={`${item.id}-email`}>Email</Label>
                      </Checkbox.Content>
                    </Checkbox>
                    <Checkbox id={`${item.id}-slack`}>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label htmlFor={`${item.id}-slack`}>Slack</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="security">
          <div className="flex flex-col gap-3 pt-4">
            <Card className="rounded-2xl">
              <Card.Header>
                <div className="flex items-center gap-2">
                  <span className="bg-success-soft text-success flex size-8 items-center justify-center rounded-xl">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <Card.Title className="text-base">Two-factor authentication</Card.Title>
                    <Card.Description>Required for owner and admin roles.</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Footer>
                <Chip color="success" size="sm" variant="soft">
                  Enforced
                </Chip>
              </Card.Footer>
            </Card>
            <Card className="rounded-2xl">
              <Card.Header>
                <Card.Title className="text-base">Single sign-on (SSO)</Card.Title>
                <Card.Description>SAML 2.0 — available on Enterprise.</Card.Description>
              </Card.Header>
              <Card.Footer className="flex items-center justify-between">
                <Chip color="warning" size="sm" variant="soft">
                  Not configured
                </Chip>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => notifyInfo("SSO setup — contact partner support for Enterprise")}
                >
                  Set up SSO
                </Button>
              </Card.Footer>
            </Card>
            <Card className="rounded-2xl">
              <Card.Header>
                <Card.Title className="text-base">Session lifetime</Card.Title>
                <Card.Description>
                  Force re-authentication after this period of inactivity.
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex items-center gap-2">
                <Select className="w-[180px]" defaultValue="8h">
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="1h" textValue="1 hour">
                        1 hour
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="8h" textValue="8 hours">
                        8 hours
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="24h" textValue="24 hours">
                        24 hours
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="7d" textValue="7 days">
                        7 days
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="api">
          <div className="flex flex-col gap-3 pt-4">
            <Card className="rounded-2xl">
              <Card.Header className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl">
                    <Key className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <Card.Title className="text-base">API keys</Card.Title>
                    <Card.Description>
                      Authenticate programmatic access to the StatXEO API.
                    </Card.Description>
                  </div>
                </div>
                <Button
                  size="sm"
                  onPress={() => notifySuccess("API key created — copy it from the dialog")}
                >
                  <Plus className="size-4" />
                  New key
                </Button>
              </Card.Header>
              <Card.Content>
                <p className="text-muted py-6 text-center text-sm">
                  No API keys created yet. Generate one to start integrating.
                </p>
              </Card.Content>
            </Card>
          </div>
        </Tabs.Panel>
      </Tabs>
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
    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-10">
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <p className="text-muted text-xs leading-snug">{description}</p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
