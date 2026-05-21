"use client";

import type {ReactNode} from "react";

import {AppShell} from "../../components/app-shell";
import {WHITE_LABEL_ACCOUNT} from "../../nav/white-label";

export default function WhiteLabelLayout({children}: {children: ReactNode}) {
  return <AppShell account={WHITE_LABEL_ACCOUNT}>{children}</AppShell>;
}
