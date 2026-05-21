"use client";

import type {ReactNode} from "react";

import {AppShell} from "../../components/app-shell";
import {AFFILIATE_ACCOUNT} from "../../nav/affiliate";

export default function AffiliateLayout({children}: {children: ReactNode}) {
  return <AppShell account={AFFILIATE_ACCOUNT}>{children}</AppShell>;
}
