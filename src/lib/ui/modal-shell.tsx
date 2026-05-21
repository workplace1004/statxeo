"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";

import {Modal} from "@heroui/react";

/**
 * HeroUI Modal root is a DialogTrigger and requires a pressable trigger child.
 * When opening via useOverlayState only, render Modal.Backdrop directly instead.
 */
export function ModalShell({
  state,
  trigger,
  children,
}: {
  state: UseOverlayStateReturn;
  trigger?: ReactNode;
  children: ReactNode;
}) {
  const backdrop = (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
      {children}
    </Modal.Backdrop>
  );

  if (trigger) {
    return (
      <Modal>
        {trigger}
        {backdrop}
      </Modal>
    );
  }

  return backdrop;
}
