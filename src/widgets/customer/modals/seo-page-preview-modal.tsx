"use client";

import type {ReactNode} from "react";
import type {UseOverlayStateReturn} from "@heroui/react";
import {Button, Modal, useOverlayState} from "@heroui/react";
import {Globe, FileText} from "@gravity-ui/icons";
import {ModalShell} from "../../../lib/ui/modal-shell";

export interface GeneratedPageContent {
  title: string;
  targetKeyword: string;
  location: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
}

export interface SeoPagePreviewModalProps {
  page: GeneratedPageContent;
  trigger?: ReactNode;
  state?: UseOverlayStateReturn;
}

export function SeoPagePreviewModal({page, state: externalState, trigger}: SeoPagePreviewModalProps) {
  const internalState = useOverlayState();
  const state = externalState ?? internalState;

  return (
    <ModalShell state={state} trigger={trigger}>
      <Modal.Container placement="center" size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <div className="flex items-center gap-2">
              <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-lg">
                <FileText className="size-4" />
              </span>
              <Modal.Heading>{page.title}</Modal.Heading>
            </div>
            <p className="text-muted text-xs">
              Previewing AI Draft. Targets keyword <strong>"{page.targetKeyword}"</strong> in <strong>"{page.location}"</strong>.
            </p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-content2 rounded-xl p-3 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <Globe className="size-3.5" />
                SEO Metadata
              </div>
              <div>
                <span className="text-muted font-medium">URL Slug:</span>{" "}
                <code className="bg-content3 rounded px-1 text-foreground">/{page.slug}</code>
              </div>
              <div>
                <span className="text-muted font-medium">Meta Title:</span>{" "}
                <span className="text-foreground">{page.metaTitle}</span>
              </div>
              <div>
                <span className="text-muted font-medium">Meta Description:</span>{" "}
                <span className="text-foreground">{page.metaDescription}</span>
              </div>
            </div>

            <div className="border-border border-t pt-4">
              <h1 className="text-foreground text-2xl font-bold mb-3">{page.h1}</h1>
              <div
                className="prose prose-sm text-foreground space-y-3"
                dangerouslySetInnerHTML={{__html: page.bodyHtml}}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Close Preview
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </ModalShell>
  );
}
