"use client";

import type {
  OnboardingCustomer,
  OnboardingStep,
  ServiceOption,
} from "../../server/db/schemas/onboarding";

import {
  ArrowRight,
  Check,
  Display,
  FileText,
  Headphones,
  Magnifier,
  Megaphone,
  PlugConnection,
  Rocket,
} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import {NumberValue, Stepper} from "@heroui-pro/react";
import {RouteButton} from "../../components/route-button";
import {useState} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/page-toolbar";

const SERVICE_ICON = {
  automation: Rocket,
  calls: Headphones,
  seo: Magnifier,
  site: Display,
  social: Megaphone,
} as const;

export interface WhiteLabelOnboardingPageProps {
  steps: OnboardingStep[];
  queue: OnboardingCustomer[];
  services: ServiceOption[];
}

export function WhiteLabelOnboardingPage({
  queue,
  services,
  steps,
}: WhiteLabelOnboardingPageProps) {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const hasSteps = steps.length > 0;
  const activeStep = hasSteps ? steps[Math.min(step, steps.length - 1)] : undefined;
  const isLastStep = hasSteps && step >= steps.length - 1;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Spin up a new white-label customer in minutes — fully branded, fully AI-configured."
        showPeriod={false}
        title="Onboard a new customer"
        trailing={
          <Button size="sm" onPress={() => setStep(0)}>
            <Rocket className="size-4" />
            Launch wizard
          </Button>
        }
      />

      {hasSteps ? (
        <Card className="rounded-2xl">
          <Card.Header className="flex-col items-start gap-2">
            <Card.Title className="text-base">New customer setup</Card.Title>
            <Card.Description>
              Step {Math.min(step, steps.length - 1) + 1} of {steps.length}:{" "}
              {activeStep?.title}
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-6">
            <Stepper currentStep={step} onStepChange={setStep}>
              {steps.map((s) => (
                <Stepper.Step key={s.id}>
                  <Stepper.Indicator />
                  <Stepper.Content>
                    <Stepper.Title>{s.title}</Stepper.Title>
                  </Stepper.Content>
                  <Stepper.Separator />
                </Stepper.Step>
              ))}
            </Stepper>

            <ActiveStepBody
              activeStep={activeStep}
              connected={connected}
              services={services}
              onConnect={(key) => {
                setConnected((prev) => ({...prev, [key]: true}));
                notifySuccess("Integration connected");
              }}
            />

            <div className="flex items-center justify-between border-t pt-4">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => setStep(Math.max(0, step - 1))}
              >
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    setDraftSaved(true);
                    notifySuccess("Draft saved");
                  }}
                >
                  {draftSaved ? "Draft saved" : "Save draft"}
                </Button>
                <Button
                  size="sm"
                  onPress={() => {
                    if (isLastStep) {
                      notifySuccess("Customer launch queued — onboarding complete");
                      return;
                    }
                    setStep(Math.min(steps.length - 1, step + 1));
                  }}
                >
                  {isLastStep ? "Launch customer" : "Continue"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <Card.Header>
            <Card.Title className="text-base">New customer setup</Card.Title>
            <Card.Description>
              Onboarding flow steps will appear here once configured.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-muted py-6 text-center text-sm">
              No onboarding steps have been defined yet.
            </p>
          </Card.Content>
        </Card>
      )}

      {queue.length === 0 ? (
        <EmptyState
          body="Customers in the middle of the onboarding wizard show up here."
          cta={{label: "Start onboarding", onPress: () => setStep(0)}}
          icon={Rocket}
          title="Nobody onboarding right now"
        />
      ) : (
        <Card className="rounded-2xl">
          <Card.Header className="flex-row items-center justify-between">
            <div className="flex flex-col">
              <Card.Title className="text-base">In-progress onboardings</Card.Title>
              <Card.Description>
                {queue.length} {queue.length === 1 ? "customer" : "customers"} being launched.
              </Card.Description>
            </div>
            <RouteButton href="/white-label/customers" size="sm" variant="tertiary">
              View all
            </RouteButton>
          </Card.Header>
          <Card.Content className="flex flex-col gap-2">
            {queue.map((c) => (
              <div
                key={c.id}
                className="hover:bg-content2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
              >
                <Avatar className="size-9">
                  <Avatar.Image alt={c.name} src={c.avatar} />
                  <Avatar.Fallback>
                    {c.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </Avatar.Fallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-foreground text-sm font-medium leading-tight">
                    {c.name}
                  </span>
                  <span className="text-muted text-xs leading-tight">
                    {c.industry} · {c.city} · started {c.startedAt}
                  </span>
                </div>
                <Chip size="sm" variant="soft">
                  Step {c.currentStep + 1}
                  {hasSteps ? ` of ${steps.length}` : ""}
                </Chip>
                <span className="text-muted hidden text-xs sm:inline">
                  Assigned to {c.assignedTo}
                </span>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    setStep(c.currentStep);
                    notifyInfo(`Resuming onboarding for ${c.name}`);
                  }}
                >
                  Resume
                </Button>
              </div>
            ))}
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

function ActiveStepBody({
  activeStep,
  connected,
  onConnect,
  services,
}: {
  activeStep: OnboardingStep | undefined;
  connected: Record<string, boolean>;
  onConnect: (key: string) => void;
  services: ServiceOption[];
}) {
  const id = activeStep?.id;

  if (id === "business") return <BusinessStep />;
  if (id === "domain") return <DomainStep />;
  if (id === "brand") return <BrandStep />;
  if (id === "intake") return <IntakeStep />;
  if (id === "services") return <ServicesStep services={services} />;
  if (id === "integrations") return <IntegrationsStep connected={connected} onConnect={onConnect} />;
  if (id === "ai") return <AiStep />;

  return <ReviewStep />;
}

function BusinessStep() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField name="business-name">
        <Label className="text-foreground text-sm font-medium">Business name</Label>
        <Input placeholder="Customer business name" />
      </TextField>
      <TextField name="business-industry">
        <Label className="text-foreground text-sm font-medium">Industry</Label>
        <Input placeholder="HVAC, Dental, Roofing…" />
      </TextField>
      <TextField name="business-contact-name">
        <Label className="text-foreground text-sm font-medium">Primary contact</Label>
        <Input placeholder="Primary contact name" />
      </TextField>
      <TextField name="business-contact-email">
        <Label className="text-foreground text-sm font-medium">Contact email</Label>
        <Input placeholder="owner@business.com" type="email" />
      </TextField>
      <TextField name="business-phone">
        <Label className="text-foreground text-sm font-medium">Business phone</Label>
        <Input placeholder="(555) 555-0142" />
      </TextField>
      <TextField name="business-city">
        <Label className="text-foreground text-sm font-medium">Headquarters city</Label>
        <Input placeholder="City, State" />
      </TextField>
    </div>
  );
}

function DomainStep() {
  return (
    <div className="flex flex-col gap-4">
      <TextField name="domain">
        <Label className="text-foreground text-sm font-medium">Primary domain</Label>
        <Input placeholder="business.com" />
      </TextField>
      <Card className="rounded-2xl border-dashed">
        <Card.Content className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-2">
            <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl">
              <PlugConnection className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">DNS records to add</span>
              <span className="text-muted text-xs">
                Add the following at the customer&apos;s registrar.
              </span>
            </div>
          </div>
          <div className="bg-content2 grid grid-cols-[1fr_2fr_3fr] gap-2 rounded-lg p-3 font-mono text-xs">
            <span className="text-muted">A</span>
            <span>@</span>
            <span>76.76.21.21</span>
            <span className="text-muted">CNAME</span>
            <span>www</span>
            <span>cname.statxeo.com</span>
            <span className="text-muted">TXT</span>
            <span>@</span>
            <span>statxeo-verify=...</span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function BrandStep() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField name="brand-tagline">
        <Label className="text-foreground text-sm font-medium">Tagline</Label>
        <Input placeholder="Tagline that captures the brand promise." />
      </TextField>
      <TextField name="brand-tone">
        <Label className="text-foreground text-sm font-medium">Voice & tone</Label>
        <Input placeholder="Friendly, trustworthy, expert" />
      </TextField>
      <div className="md:col-span-2">
        <TextField name="brand-mission">
          <Label className="text-foreground text-sm font-medium">Mission statement</Label>
          <TextArea
            className="min-h-24"
            placeholder="Tell the AI about the customer's brand mission and what makes them unique."
          />
        </TextField>
      </div>
    </div>
  );
}

function IntakeStep() {
  return (
    <div className="flex flex-col gap-4">
      <TextField name="service-area">
        <Label className="text-foreground text-sm font-medium">Service areas</Label>
        <Input placeholder="City 1, City 2, City 3" />
      </TextField>
      <TextField name="seed-keywords">
        <Label className="text-foreground text-sm font-medium">Seed keywords</Label>
        <TextArea
          className="min-h-20"
          placeholder="Comma-separated seed keywords to track from day one."
        />
      </TextField>
      <TextField name="competitors">
        <Label className="text-foreground text-sm font-medium">Top competitors</Label>
        <Input placeholder="competitor1.com, competitor2.com" />
      </TextField>
    </div>
  );
}

function ServicesStep({services}: {services: ServiceOption[]}) {
  if (services.length === 0) {
    return (
      <p className="text-muted py-6 text-center text-sm">
        No service options configured yet — add some to make them selectable here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {services.map((option) => {
        const Icon = SERVICE_ICON[option.id as keyof typeof SERVICE_ICON] ?? Rocket;

        return (
          <Card key={option.id} className="rounded-2xl">
            <Card.Header className="flex-col items-start gap-2">
              <div className="flex w-full items-center justify-between">
                <span className="bg-accent-soft text-accent flex size-9 items-center justify-center rounded-xl">
                  <Icon className="size-4" />
                </span>
                {option.recommended ? (
                  <Chip color="success" size="sm" variant="soft">
                    Recommended
                  </Chip>
                ) : null}
              </div>
              <Card.Title className="text-base">{option.name}</Card.Title>
              <Card.Description>{option.description}</Card.Description>
            </Card.Header>
            <Card.Footer className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <NumberValue
                  className="text-foreground text-lg font-semibold"
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={option.price}
                />
                <span className="text-muted text-xs">/ mo</span>
              </div>
              <Checkbox defaultSelected={option.recommended} id={`svc-${option.id}`}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label htmlFor={`svc-${option.id}`}>Include</Label>
                </Checkbox.Content>
              </Checkbox>
            </Card.Footer>
          </Card>
        );
      })}
    </div>
  );
}

function IntegrationsStep({
  connected,
  onConnect,
}: {
  connected: Record<string, boolean>;
  onConnect: (key: string) => void;
}) {
  const integrations = [
    {key: "gbp", name: "Google Business Profile"},
    {key: "ga4", name: "Google Analytics 4"},
    {key: "ads", name: "Google Ads"},
    {key: "meta", name: "Meta Business Suite"},
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      {integrations.map((integ) => {
        const isConnected = connected[integ.key];

        return (
          <div
            key={integ.key}
            className="border-border flex items-center justify-between rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <span className="bg-content2 text-foreground flex size-9 items-center justify-center rounded-xl">
                <PlugConnection className="size-4" />
              </span>
              <span className="text-foreground text-sm font-medium">{integ.name}</span>
            </div>
            {isConnected ? (
              <Chip color="success" size="sm" variant="soft">
                <Check className="size-3" />
                Connected
              </Chip>
            ) : (
              <Button size="sm" variant="tertiary" onPress={() => onConnect(integ.key)}>
                Connect
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AiStep() {
  return (
    <div className="flex flex-col gap-4">
      <TextField name="ai-goals">
        <Label className="text-foreground text-sm font-medium">Top growth goals</Label>
        <TextArea
          className="min-h-20"
          placeholder="What does success look like 6 months from now?"
        />
      </TextField>
      <TextField name="ai-do-not">
        <Label className="text-foreground text-sm font-medium">Do-not list</Label>
        <Input placeholder="Topics, tones, or phrases to avoid." />
      </TextField>
      <Card className="rounded-2xl border-dashed">
        <Card.Content className="flex items-center gap-3 py-4">
          <span className="bg-accent-soft text-accent flex size-9 items-center justify-center rounded-xl">
            <FileText className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-medium">
              Upload anything that teaches your AI
            </span>
            <span className="text-muted text-xs">
              Brand guide PDFs, past blog posts, service menus, reviews — drag and drop.
            </span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function ReviewStep() {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-foreground text-sm font-medium">Ready to launch</span>
      <p className="text-muted text-sm">
        Once you complete the previous steps, a launch summary will appear here.
      </p>
    </div>
  );
}
