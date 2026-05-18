"use client"

import type { ReactNode } from "react"
import { Modal } from "@heroui/react"

export function PortalModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <Modal.Root isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable />
      <Modal.Container placement="center" size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <div className="space-y-1">
              <Modal.Heading>{title}</Modal.Heading>
              {description ? <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
            </div>
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
          {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Root>
  )
}