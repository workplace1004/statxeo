"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Share2,
  AlertCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  BarChart3,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Eye,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ─── Types ────────────────────────────────────────────────────────────────────

type Analytics = {
  likes?: number
  comments?: number
  shares?: number
  reach?: number
  engagements?: number
}

type Post = {
  id: string
  content: string
  platforms: string[]
  status: "pending" | "scheduled" | "published" | "failed" | "cancelled"
  scheduled_at: string | null
  published_at: string | null
  error_message: string | null
  created_at: string
  media_urls: string[]
  metadata: {
    last_analytics?: Analytics
    analytics_updated_at?: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PlatformIcon({ provider }: { provider: string }) {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  }
  const colorMap: Record<string, string> = {
    facebook: "bg-[#1877F2]",
    instagram: "bg-[#E4405F]",
    twitter: "bg-[#000000]",
    linkedin: "bg-[#0A66C2]",
    youtube: "bg-[#FF0000]",
  }
  const Icon = map[provider.toLowerCase()] ?? Share2
  const color = colorMap[provider.toLowerCase()] ?? "bg-slate-500"
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md ${color} text-white`} title={provider}>
      <Icon className="h-3 w-3" />
    </span>
  )
}

function StatusBadge({ status }: { status: Post["status"] }) {
  const config: Record<Post["status"], { label: string; className: string; icon: React.ReactNode }> = {
    published: {
      label: "Published",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    scheduled: {
      label: "Scheduled",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
      icon: <Clock className="h-3 w-3" />,
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
      icon: <XCircle className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0",
      icon: <XCircle className="h-3 w-3" />,
    },
  }
  const c = config[status]
  return (
    <Badge className={`gap-1 ${c.className}`}>
      {c.icon}
      {c.label}
    </Badge>
  )
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ─── Analytics Panel ─────────────────────────────────────────────────────────

function AnalyticsPanel({ postId, initialStats, onUpdate }: { 
  postId: string; 
  initialStats?: Analytics;
  onUpdate: (stats: Analytics) => void
}) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Analytics | undefined>(initialStats)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/white-labeler/social/posts/${postId}/analytics`)
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        onUpdate(data.stats)
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  const StatItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value?: number, color: string }) => (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
      <Icon className={`h-4 w-4 ${color} mb-1`} />
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{value?.toLocaleString() ?? "0"}</span>
    </div>
  )

  return (
    <div className="p-4 w-64 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Engagement
        </h4>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatItem icon={ThumbsUp} label="Likes" value={stats?.likes} color="text-blue-500" />
        <StatItem icon={MessageSquare} label="Comments" value={stats?.comments} color="text-emerald-500" />
        <StatItem icon={Repeat2} label="Shares" value={stats?.shares} color="text-purple-500" />
        <StatItem icon={Eye} label="Reach" value={stats?.reach} color="text-amber-500" />
      </div>
      
      {!stats && !loading && (
        <p className="text-[10px] text-center text-slate-400 italic">No data yet. Click refresh to pull stats.</p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SocialPostHistory() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/white-labeler/social/posts")
      if (!res.ok) throw new Error("Failed to load posts")
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      setError("Could not load post history.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const updatePostStats = (postId: string, stats: Analytics) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, metadata: { ...p.metadata, last_analytics: stats, analytics_updated_at: new Date().toISOString() } } 
        : p
    ))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Post History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track the delivery status of all content sent through the platform.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <Share2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 font-medium">No posts yet</p>
          <p className="text-slate-400 text-xs mt-1">Posts you send from the Composer will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {(post.platforms ?? []).map((p, i) => (
                      <PlatformIcon key={i} provider={p} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={post.status} />
                  {post.status === "published" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1 hover:bg-primary/10 hover:text-primary transition-colors">
                          <BarChart3 className="h-3 w-3" />
                          Insights
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" align="end">
                        <AnalyticsPanel 
                          postId={post.id} 
                          initialStats={post.metadata?.last_analytics}
                          onUpdate={(stats) => updatePostStats(post.id, stats)}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Media Preview Grid */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {post.media_urls.map((url, i) => {
                      const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)
                      return (
                        <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                          {isVideo ? (
                            <div className="flex items-center justify-center h-full w-full">
                              <span className="text-[10px] font-bold text-slate-500">VIDEO</span>
                            </div>
                          ) : (
                            <img src={url} alt="Post media" className="h-full w-full object-cover" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Created: {formatDate(post.created_at)}</span>
                  {post.scheduled_at && <span>Scheduled: {formatDate(post.scheduled_at)}</span>}
                  {post.published_at && <span>Published: {formatDate(post.published_at)}</span>}
                  {post.status === "failed" && post.error_message && (
                    <span className="text-red-500 font-medium">Error: {post.error_message}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
