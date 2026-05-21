import type {ComponentType, ReactNode, SVGProps} from "react";

import {Sparkles} from "@gravity-ui/icons";
import {Button, Card} from "@heroui/react";

import {RouteButton} from "../components/route-button";

export interface EmptyStateProps {
  /** Optional Gravity icon component (defaults to Sparkles). */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Card title — short and welcoming, e.g. "No customers yet". */
  title: string;
  /** One-line body that explains where the data will come from. */
  body: string;
  /** Optional primary CTA — when omitted, no button is rendered. */
  cta?: {
    label: string;
    href?: string;
    onPress?: () => void;
  };
  /** Optional secondary CTA (rendered as a tertiary button). */
  secondary?: {
    label: string;
    href?: string;
    onPress?: () => void;
  };
  /** Extra elements rendered under the actions row. */
  footer?: ReactNode;
  /** Override the default tonal background ring. */
  className?: string;
}

/**
 * Polished empty-state card. Used wherever a list/collection comes back empty
 * so the page never looks broken. Tone is calm and confident — short title,
 * one-line body, single CTA — never "TODO" or apologetic.
 */
export function EmptyState({
  icon: Icon = Sparkles,
  title,
  body,
  cta,
  secondary,
  footer,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={
        "rounded-2xl border-dashed " + (className ?? "")
      }
    >
      <Card.Content className="flex flex-col items-center gap-3 px-8 py-12 text-center">
        <div className="bg-accent/10 text-accent flex size-12 items-center justify-center rounded-2xl">
          <Icon className="size-6" />
        </div>
        <div className="flex max-w-md flex-col gap-1">
          <h3 className="text-foreground text-base font-semibold">{title}</h3>
          <p className="text-muted text-sm">{body}</p>
        </div>
        {(cta || secondary) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {secondary && <EmptyStateButton tertiary {...secondary} />}
            {cta && <EmptyStateButton {...cta} />}
          </div>
        )}
        {footer}
      </Card.Content>
    </Card>
  );
}

function EmptyStateButton({
  label,
  href,
  onPress,
  tertiary,
}: {
  label: string;
  href?: string;
  onPress?: () => void;
  tertiary?: boolean;
}) {
  const variant = tertiary ? "tertiary" : "primary";

  if (href) {
    return (
      <RouteButton href={href} size="sm" variant={variant}>
        {label}
      </RouteButton>
    );
  }

  return (
    <Button size="sm" variant={variant} onPress={onPress}>
      {label}
    </Button>
  );
}
