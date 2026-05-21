"use client";

import type {ButtonProps} from "@heroui/react";

import {Button} from "@heroui/react";
import {useRouter} from "next/navigation";

export interface RouteButtonProps extends ButtonProps {
  href: string;
}

/** Button-styled client navigation — avoids invalid `<a><button></button></a>` nesting. */
export function RouteButton({href, onPress, ...props}: RouteButtonProps) {
  const router = useRouter();

  return (
    <Button
      {...props}
      onPress={(event) => {
        onPress?.(event);
        router.push(href);
      }}
    />
  );
}
