"use client";

import type {ReactNode} from "react";

import {AppShell} from "../../components/app-shell";
import {CUSTOMER_ACCOUNT} from "../../nav/customer";

export default function CustomerLayout({children}: {children: ReactNode}) {
  return <AppShell account={CUSTOMER_ACCOUNT}>{children}</AppShell>;
}
