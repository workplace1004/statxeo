"use client";

import {ArrowsRotateLeft, Copy, Ellipsis, ThumbsDown, ThumbsUp} from "@gravity-ui/icons";
import {Button} from "@heroui/react";

import {copyToClipboard} from "../../lib/ui/copy-to-clipboard";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";

interface AiMessageActionsProps {
  content?: string;
  variant?: "full" | "minimal";
}

export function AiMessageActions({content = "", variant = "full"}: AiMessageActionsProps) {
  return (
    <div className="flex items-start">
      <Button
        isIconOnly
        aria-label="Copy response"
        className="text-muted opacity-50"
        size="sm"
        variant="ghost"
        onPress={() => {
          if (content) copyToClipboard(content, "Response copied");
          else notifyInfo("Nothing to copy yet");
        }}
      >
        <Copy className="size-4" />
      </Button>
      {variant === "full" ? (
        <>
          <Button
            isIconOnly
            aria-label="Good response"
            className="text-muted opacity-50"
            size="sm"
            variant="ghost"
            onPress={() => notifySuccess("Thanks for the feedback")}
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            isIconOnly
            aria-label="Poor response"
            className="text-muted opacity-50"
            size="sm"
            variant="ghost"
            onPress={() => notifyInfo("We'll use this to improve responses")}
          >
            <ThumbsDown className="size-4" />
          </Button>
          <Button
            isIconOnly
            aria-label="Regenerate response"
            className="text-muted opacity-50"
            size="sm"
            variant="ghost"
            onPress={() => notifyInfo("Regenerating response…")}
          >
            <ArrowsRotateLeft className="size-4" />
          </Button>
        </>
      ) : null}
      <Button
        isIconOnly
        aria-label="More actions"
        className="text-muted opacity-50"
        size="sm"
        variant="ghost"
        onPress={() => notifyInfo("More actions coming soon")}
      >
        <Ellipsis className="size-4" />
      </Button>
    </div>
  );
}
