import {toast} from "@heroui/react";

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyInfo(message: string): void {
  toast.info(message);
}

export function notifyError(message: string): void {
  toast(message, {variant: "danger"} as any);
}
