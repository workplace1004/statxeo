import {
  ArrowRightFromSquare,
  ChartColumn,
  CreditCard,
  Display,
  Gear,
  Handset,
  House,
  LifeRing,
  Magnifier,
  MagicWand,
  Megaphone,
  Rocket,
} from "@gravity-ui/icons";

import type {AccountConfig} from "../shared/nav-types";

export const CUSTOMER_ACCOUNT: AccountConfig = {
  basePath: "/customer",
  brand: "StatXEO",
  footerItems: [
    {href: "/customer/support", icon: LifeRing, label: "Support"},
    {href: "/", icon: ArrowRightFromSquare, label: "Switch account"},
  ],
  identity: {
    avatarFallback: "SP",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue-light.jpg",
    name: "Sam Patel",
    subtitle: "Sunrise HVAC",
  },
  navItems: [
    {href: "/customer", icon: House, label: "Dashboard"},
    {href: "/customer/website", icon: Display, label: "Website"},
    {href: "/customer/seo", icon: Magnifier, label: "SEO"},
    {href: "/customer/social", icon: Megaphone, label: "Social Media"},
    {badge: "Soon", href: "/customer/campaigns", icon: Rocket, label: "Campaigns"},
    {href: "/customer/calling", icon: Handset, label: "Calling"},
    {href: "/customer/ai", icon: MagicWand, label: "AI Assistant"},
    {href: "/customer/analytics", icon: ChartColumn, label: "Analytics"},
    {href: "/customer/billing", icon: CreditCard, label: "Billing"},
    {href: "/customer/settings", icon: Gear, label: "Settings"},
  ],
  type: "customer",
} satisfies AccountConfig;
