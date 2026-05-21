"use client";

import AIBlob from "@/components/react-bits/ai-blob";

const ASSISTANT_BLOB_COLORS = ["#6366F1", "#818CF8", "#A78BFA", "#C4B5FD"] as const;

export interface AiAssistantAvatarProps {
  size?: number;
  className?: string;
}

export function AiAssistantAvatar({className, size = 40}: AiAssistantAvatarProps) {
  return (
    <div
      aria-hidden
      className={`ring-accent/25 relative shrink-0 overflow-hidden rounded-full ring-2 ${className ?? ""}`}
      style={{width: size, height: size}}
    >
      <AIBlob
        animationSpeed={0.85}
        className="pointer-events-none"
        colors={[...ASSISTANT_BLOB_COLORS]}
        glowIntensity={0.65}
        resolution={0.65}
        size={size}
      />
    </div>
  );
}
