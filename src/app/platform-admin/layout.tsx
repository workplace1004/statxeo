"use client";

import type {ReactNode} from "react";

import {AppShell} from "../../components/app-shell";
import {PLATFORM_ADMIN_ACCOUNT} from "../../nav/platform-admin";

export default function PlatformAdminLayout({children}: {children: ReactNode}) {
  return <AppShell account={PLATFORM_ADMIN_ACCOUNT}>{children}</AppShell>;
}
