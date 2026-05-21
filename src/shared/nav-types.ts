import type {ComponentType} from "react";

export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: ComponentType<{className?: string}>;
  readonly badge?: string;
};

export type AccountType = "white-label" | "affiliate" | "customer";

export type AccountIdentity = {
  readonly name: string;
  readonly subtitle: string;
  readonly avatarUrl: string;
  readonly avatarFallback: string;
};

export type AccountConfig = {
  readonly type: AccountType;
  readonly basePath: string;
  readonly brand: string;
  readonly identity: AccountIdentity;
  readonly navItems: readonly NavItem[];
  readonly footerItems: readonly NavItem[];
};
