import type {Metadata} from "next";
import type {ReactNode} from "react";

import {Toast} from "@heroui/react";

import "./globals.css";

export const metadata: Metadata = {
  description:
    "StatXEO — AI-powered SEO and marketing platform. Build sites, rank on Google, automate growth.",
  title: "StatXEO — AI SEO & Marketing Platform",
};

export const dynamic = "force-dynamic";

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html suppressHydrationWarning className="bg-background text-foreground" lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toast.Provider placement="bottom" />
      </body>
    </html>
  );
}
