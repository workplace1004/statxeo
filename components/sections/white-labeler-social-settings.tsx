"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const SOCIAL_PROVIDERS = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-[#1877F2]", description: "Post to Pages" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-[#E4405F]", description: "Business Profiles" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "bg-[#000000]", description: "Post Tweets" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-[#0A66C2]", description: "Personal & Company" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "bg-[#FF0000]", description: "Video & Shorts" },
]

export function WhiteLabelerSocialSettings() {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = async (provider: string) => {
    setConnecting(provider)
    try {
      const response = await fetch("/api/white-labeler/social/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider })
      })

      if (!response.ok) {
        throw new Error("Failed to get connection URL")
      }

      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Social Connections</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Connect your agency's social accounts to start publishing content.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_PROVIDERS.map((provider) => (
          <Card key={provider.id} className="group overflow-hidden border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className={`p-2.5 rounded-xl ${provider.color} text-white shadow-sm`}>
                <provider.icon className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                Ready
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-xl">{provider.name}</CardTitle>
                  <CardDescription className="mt-1">{provider.description}</CardDescription>
                </div>
                
                <Button 
                  onClick={() => handleConnect(provider.id)}
                  disabled={connecting !== null}
                  className="w-full gap-2 rounded-xl"
                  variant={connecting === provider.id ? "secondary" : "default"}
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
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <Link2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Unified Connection Engine</CardTitle>
              <CardDescription>
                Connect once, post everywhere. Your tokens are encrypted and managed securely.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
