"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, Home, LayoutGrid, MoreHorizontal, Palette, Settings2, Users, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { pathnameToSegment } from "@/components/white-labeler/portal-utils"
import { cn } from "@/lib/utils"

const base = "/white-labeler"

function NavIcon({
  href,
  active,
  label,
  children,
}: {
  href: string
  active: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <Button variant="ghost" size="sm" className="flex h-14 flex-1 flex-col gap-0.5 px-1 py-2 text-[11px] font-medium" asChild>
      <Link href={href} aria-current={active ? "page" : undefined}>
        <span className={cn("flex size-10 items-center justify-center rounded-md", active ? "bg-accent text-accent-foreground" : "")}>
          {children}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    </Button>
  )
}

export function WhiteLabelerMobileBottomNav() {
  const pathname = usePathname() ?? ""
  const seg = pathnameToSegment(pathname)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <div className="flex max-w-lg mx-auto items-stretch justify-around">
        <NavIcon href={base} active={seg === "home"} label="Home">
          <Home className="size-5" aria-hidden />
        </NavIcon>
        <NavIcon href={`${base}/clients`} active={seg === "clients"} label="Clients">
          <Users className="size-5" aria-hidden />
        </NavIcon>
        <NavIcon href={`${base}/payouts`} active={seg === "payouts"} label="Payouts">
          <Wallet className="size-5" aria-hidden />
        </NavIcon>
        <NavIcon href={`${base}/branding`} active={seg === "branding"} label="Brand">
          <Palette className="size-5" aria-hidden />
        </NavIcon>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex h-14 flex-1 flex-col gap-0.5 px-1 py-2 text-[11px] font-medium",
                ["pricing", "billing", "team", "account"].includes(seg) ? "text-accent-foreground" : "",
              )}
              aria-label="More navigation"
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-md mx-auto",
                  ["pricing", "billing", "team", "account"].includes(seg) ? "bg-accent" : "",
                )}
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </span>
              <span>More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <ul className="mt-4 flex flex-col gap-1 pb-4">
              <li>
                <Button variant="ghost" className="h-12 w-full justify-start gap-3" asChild>
                  <Link href={`${base}/pricing`}>
                    <LayoutGrid className="size-4" />
                    Plan pricing
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="h-12 w-full justify-start gap-3" asChild>
                  <Link href={`${base}/billing`}>
                    <CreditCard className="size-4" />
                    Billing
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="h-12 w-full justify-start gap-3" asChild>
                  <Link href={`${base}/team`}>
                    <Users className="size-4" />
                    Team
                  </Link>
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="h-12 w-full justify-start gap-3" asChild>
                  <Link href={`${base}/account`}>
                    <Settings2 className="size-4" />
                    Account
                  </Link>
                </Button>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
