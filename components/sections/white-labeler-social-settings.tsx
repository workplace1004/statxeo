"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Plus, 
  Link2, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { Chip } from "@heroui/react"
import { PortalActionButton, PortalSurfaceCard } from "@/components/portal/portal-primitives"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

const SOCIAL_PROVIDERS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-[#1877F2]", description: "Post to Pages" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-[#E4405F]", description: "Business Profiles" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "bg-[#000000]", description: "Post Tweets" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-[#0A66C2]", description: "Personal & Company" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-[#FF0000]", description: "Video & Shorts" },
]

const PRIMARY_PROVIDER_ROW = SOCIAL_PROVIDERS.slice(0, 3)
const SECONDARY_PROVIDER_ROW = SOCIAL_PROVIDERS.slice(3)

export function WhiteLabelerSocialSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connecting, setConnecting] = useState<string | null>(null)
  const status = searchParams.get("status")
  const message = searchParams.get("message")

  const handleConnect = async (provider: string) => {
    setConnecting(provider)
    try {
      const response = await fetch("/api/white-labeler/social/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Failed to get connection URL")
      }

      const data = await response.json()
      if (data.authUrl) {
        router.push(data.authUrl)
      } else {
        throw new Error("No URL returned from server")
      }
    } catch (error) {
      console.error("Connection error:", error)
      toast.error(`Failed to connect ${provider}. Please try again.`)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {status === "success" ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Social account connected</AlertTitle>
          <AlertDescription>{message || "Your social account was connected successfully."}</AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>{message || "We could not connect that social account."}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <h2 className="mt-0 text-3xl font-bold tracking-tight text-[var(--foreground)]">Social Connections</h2>
        <p className="text-[var(--muted-foreground)]">
          Connect your agency&apos;s social accounts to start publishing content.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PRIMARY_PROVIDER_ROW.map((provider) => (
            <PortalSurfaceCard key={provider.id} title={provider.name} description={provider.description} className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`glass-icon-tile rounded-[10px] p-2.5 ${provider.color} text-white`}>
                    <provider.icon className="h-5 w-5" />
                  </div>
                  <Chip size="sm" variant="soft" color="default">Available</Chip>
                </div>

                <PortalActionButton
                  onPress={() => handleConnect(provider.id)}
                  isDisabled={connecting !== null}
                  className="w-full justify-center rounded-[10px] border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-white/6 dark:text-white/92 dark:hover:bg-white/10"
                  variant="outline"
                >
                  {connecting === provider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Connect {provider.name}
                    </>
                  )}
                </PortalActionButton>
              </div>
            </PortalSurfaceCard>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:mx-auto xl:max-w-3xl">
          {SECONDARY_PROVIDER_ROW.map((provider) => (
            <PortalSurfaceCard key={provider.id} title={provider.name} description={provider.description} className="group h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`glass-icon-tile rounded-[10px] p-2.5 ${provider.color} text-white`}>
                    <provider.icon className="h-5 w-5" />
                  </div>
                  <Chip size="sm" variant="soft" color="default">Available</Chip>
                </div>

                <PortalActionButton
                  onPress={() => handleConnect(provider.id)}
                  isDisabled={connecting !== null}
                  className="w-full justify-center rounded-[10px] border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-white/6 dark:text-white/92 dark:hover:bg-white/10"
                  variant="outline"
                >
                  {connecting === provider.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Connect {provider.name}
                    </>
                  )}
                </PortalActionButton>
              </div>
            </PortalSurfaceCard>
          ))}
        </div>
      </div>

      <div className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-[var(--surface)]/40">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-[10px] border border-slate-200 bg-white p-2 shadow-sm dark:glass-icon-tile dark:border-white/10 dark:bg-transparent">
            <Link2 className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Unified Connection Engine</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Connect once, post everywhere. Your tokens are encrypted and managed securely.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-[10px] border border-slate-200 bg-white p-2 shadow-sm dark:glass-icon-tile dark:border-white/10 dark:bg-transparent">
            <Link2 className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            The shared admin shell is now aligned with the broader portal system, so future composer and history work can inherit the same table, modal, and command patterns.
          </p>
        </div>
      </div>
    </div>
  )
}
