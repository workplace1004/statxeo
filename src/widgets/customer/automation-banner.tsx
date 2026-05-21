"use client";

import {Sparkles} from "@gravity-ui/icons";
import {Chip} from "@heroui/react";
import {motion} from "motion/react";
import Link from "next/link";

export interface AutomationBannerProps {
  message: string;
}

export function AutomationBanner({message}: AutomationBannerProps) {
  return (
    <motion.div
      animate={{opacity: 1, y: 0}}
      className="border-accent/20 bg-accent/10 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5"
      initial={{opacity: 0, y: -4}}
      transition={{duration: 0.2}}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="text-accent size-3.5 shrink-0" />
        <span className="text-foreground text-xs">{message}</span>
      </div>
      <Link href="/customer/ai">
        <Chip className="cursor-pointer" color="accent" size="sm" variant="soft">
          Settings
        </Chip>
      </Link>
    </motion.div>
  );
}
