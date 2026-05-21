"use client";

import {ArrowUp, Microphone, Paperclip} from "@gravity-ui/icons";
import {Button, TextArea} from "@heroui/react";
import {motion} from "motion/react";
import {useState} from "react";

import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";

export interface AiChatComposerProps {
  placeholder?: string;
  className?: string;
  variant?: "default" | "pill";
  onSend?: (message: string) => void;
}

export function AiChatComposer({
  className,
  onSend,
  placeholder = "Ask your AI assistant anything about your business…",
  variant = "default",
}: AiChatComposerProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    notifySuccess("Message sent to your AI assistant");
    setValue("");
  }

  const attach = () => notifyInfo("File attachments are coming soon");
  const voice = () => notifyInfo("Voice input is coming soon");

  if (variant === "pill") {
    return (
      <motion.div className={className}>
        <div className="bg-default/60 flex items-end gap-2 rounded-full p-2">
          <motion.div className="flex shrink-0 items-center gap-1 pl-1" whileHover={{scale: 1.02}}>
            <Button
              isIconOnly
              aria-label="Attach file"
              size="sm"
              variant="ghost"
              onPress={attach}
            >
              <Paperclip className="size-4" />
            </Button>
            <Button
              isIconOnly
              aria-label="Voice input"
              size="sm"
              variant="ghost"
              onPress={voice}
            >
              <Microphone className="size-4" />
            </Button>
          </motion.div>
          <TextArea
            fullWidth
            aria-label="Message"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent py-2.5 shadow-none"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}>
            <Button
              isIconOnly
              aria-label="Send message"
              className="shrink-0 rounded-full"
              isDisabled={!value.trim()}
              size="sm"
              onPress={handleSend}
            >
              <ArrowUp className="size-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      <div className="relative w-full">
        <TextArea
          fullWidth
          aria-label="Message"
          className="min-h-[112px] resize-none pb-12"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <motion.div
          className="absolute bottom-4 left-3 right-3 flex items-center justify-between"
          whileHover={{scale: 1.01}}
        >
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              aria-label="Attach file"
              size="sm"
              variant="tertiary"
              onPress={attach}
            >
              <Paperclip className="size-4" />
            </Button>
            <Button
              isIconOnly
              aria-label="Voice input"
              size="sm"
              variant="tertiary"
              onPress={voice}
            >
              <Microphone className="size-4" />
            </Button>
          </div>
          <Button
            isIconOnly
            aria-label="Send message"
            isDisabled={!value.trim()}
            size="sm"
            onPress={handleSend}
          >
            <ArrowUp className="size-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
