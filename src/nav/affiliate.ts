import {
  ArrowRightFromSquare,
  Book,
  Calendar,
  ChartColumn,
  CircleDollar,
  CircleQuestion,
  Gear,
  Hashtag,
  House,
  LifeRing,
  Megaphone,
  Persons,
  Tag,
} from "@gravity-ui/icons";

import type {AccountConfig} from "../shared/nav-types";

export const AFFILIATE_ACCOUNT: AccountConfig = {
  basePath: "/affiliate",
  brand: "Affiliate",
  footerItems: [
    {href: "/affiliate/support", icon: LifeRing, label: "Support"},
    {href: "/", icon: ArrowRightFromSquare, label: "Switch account"},
  ],
  identity: {
    avatarFallback: "JR",
    avatarUrl: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue-light.jpg",
    name: "Jordan Reyes",
    subtitle: "Top Affiliate",
  },
  navItems: [
    {href: "/affiliate", icon: House, label: "Dashboard"},
    {href: "/affiliate/links", icon: Hashtag, label: "Referral Links"},
    {href: "/affiliate/leads", icon: Persons, label: "Leads"},
    {href: "/affiliate/commissions", icon: CircleDollar, label: "Commissions"},
    {href: "/affiliate/assets", icon: Megaphone, label: "Marketing Assets"},
    {href: "/affiliate/training", icon: Book, label: "Training"},
    {href: "/affiliate/pricing", icon: Tag, label: "Plans & Pricing"},
    {href: "/affiliate/meetings", icon: Calendar, label: "Meetings"},
    {href: "/affiliate/analytics", icon: ChartColumn, label: "Analytics"},
    {href: "/affiliate/settings", icon: Gear, label: "Settings"},
  ],
  type: "affiliate",
} satisfies AccountConfig;

void CircleQuestion;
