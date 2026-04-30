"use client"

import { useState } from "react"
import { ChevronDown, ExternalLink, Globe, LayoutGrid, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  previewBaseUrl: string
  previewPages: string[] | null
  packageTier: string
  pageCount: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function routeToLabel(route: string): string {
  if (route === "/" || route === "") return "Home"
  const clean = route.replace(/^\/|\/$/g, "")
  const parts = clean.split("/")
  // e.g. "services/ac-repair" → "AC Repair"
  const last = parts[parts.length - 1]
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function routeToGroup(route: string): "core" | "service" | "city" {
  if (route.startsWith("/services/")) return "service"
  const coreRoutes = ["/", "/services/", "/about/", "/contact/"]
  if (coreRoutes.includes(route) || coreRoutes.includes(route + "/")) return "core"
  return "city"
}

// ─── Tab bar (Lander / Core) ──────────────────────────────────────────────────

function PageTabBar({
  pages,
  activePage,
  onSelect,
}: {
  pages: string[]
  activePage: string
  onSelect: (p: string) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/50 px-3 pb-0 pt-2">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onSelect(page)}
          className={cn(
            "shrink-0 rounded-t-md border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
            activePage === page
              ? "border-border/50 bg-background text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {routeToLabel(page)}
        </button>
      ))}
    </div>
  )
}

// ─── Titan nav (dropdown for dynamic pages) ───────────────────────────────────

function TitanPageNav({
  pages,
  activePage,
  onSelect,
}: {
  pages: string[]
  activePage: string
  onSelect: (p: string) => void
}) {
  const corePages = pages.filter((p) => routeToGroup(p) === "core")
  const servicePages = pages.filter((p) => routeToGroup(p) === "service")
  const cityPages = pages.filter((p) => routeToGroup(p) === "city")

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-3 pb-2 pt-2">
      {/* Core pages as tabs */}
      {corePages.map((page) => (
        <button
          key={page}
          onClick={() => onSelect(page)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            activePage === page
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
          )}
        >
          {routeToLabel(page)}
        </button>
      ))}

      {/* Service pages dropdown */}
      {servicePages.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={servicePages.includes(activePage) ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1 px-3 text-xs"
            >
              <LayoutGrid className="size-3" />
              Services
              {servicePages.includes(activePage) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {routeToLabel(activePage)}
                </Badge>
              )}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Service Pages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {servicePages.map((page) => (
                <DropdownMenuItem
                  key={page}
                  onClick={() => onSelect(page)}
                  className={cn("text-sm", activePage === page && "bg-primary/10 text-primary")}
                >
                  {routeToLabel(page)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* City pages dropdown */}
      {cityPages.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={cityPages.includes(activePage) ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1 px-3 text-xs"
            >
              <Globe className="size-3" />
              Cities
              {cityPages.includes(activePage) && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {routeToLabel(activePage)}
                </Badge>
              )}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground">City Pages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {cityPages.map((page) => (
                <DropdownMenuItem
                  key={page}
                  onClick={() => onSelect(page)}
                  className={cn("text-sm", activePage === page && "bg-primary/10 text-primary")}
                >
                  {routeToLabel(page)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WebsitePreviewPanel({ previewBaseUrl, previewPages, packageTier, pageCount }: Props) {
  // Normalise pages: ensure they start with "/"
  const pages: string[] = previewPages && previewPages.length > 0
    ? previewPages.map((p) => (p.startsWith("/") ? p : `/${p}`))
    : ["/"]

  const [activePage, setActivePage] = useState(pages[0])

  const isTitan = packageTier === "statxeo_titan"
  const isLander = packageTier === "statxeo_lander"

  // Build the full iframe src
  const iframeSrc = previewBaseUrl.replace(/\/$/, "") + (activePage === "/" ? "" : activePage)

  return (
    <Card className="overflow-hidden border-border/50 bg-card/60">
      {/* Browser chrome */}
      <CardHeader className="pb-0 pt-4">
        <div className="flex items-center gap-2">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/70" />
            <div className="size-3 rounded-full bg-amber-500/70" />
            <div className="size-3 rounded-full bg-emerald-500/70" />
          </div>
          {/* URL bar */}
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border/50 bg-background/50 px-3 py-1">
            <Monitor className="size-3 shrink-0 text-muted-foreground/50" />
            <p className="truncate text-xs text-muted-foreground">
              {previewBaseUrl.replace(/\/$/, "")}{activePage === "/" ? "" : activePage}
            </p>
          </div>
          {/* Open in new tab */}
          <Button variant="ghost" size="icon" className="size-7 shrink-0" asChild>
            <a href={iframeSrc} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </CardHeader>

      {/* Page navigation */}
      {!isLander && (
        isTitan
          ? <TitanPageNav pages={pages} activePage={activePage} onSelect={setActivePage} />
          : <PageTabBar pages={pages} activePage={activePage} onSelect={setActivePage} />
      )}

      {/* Page count info */}
      {pageCount && pageCount > 1 && (
        <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-4 py-1.5">
          <p className="text-xs text-muted-foreground">
            Viewing <span className="font-medium text-foreground">{routeToLabel(activePage)}</span>
          </p>
          <Badge variant="outline" className="text-xs">{pageCount} pages total</Badge>
        </div>
      )}

      {/* iframe */}
      <CardContent className="p-0">
        <div className="aspect-video w-full">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="h-full w-full border-0"
            title={`Preview — ${routeToLabel(activePage)}`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  )
}
