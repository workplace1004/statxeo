"use client";

import {useCallback, useMemo, useState, useTransition} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useOnboardingGoogleAuth} from "@/hooks/use-onboarding-google-auth";
import {onboardingGoogleReturnTo} from "@/lib/auth/onboarding-auth-return";
import {ArrowRight} from "lucide-react";
import {Button, Card, Input, Label, TextArea, TextField} from "@heroui/react";
import {OnboardingAuthStep} from "@/components/onboarding/onboarding-auth-step";
import {OnboardingShell} from "@/components/onboarding/onboarding-shell";
import {completeAgencyOnboarding} from "@/server/actions/onboarding";

const STEPS = [
  {id: "account", title: "Account"},
  {id: "business", title: "Agency"},
  {id: "branding", title: "Branding"},
  {id: "done", title: "Done"},
] as const;

export function WhiteLabelOnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignIn = searchParams.get("mode") === "sign-in";
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Controlled form state for step 1 and 2
  const [agencyName, setAgencyName] = useState("");
  const [website, setWebsite] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#EA580C");
  const [supportEmail, setSupportEmail] = useState("");

  const shellTitle = isSignIn ? "White-label partner sign in" : "White-label partner onboarding";
  const backHref = isSignIn ? "/login/partners" : "/partners";

  const onGoogleAuthenticated = useCallback(() => {
    if (isSignIn) {
      router.push("/white-label");
      return;
    }
    setStep(3);
  }, [isSignIn, router]);
  useOnboardingGoogleAuth(onGoogleAuthenticated);

  const handleAuthSubmit = useCallback(() => {
    if (isSignIn) {
      router.push("/white-label");
      return;
    }
    setStep(1);
  }, [isSignIn, router]);

  const visibleSteps = useMemo(
    () => (isSignIn ? [{id: "account", title: "Sign in"}] : [...STEPS]),
    [isSignIn],
  );

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <Button
        variant="tertiary"
        isDisabled={step === 0}
        onPress={() => setStep(Math.max(0, step - 1))}
      >
        Back
      </Button>
      {step > 0 && step < 3 ? (
        <Button onPress={() => setStep(step + 1)}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <OnboardingShell
      title={shellTitle}
      description="Operate your own branded version of StatXEO. Manage customers, automate fulfillment, and monitor growth."
      steps={visibleSteps}
      currentStep={step}
      footer={!isSignIn && step !== 0 && step !== 3 ? footer : undefined}
      backHref={backHref}
    >
      {step === 0 ? (
        <OnboardingAuthStep
          accent="orange"
          mode={isSignIn ? "sign-in" : "sign-up"}
          subtitle="Agency / Reseller"
          tagline="Your brand. Our AI-powered SEO & marketing engine."
          googlePersona="white-label"
          googleReturnTo={onboardingGoogleReturnTo("white-label", {signIn: isSignIn})}
          onSubmit={handleAuthSubmit}
        />
      ) : null}

      {step === 1 ? (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              Agency & business details
            </h2>
            <p className="text-muted mt-2 text-sm">
              Tell us about your agency so we can configure your white-label workspace.
            </p>
          </div>
          <Card className="rounded-2xl">
            <Card.Content className="flex flex-col gap-4 pt-6">
              <TextField isRequired name="agencyName">
                <Label>Agency / company name</Label>
                <Input
                  placeholder="Acme Marketing Co."
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </TextField>
              <TextField isRequired name="website" type="url">
                <Label>Website</Label>
                <Input
                  placeholder="https://youragency.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </TextField>
              <TextField name="customers">
                <Label>Approx. active customers</Label>
                <Input placeholder="e.g. 25" type="number" />
              </TextField>
              <TextField name="notes">
                <Label>What you sell today</Label>
                <TextArea placeholder="Web design, SEO, social, full-service marketing…" rows={3} />
              </TextField>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              Branding basics
            </h2>
            <p className="text-muted mt-2 text-sm">
              Customer & subaccount management, AI website generator, white-label margins, and
              automation — all under your brand.
            </p>
          </div>
          <Card className="rounded-2xl">
            <Card.Content className="flex flex-col gap-4 pt-6">
              <TextField isRequired name="brandName">
                <Label>Brand display name</Label>
                <Input
                  placeholder="Your Agency Name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </TextField>
              <TextField name="primaryColor">
                <Label>Primary brand color</Label>
                <Input
                  placeholder="#EA580C"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </TextField>
              <TextField name="supportEmail">
                <Label>Support email (shown to customers)</Label>
                <Input
                  placeholder="support@youragency.com"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
              </TextField>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <Card className="mx-auto max-w-lg rounded-2xl">
          <Card.Header>
            <Card.Title>White-label workspace ready</Card.Title>
            <Card.Description>
              Your agency dashboard is configured. Onboard customers with AI-built websites, SEO,
              social, and campaigns under your brand.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Button
              className="w-full"
              isLoading={isPending}
              onPress={() =>
                startTransition(() =>
                  completeAgencyOnboarding({
                    agencyName,
                    website,
                    brandName,
                    primaryColor,
                    supportEmail,
                  }),
                )
              }
            >
              Open white-label dashboard
              <ArrowRight className="size-4" />
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </OnboardingShell>
  );
}
