"use client";

import {useEffect} from "react";
import {useSearchParams} from "next/navigation";

/** When URL has ?auth=google, invoke callback once (e.g. advance onboarding step). */
export function useOnboardingGoogleAuth(onAuthenticated: () => void): void {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("auth") === "google") {
      onAuthenticated();
    }
  }, [searchParams, onAuthenticated]);
}
