"use client";

import type {AccountConfig, NavItem} from "../shared/nav-types";

import {MagicWand} from "@gravity-ui/icons";
import {Avatar, Chip} from "@heroui/react";
import {Sidebar} from "@heroui-pro/react";
import {motion} from "motion/react";
import Link from "next/link";

import {isNavItemActive} from "../lib/ui/nav-active";

interface DashboardSidebarProps {
  pathname: string;
  account: AccountConfig;
  disableNavigation?: boolean;
}

export function DashboardSidebar({
  account,
  disableNavigation = false,
  pathname,
}: DashboardSidebarProps) {
  return (
    <>
      <Sidebar>
        <SidebarContents
          account={account}
          disableNavigation={disableNavigation}
          pathname={pathname}
        />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents
          account={account}
          disableNavigation={disableNavigation}
          idPrefix="mobile-"
          pathname={pathname}
        />
      </Sidebar.Mobile>
    </>
  );
}

interface SidebarContentsProps {
  account: AccountConfig;
  disableNavigation: boolean;
  pathname: string;
  idPrefix?: string;
}

function SidebarContents({
  account,
  disableNavigation,
  idPrefix = "",
  pathname,
}: SidebarContentsProps) {
  const {identity, navItems, footerItems, brand} = account;

  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="size-9">
            <Avatar.Image alt={identity.name} src={identity.avatarUrl} />
            <Avatar.Fallback>{identity.avatarFallback}</Avatar.Fallback>
          </Avatar>
          <div className="flex min-w-0 flex-col" data-sidebar="label">
            <span className="text-foreground text-sm font-medium leading-tight">
              {identity.name}
            </span>
            <span className="text-muted text-xs font-medium leading-tight">
              {identity.subtitle} · {brand}
            </span>
          </div>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label={`${brand} navigation`}>
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                basePath={account.basePath}
                disableNavigation={disableNavigation}
                idPrefix={idPrefix}
                item={item}
                pathname={pathname}
              />
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        {account.type === "customer" ? (
          <Link href="/customer/ai">
            <motion.div
              className="border-accent/20 bg-accent/10 hover:bg-accent/15 mx-2 mb-2 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
              initial={{opacity: 0}}
              transition={{duration: 0.3, delay: 0.2}}
              animate={{opacity: 1}}
            >
              <div className="relative flex size-6 shrink-0 items-center justify-center">
                <motion.span
                  animate={{scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7]}}
                  className="bg-success absolute inset-0 rounded-full"
                  transition={{duration: 2, repeat: Infinity, ease: "easeInOut"}}
                />
                <span className="bg-success relative size-2 rounded-full" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground text-xs font-medium leading-tight">
                  Autopilot active
                </span>
                <span className="text-muted text-xs leading-tight">AI is working for you</span>
              </div>
              <MagicWand className="text-accent size-3.5 shrink-0" />
            </motion.div>
          </Link>
        ) : null}
        <Sidebar.Menu aria-label="Account">
          {footerItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              basePath={account.basePath}
              disableNavigation={disableNavigation}
              idPrefix={idPrefix}
              item={item}
              pathname={pathname}
            />
          ))}
        </Sidebar.Menu>
      </Sidebar.Footer>
    </>
  );
}

interface SidebarNavItemProps {
  basePath: string;
  disableNavigation: boolean;
  idPrefix: string;
  item: NavItem;
  pathname: string;
}

function SidebarNavItem({
  basePath,
  disableNavigation,
  idPrefix,
  item,
  pathname,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const fullHref = item.href;
  const isCurrent = isNavItemActive(pathname, fullHref, basePath);

  return (
    <Sidebar.MenuItem
      href={disableNavigation ? undefined : fullHref}
      id={`${idPrefix}${item.href}`}
      isCurrent={isCurrent}
      textValue={item.label}
    >
      <Sidebar.MenuIcon>
        <Icon className="size-4" />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
      {item.badge ? (
        <Sidebar.MenuChip>
          <Chip className="pointer-events-none" color="success" size="sm" variant="soft">
            {item.badge}
          </Chip>
        </Sidebar.MenuChip>
      ) : null}
    </Sidebar.MenuItem>
  );
}
