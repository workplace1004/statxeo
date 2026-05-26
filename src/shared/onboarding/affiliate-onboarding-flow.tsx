"use client";

import {useCallback, useMemo, useState, useTransition} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {useOnboardingGoogleAuth} from "@/hooks/use-onboarding-google-auth";
import {onboardingGoogleReturnTo} from "@/lib/auth/onboarding-auth-return";
import {ArrowRight} from "lucide-react";
import {Button, Card, Input, Label, TextField} from "@heroui/react";
import {OnboardingAuthStep} from "@/components/onboarding/onboarding-auth-step";
import {OnboardingShell} from "@/components/onboarding/onboarding-shell";
import {completeAffiliateOnboarding} from "@/server/actions/onboarding";

const STEPS = [
  {id: "account", title: "Account"},
  {id: "profile", title: "Profile"},
  {id: "done", title: "Done"},
] as const;

export function AffiliateOnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignIn = searchParams.get("mode") === "sign-in";
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Controlled form state for step 1
  const [fullName, setFullName] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");

  const shellTitle = isSignIn ? "Affiliate partner sign in" : "Affiliate partner onboarding";
  const backHref = isSignIn ? "/login/partners" : "/partners";

  const onGoogleAuthenticated = useCallback(() => {
    if (isSignIn) {
      router.push("/affiliate");
      return;
    }
    setStep(2);
  }, [isSignIn, router]);
  useOnboardingGoogleAuth(onGoogleAuthenticated);

  const handleAuthSubmit = useCallback(() => {
    if (isSignIn) {
      router.push("/affiliate");
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
      {step === 1 ? (
        <Button onPress={() => setStep(2)}>
          Continue
          <ArrowRight className="size-4" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <OnboardingShell
      title={shellTitle}
      description="Sell StatXEO, track commissions, and get marketing assets, training, and payouts."
      steps={visibleSteps}
      currentStep={step}
      footer={!isSignIn && step === 1 ? footer : undefined}
      backHref={backHref}
    >
      {step === 0 ? (
        <OnboardingAuthStep
          accent="orange"
          mode={isSignIn ? "sign-in" : "sign-up"}
          subtitle="Sell & Earn"
          tagline="Refer local businesses. Earn on every closed deal."
          googlePersona="affiliate"
          googleReturnTo={onboardingGoogleReturnTo("affiliate", {signIn: isSignIn})}
          onSubmit={handleAuthSubmit}
        />
      ) : null}

      {step === 1 ? (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <div>
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              Affiliate profile & payouts
            </h2>
            <p className="text-muted mt-2 text-sm">
              Tracking links, lead pipeline, marketing assets, and commission tracking — set up
              how you get paid.
            </p>
          </div>
          <Card className="rounded-2xl">
            <Card.Content className="flex flex-col gap-4 pt-6">
              <TextField isRequired name="fullName">
                <Label>Full name</Label>
                <Input
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </TextField>
              <TextField isRequired name="payoutEmail">
                <Label>Payout email</Label>
                <Input
                  placeholder="you@email.com"
                  type="email"
                  value={payoutEmail}
                  onChange={(e) => setPayoutEmail(e.target.value)}
                />
              </TextField>
              <TextField name="payoutMethod">
                <Label>Preferred payout method</Label>
                <Input placeholder="PayPal, ACH, Wise…" />
              </TextField>
              <TextField name="audience">
                <Label>Who you refer (optional)</Label>
                <Input placeholder="Local contractors, dentists, salons…" />
              </TextField>
            </Card.Content>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <Card className="mx-auto max-w-lg rounded-2xl">
          <Card.Header>
            <Card.Title>Affiliate workspace ready</Card.Title>
            <Card.Description>
              Get referral links, QR codes, marketing assets, and training. Track leads, book
              demos, and earn commissions.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Button
              className="w-full"
<<<<<<< Updated upstream
              isLoading={isPending}
=======
              isDisabled={isPending}
>>>>>>> Stashed changes
              onPress={() =>
                startTransition(() =>
                  completeAffiliateOnboarding({fullName, payoutEmail}),
                )
              }
            >
<<<<<<< Updated upstream
              Open affiliate dashboard
              <ArrowRight className="size-4" />
=======
              {isPending && (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Open affiliate dashboard
              {!isPending && <ArrowRight className="size-4" />}
>>>>>>> Stashed changes
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </OnboardingShell>
  );
}
