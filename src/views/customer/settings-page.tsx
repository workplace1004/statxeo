"use client";

import type {ReactNode} from "react";
import type {BusinessProfile} from "../../server/db/schemas/business-profile";
import type {CustomerTeamMember} from "../../server/db/schemas/customer-team";
import type {Domain} from "../../server/db/schemas/domains";
import type {Integration} from "../../server/db/schemas/integrations";
import type {NotificationPreference} from "../../server/db/schemas/notification-preferences";

import {Globe, Persons, Plus, Puzzle} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Separator,
  Switch,
  Tabs,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {CUSTOMER_TEAM_ROLE_COLORS} from "../../server/db/schemas/customer-team";
import {INTEGRATION_STATUS_COLORS} from "../../server/db/schemas/integrations";
import {AddDomainButton, AddDomainModal} from "../../widgets/customer/modals/add-domain-modal";
import {
  InviteTeamMemberButton,
  InviteTeamMemberModal,
} from "../../widgets/customer/modals/invite-team-member-modal";
import {EmptyState} from "../../widgets/empty-state";

export interface CustomerSettingsPageProps {
  businessProfile: BusinessProfile | null;
  domains: Domain[];
  notificationPrefs: NotificationPreference[];
  integrations: Integration[];
  team: CustomerTeamMember[];
}

export function CustomerSettingsPage({
  businessProfile,
  domains,
  integrations,
  notificationPrefs,
  team,
}: CustomerSettingsPageProps) {
  const inviteState = useOverlayState();
  const domainState = useOverlayState();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">
        Manage your business profile, team, integrations, and account preferences.
      </p>

      <Tabs defaultSelectedKey="business">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Settings tabs">
            <Tabs.Tab id="business">
              Business
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="team">
              Team
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="integrations">
              Integrations
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="domains">
              Domains
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="notifications">
              Notifications
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="compliance">
              Compliance
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="business">
          <form
            className="flex flex-col gap-4 pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              notifySuccess("Business profile saved");
            }}
          >
            <SettingsRow
              description="Customers see this name on your website, reviews, and Google Business profile."
              label="Business name"
            >
              <TextField defaultValue={businessProfile?.name ?? ""} name="biz-name">
                <Label className="sr-only">Business name</Label>
                <Input fullWidth placeholder="Acme Plumbing" />
              </TextField>
            </SettingsRow>
            <Separator />
            <SettingsRow
              description="A short tagline used in titles, meta, and AI-generated content."
              label="Tagline"
            >
              <TextField defaultValue={businessProfile?.tagline ?? ""} name="biz-tagline">
                <Label className="sr-only">Tagline</Label>
                <TextArea
                  className="min-h-20 resize-y"
                  fullWidth
                  maxLength={160}
                  placeholder="What your business is known for."
                />
              </TextField>
            </SettingsRow>
            <Separator />
            <SettingsRow
              description="Address powers your Google Business listing and local SEO."
              label="Address"
            >
              <TextField defaultValue={businessProfile?.address?.street ?? ""} name="biz-street">
                <Label className="sr-only">Street</Label>
                <Input fullWidth placeholder="Street address" />
              </TextField>
              <div className="grid grid-cols-[1fr_120px_140px] gap-3">
                <TextField defaultValue={businessProfile?.address?.city ?? ""} name="biz-city">
                  <Label className="sr-only">City</Label>
                  <Input fullWidth placeholder="City" />
                </TextField>
                <TextField defaultValue={businessProfile?.address?.state ?? ""} name="biz-state">
                  <Label className="sr-only">State</Label>
                  <Input fullWidth placeholder="State" />
                </TextField>
                <TextField
                  defaultValue={businessProfile?.address?.postalCode ?? ""}
                  name="biz-zip"
                >
                  <Label className="sr-only">ZIP</Label>
                  <Input fullWidth placeholder="ZIP" />
                </TextField>
              </div>
            </SettingsRow>
            <Separator />
            <SettingsRow
              description="Customers in these areas will see hyper-local content."
              label="Service areas"
            >
              <div className="flex flex-wrap gap-2">
                {(businessProfile?.serviceAreas ?? []).map((area) => (
                  <Chip key={area} size="sm" variant="soft">
                    {area}
                  </Chip>
                ))}
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => notifyInfo("Service area editor opens when locations are connected")}
                >
                  <Plus className="size-4" />
                  Add area
                </Button>
              </div>
            </SettingsRow>
            <Separator />
            <SettingsRow description="Your published business hours." label="Hours">
              <TextField defaultValue={businessProfile?.hours ?? ""} name="biz-hours">
                <Label className="sr-only">Hours</Label>
                <Input fullWidth placeholder="Mon–Fri, 9am – 5pm" />
              </TextField>
            </SettingsRow>
            <footer className="flex items-center justify-end gap-2 pt-2">
              <Button type="reset" variant="tertiary">
                Reset
              </Button>
              <Button type="submit">Save changes</Button>
            </footer>
          </form>
        </Tabs.Panel>

        <Tabs.Panel id="team">
          <Card className="mt-4 rounded-2xl">
            <Card.Header className="flex-row items-center justify-between">
              <div className="flex flex-col">
                <Card.Title className="text-base">Team members</Card.Title>
                <Card.Description>Manage who can access this account.</Card.Description>
              </div>
              <InviteTeamMemberButton />
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              {team.length === 0 ? (
                <EmptyState
                  body="Give a manager or staff member access to your StatXEO workspace."
                  cta={{label: "Invite teammate", onPress: inviteState.open}}
                  icon={Persons}
                  title="Invite your first teammate"
                />
              ) : (
                team.map((member) => (
                  <div
                    key={member.id}
                    className="hover:bg-content2 flex items-center justify-between gap-3 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <Avatar.Image alt={member.name} src={member.avatar} />
                        <Avatar.Fallback>
                          {member.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-foreground text-sm font-medium">{member.name}</span>
                        <span className="text-muted text-xs">{member.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted hidden text-xs sm:inline">
                        {member.lastActive}
                      </span>
                      <Chip color={CUSTOMER_TEAM_ROLE_COLORS[member.role]} size="sm" variant="soft">
                        {member.role}
                      </Chip>
                    </div>
                  </div>
                ))
              )}
            </Card.Content>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel id="integrations">
          {integrations.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                body="Connect Google Business, Stripe, and other tools to unlock the full picture."
                cta={{
                  label: "Browse integrations",
                  onPress: () => notifyInfo("Integration marketplace opens from Settings"),
                }}
                icon={Puzzle}
                title="No integrations connected"
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((int) => (
                <Card key={int.id} className="rounded-2xl">
                  <Card.Header>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-10 items-center justify-center rounded-xl text-base font-semibold ${int.accent}`}
                        >
                          {int.initial}
                        </div>
                        <div className="flex flex-col">
                          <Card.Title className="text-sm">{int.name}</Card.Title>
                          <span className="text-muted text-xs">{int.category}</span>
                        </div>
                      </div>
                      <Chip color={INTEGRATION_STATUS_COLORS[int.status]} size="sm" variant="soft">
                        {int.status}
                      </Chip>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-muted text-xs leading-snug">{int.description}</p>
                    {int.connectedAccount ? (
                      <span className="text-muted mt-2 block text-xs">
                        Connected · <span className="text-foreground">{int.connectedAccount}</span>
                      </span>
                    ) : null}
                  </Card.Content>
                  <Card.Footer className="justify-end">
                    <Button
                      isDisabled={int.status === "Coming soon"}
                      size="sm"
                      variant="tertiary"
                      onPress={() => {
                        if (int.status === "Connected") {
                          notifyInfo(`Managing ${int.name}`);
                        } else if (int.status === "Coming soon") {
                          notifySuccess(`We'll notify you when ${int.name} is available`);
                        } else {
                          notifySuccess(`${int.name} connected`);
                        }
                      }}
                    >
                      {int.status === "Connected"
                        ? "Manage"
                        : int.status === "Coming soon"
                          ? "Notify me"
                          : "Connect"}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="domains">
          <Card className="mt-4 rounded-2xl">
            <Card.Header className="flex-row items-center justify-between">
              <div className="flex flex-col">
                <Card.Title className="text-base">Domains</Card.Title>
                <Card.Description>
                  Domains pointed at your StatXEO-hosted website.
                </Card.Description>
              </div>
              <AddDomainButton />
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              {domains.length === 0 ? (
                <EmptyState
                  body="Point a custom domain at your StatXEO-hosted site to make it your own."
                  cta={{label: "Add domain", onPress: domainState.open}}
                  icon={Globe}
                  title="No domains yet"
                />
              ) : (
                domains.map((d) => (
                  <div
                    key={d.id}
                    className="hover:bg-content2 flex items-center justify-between gap-3 rounded-xl p-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-medium tabular-nums">
                          {d.domain}
                        </span>
                        {d.isPrimary ? (
                          <Chip color="success" size="sm" variant="soft">
                            Primary
                          </Chip>
                        ) : null}
                      </div>
                      <span className="text-muted text-xs">
                        SSL · {d.sslStatus} · Expires {d.expiresAt}
                      </span>
                    </div>
                    <Chip
                      color={
                        d.status === "Active"
                          ? "success"
                          : d.status === "Pending DNS"
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                      variant="soft"
                    >
                      {d.status}
                    </Chip>
                  </div>
                ))
              )}
            </Card.Content>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel id="notifications">
          <Card className="mt-4 rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">Notification preferences</Card.Title>
              <Card.Description>How and when StatXEO contacts you.</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-1">
              {notificationPrefs.length === 0 ? (
                <EmptyState
                  body="Notification settings appear here once your account is fully set up."
                  title="No preferences yet"
                />
              ) : (
                <>
                  <div className="text-muted grid grid-cols-[1fr_auto_auto] gap-6 px-3 pb-2 text-xs">
                    <span>Event</span>
                    <span className="w-16 text-center">Email</span>
                    <span className="w-16 text-center">SMS</span>
                  </div>
                  {notificationPrefs.map((pref) => (
                    <div
                      key={pref.id}
                      className="hover:bg-content2 grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded-xl p-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-foreground text-sm font-medium">{pref.label}</span>
                        <span className="text-muted text-xs">{pref.description}</span>
                      </div>
                      <div className="flex w-16 justify-center">
                        <Switch aria-label={`${pref.label} email notifications`} defaultSelected={pref.email}>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </div>
                      <div className="flex w-16 justify-center">
                        <Switch aria-label={`${pref.label} SMS notifications`} defaultSelected={pref.sms}>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel id="compliance">
          <Card className="mt-4 rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">Compliance preferences</Card.Title>
              <Card.Description>
                How AI handles regulated content, recording disclosures, and data retention.
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              {[
                {
                  desc: "Required in some jurisdictions for inbound recording — included on every greeting.",
                  enabled: true,
                  label: "Two-party consent disclosure on all calls",
                },
                {
                  desc: "Auto-delete call recordings older than 90 days.",
                  enabled: true,
                  label: "90-day call recording retention",
                },
                {
                  desc: "Always include unsubscribe in marketing SMS — required by TCPA.",
                  enabled: true,
                  label: "TCPA-compliant unsubscribe in marketing texts",
                },
                {
                  desc: "Auto-redact phone numbers and emails from AI training data.",
                  enabled: true,
                  label: "Redact PII from AI training data",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="hover:bg-content2 flex items-center justify-between gap-3 rounded-xl p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{item.label}</span>
                    <span className="text-muted text-xs">{item.desc}</span>
                  </div>
                  <Switch aria-label={item.label} defaultSelected={item.enabled}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
              ))}
            </Card.Content>
          </Card>
        </Tabs.Panel>
      </Tabs>
      <InviteTeamMemberModal state={inviteState} />
      <AddDomainModal state={domainState} />
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
