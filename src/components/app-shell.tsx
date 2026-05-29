"use client";

import type {ReactNode} from "react";
import type {AccountConfig} from "../shared/nav-types";

import {AppLayout} from "@heroui-pro/react";
import {usePathname, useRouter} from "next/navigation";
import {useCallback, useEffect, useMemo, useState} from "react";

import {isNavItemActive} from "../lib/ui/nav-active";
import {CommandPalette} from "../widgets/command-palette";

import {DashboardNavbar} from "./dashboard-navbar";
import {DashboardSidebar} from "./dashboard-sidebar";

export interface AppShellProps {
  children: ReactNode;
  account: AccountConfig;
}

export function AppShell({account, children}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const navigate = useCallback((href: string) => router.push(href), [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const title = useMemo(() => {
    const allItems = [...account.navItems, ...account.footerItems];
    const match = allItems.find((item) =>
      isNavItemActive(pathname, item.href, account.basePath),
    );

    if (match) return match.label;
    if (pathname === account.basePath) return `${account.brand} · Dashboard`;

    return account.brand;
  }, [pathname, account]);

  return (
    <>
      <AppLayout
        navbar={
          <DashboardNavbar onSearch={() => setIsPaletteOpen(true)} title={title} />
        }
        navigate={navigate}
        sidebar={<DashboardSidebar account={account} pathname={pathname} />}
        sidebarCollapsible="offcanvas"
      >
        {children}
      </AppLayout>
      <CommandPalette
        basePath={account.basePath}
        footerItems={[...account.footerItems]}
        isOpen={isPaletteOpen}
        navItems={[...account.navItems]}
        onClose={() => setIsPaletteOpen(false)}
      />
    </>
  );
}
