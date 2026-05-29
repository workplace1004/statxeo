import { cn } from "@/lib/utils";
import type { ClientShowcaseSite } from "@/lib/statxeo/client-showcase";

type BrowserPreviewFrameProps = {
  site: ClientShowcaseSite;
  className?: string;
  variant?: "default" | "compact";
  iframeScale?: number;
};

export function BrowserPreviewFrame({
  site,
  className,
  variant = "default",
  iframeScale = 0.715,
}: BrowserPreviewFrameProps) {
  const compact = variant === "compact";
  const showsEmbeddedPreview = site.previewMode !== "external-only";

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden border border-white/10 bg-[#06080d]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]",
        compact ? "rounded-[1.2rem]" : "rounded-[1.45rem]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl",
          compact ? "px-3 py-2.5" : "px-4 py-3",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div
          className={cn(
            "min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 font-mono text-white/70",
            compact ? "px-3 py-1 text-[10px]" : "px-3 py-1.5 text-[11px] sm:text-xs",
          )}
        >
          <span className="block truncate">{site.domain}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#040507]">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent",
            site.accentGlowClass,
          )}
        />
        {showsEmbeddedPreview ? (
          <iframe
            src={site.href}
            title={`${site.name} live site preview`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className="pointer-events-none absolute left-0 top-0 border-0"
            style={{
              width: "140%",
              height: "140%",
              transform: `scale(${iframeScale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_34%),linear-gradient(180deg,rgba(5,10,18,0.92),rgba(4,5,7,0.98))]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,transparent_65%,rgba(255,255,255,0.03))]" />
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
              <div
                className={cn(
                  "max-w-[20rem] rounded-[1.35rem] border border-white/12 bg-black/45 text-center shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl",
                  compact ? "p-4" : "p-5 sm:p-6",
                )}
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/48">External preview</p>
                <p className={cn("mt-3 font-semibold tracking-tight text-white", compact ? "text-sm" : "text-lg")}>
                  {site.name}
                </p>
                <p className={cn("mt-2 leading-relaxed text-white/68", compact ? "text-xs" : "text-sm")}>
                  {site.previewFallbackLabel ?? "This live site does not allow embedded previews in the browser."}
                </p>
                <a
                  href={site.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "mt-4 inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 font-medium text-white transition-colors hover:bg-white/[0.12]",
                    compact ? "text-xs" : "text-sm",
                  )}
                >
                  Open live site
                </a>
              </div>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,13,0.04),rgba(6,8,13,0.08)_42%,rgba(6,8,13,0.84)_100%)]" />

        <div className={cn("absolute inset-x-0 bottom-0", compact ? "p-3" : "p-4 sm:p-5")}>
          <div
            className={cn(
              "rounded-[1.15rem] border border-white/10 bg-black/45 backdrop-blur-xl",
              compact ? "p-3" : "p-4",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.22em]",
                  compact ? "text-[9px]" : "text-[10px]",
                  site.accentChipClass,
                )}
              >
                {site.category}
              </span>
              <span className={cn("font-mono uppercase tracking-[0.18em] text-white/45", compact ? "text-[10px]" : "text-[11px]")}>Live preview</span>
            </div>

            <p className={cn("mt-3 font-semibold tracking-tight text-white", compact ? "text-sm" : "text-base sm:text-lg")}>
              {site.name}
            </p>

            {!compact ? (
              <p className="mt-1 text-sm leading-relaxed text-white/70">{site.summary}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
