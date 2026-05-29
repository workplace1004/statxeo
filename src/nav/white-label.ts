import {
  ArrowRightFromSquare,
  Briefcase,
  ChartColumn,
  ChartLine,
  CircleQuestion,
  CreditCard,
  Display,
  Gear,
  House,
  Magnifier,
  Megaphone,
  Palette,
  PersonPlus,
  Persons,
  Rocket,
} from "@gravity-ui/icons";

import type {AccountConfig} from "../shared/nav-types";

export const WHITE_LABEL_ACCOUNT: AccountConfig = {
  basePath: "/white-label",
  brand: "Agency",
  footerItems: [
    {href: "/white-label/help", icon: CircleQuestion, label: "Help"},
    {href: "/", icon: ArrowRightFromSquare, label: "Switch account"},
  ],
  identity: {
    avatarFallback: "AC",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue-light.jpg",
    name: "Alex Carter",
    subtitle: "Agency Owner",
  },
  navItems: [
    {href: "/white-label", icon: House, label: "Dashboard"},
    {href: "/white-label/customers", icon: Persons, label: "Customers"},
    {href: "/white-label/onboarding", icon: PersonPlus, label: "Onboarding"},
    {href: "/white-label/websites", icon: Display, label: "Websites"},
    {href: "/white-label/seo", icon: Magnifier, label: "SEO / XEO"},
    {href: "/white-label/social", icon: Megaphone, label: "Social Engine"},
    {badge: "New", href: "/white-label/automation", icon: Rocket, label: "Automation"},
    {href: "/white-label/campaigns", icon: ChartLine, label: "Ad Campaigns"},
    {href: "/white-label/analytics", icon: ChartColumn, label: "Analytics"},
    {href: "/white-label/billing", icon: CreditCard, label: "Billing"},
    {href: "/white-label/branding", icon: Palette, label: "Branding"},
    {href: "/white-label/team", icon: Briefcase, label: "Team"},
    {href: "/white-label/settings", icon: Gear, label: "Settings"},
  ],
  type: "white-label",
} satisfies AccountConfig;
