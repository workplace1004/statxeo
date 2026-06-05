import {
  ArrowRightFromSquare,
  Briefcase,
  CircleQuestion,
  CreditCard,
  Gear,
  House,
  PlugWire,
} from "@gravity-ui/icons";

import type {AccountConfig} from "../shared/nav-types";

export const PLATFORM_ADMIN_ACCOUNT: AccountConfig = {
  basePath: "/platform-admin",
  brand: "StatXEO HQ",
  footerItems: [
    {href: "/platform-admin/help", icon: CircleQuestion, label: "Help"},
    {href: "/", icon: ArrowRightFromSquare, label: "Sign out"},
  ],
  identity: {
    avatarFallback: "HQ",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/avatar-1.png",
    name: "System Admin",
    subtitle: "Platform God Mode",
  },
  navItems: [
    {href: "/platform-admin", icon: House, label: "Dashboard"},
    {href: "/platform-admin/agencies", icon: Briefcase, label: "Agencies"},
    {href: "/platform-admin/payouts", icon: CreditCard, label: "Global Payouts"},
    {href: "/platform-admin/providers", icon: PlugWire, label: "API Providers"},
    {href: "/platform-admin/settings", icon: Gear, label: "Settings"},
  ],
  type: "platform-admin",
} satisfies AccountConfig;
