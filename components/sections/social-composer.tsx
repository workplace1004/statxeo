"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Facebook, Instagram, Twitter, Linkedin, Youtube,
  Send, Clock, ImagePlus, Loader2, CheckCircle2,
  Share2, X, Upload, AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialAccount = {
  id: string
  outstand_account_id: string
  provider: string
  display_name: string | null
}

type UploadedMedia = {
  url: string
  path: string
  type: string
  name: string
  size: number
}

type ProviderMeta = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  charLimit: number
}

// ─── Provider Config ──────────────────────────────────────────────────────────

const PROVIDER_META: Record<string, ProviderMeta> = {
  facebook:  { name: "Facebook",    icon: Facebook,  color: "bg-[#1877F2]", charLimit: 63206 },
  instagram: { name: "Instagram",   icon: Instagram, color: "bg-[#E4405F]", charLimit: 2200  },
  twitter:   { name: "X (Twitter)", icon: Twitter,   color: "bg-[#000000]", charLimit: 280   },
  linkedin:  { name: "LinkedIn",    icon: Linkedin,  color: "bg-[#0A66C2]", charLimit: 3000  },
  youtube:   { name: "YouTube",     icon: Youtube,   color: "bg-[#FF0000]", charLimit: 5000  },
}

function getMeta(provider: string): ProviderMeta {
  return PROVIDER_META[provider.toLowerCase()] ?? {
    name: provider, icon: Share2, color: "bg-slate-500", charLimit: 5000,
  }
}

// ─── Platform Toggle ──────────────────────────────────────────────────────────

function PlatformToggle({ account, selected, onToggle }: {
  account: SocialAccount; selected: boolean; onToggle: () => void
}) {
  const meta = getMeta(account.provider)
  const Icon = meta.icon
  return (
    <button type="button" onClick={onToggle}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
        selected
          ? "border-transparent ring-2 ring-offset-2 ring-primary bg-primary text-white shadow-md scale-105"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}>
      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.color} text-white`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="truncate max-w-[100px]">{account.display_name || meta.name}</span>
      {selected && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
    </button>
  )
}

// ─── Media Upload Zone ────────────────────────────────────────────────────────

function MediaUploadZone({ media, onAdd, onRemove, uploading }: {
  media: UploadedMedia[]
  onAdd: (files: FileList) => void
  onRemove: (path: string) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-all ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-slate-400" />
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {uploading ? "Uploading..." : "Drag & drop images/videos here, or click to browse"}
        </p>
        <p className="text-xs text-slate-400">PNG, JPG, GIF, WEBP, MP4 — max 10MB each</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,video/mp4,video/quicktime"
          multiple
          onChange={(e) => e.target.files && onAdd(e.target.files)}
        />
      </div>

      {/* Uploaded previews */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((m) => (
            <div key={m.path} className="relative group">
              {m.type.startsWith("image/") ? (
                <img
                  src={m.url}
                  alt={m.name}
                  className="h-20 w-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                  <span className="text-xs text-slate-400 text-center px-1">Video</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(m.path)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function PostPreview({ content, media, selectedAccounts }: {
  content: string; media: UploadedMedia[]; selectedAccounts: SocialAccount[]
}) {
  if (!content.trim() && media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-12 text-center text-muted-foreground h-full">
        <Share2 className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">Write something to see a preview</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {selectedAccounts.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-8">Select platforms to preview</p>
      ) : (
        selectedAccounts.map((account) => {
          const meta = getMeta(account.provider)
          const Icon = meta.icon
          const overLimit = content.length > meta.charLimit
          return (
            <div key={account.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-2 ${meta.color} text-white text-xs font-semibold`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.name} Preview
              </div>
              <div className="p-4 space-y-3 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full ${meta.color} flex items-center justify-center text-white text-xs font-bold`}>A</div>
                  <div>
                    <p className="text-xs font-semibold">{account.display_name || meta.name}</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
                {content && (
                  <p className={`text-sm whitespace-pre-wrap break-words ${overLimit ? "text-red-500" : ""}`}>
                    {content.length > meta.charLimit ? content.slice(0, meta.charLimit) + "..." : content}
                  </p>
                )}
                {overLimit && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ Exceeds {meta.name} limit ({content.length}/{meta.charLimit})
                  </p>
                )}
                {media.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {media.slice(0, 4).map((m) =>
                      m.type.startsWith("image/") ? (
                        <img key={m.path} src={m.url} alt={m.name}
                          className="w-full h-28 object-cover rounded-lg" />
                      ) : (
                        <div key={m.path} className="h-28 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-400">Video</div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Main Composer ────────────────────────────────────────────────────────────

export function SocialComposer() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [content, setContent] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/white-labeler/social/accounts")
        const data = await res.json()
        setAccounts(data.accounts ?? [])
      } catch { /* silently fail */ }
      finally { setLoadingAccounts(false) }
    }
    load()
  }, [])

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleMediaAdd = useCallback(async (files: FileList) => {
    setUploadingMedia(true)
    const uploaded: UploadedMedia[] = []
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/white-labeler/social/media", { method: "POST", body: fd })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || `Failed to upload ${file.name}`)
          continue
        }
        const data = await res.json()
        uploaded.push(data)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setMedia((prev) => [...prev, ...uploaded])
    setUploadingMedia(false)
  }, [])

  const handleMediaRemove = useCallback(async (path: string) => {
    setMedia((prev) => prev.filter((m) => m.path !== path))
    try {
      await fetch("/api/white-labeler/social/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      })
    } catch { /* ignore — file will be cleaned up later */ }
  }, [])

  const selectedAccounts = accounts.filter((a) => selectedIds.has(a.id))
  const activeCharLimit = selectedAccounts.length > 0
    ? Math.min(...selectedAccounts.map((a) => getMeta(a.provider).charLimit))
    : 63206

  const charColor =
    content.length > activeCharLimit ? "text-red-500" :
    content.length > activeCharLimit * 0.9 ? "text-amber-500" : "text-slate-400"

  const handlePublish = async (mode: "now" | "schedule") => {
    setSuccessMsg(""); setErrorMsg("")
    if (!content.trim() && media.length === 0) return toast.error("Add some content or media first.")
    if (selectedIds.size === 0) return toast.error("Select at least one platform.")
    if (mode === "schedule" && !scheduledAt) return toast.error("Set a schedule date/time.")
    setPublishing(true)
    try {
      const res = await fetch("/api/white-labeler/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrls: media.map((m) => m.url),
          accountIds: Array.from(selectedIds),
          scheduledAt: mode === "schedule" ? new Date(scheduledAt).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to publish")
      setContent(""); setSelectedIds(new Set()); setScheduledAt(""); setMedia([])
      const msg = mode === "schedule"
        ? "Post scheduled! It will go live at your chosen time."
        : "Post sent! It will appear on your social accounts shortly."
      setSuccessMsg(msg)
      toast.success(mode === "schedule" ? "Post scheduled!" : "Post published!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      setErrorMsg(msg); toast.error(msg)
    } finally { setPublishing(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Unified Composer</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Write once, publish everywhere.</p>
      </div>

      {successMsg && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Composer ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Platform Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform Selection</CardTitle>
              <CardDescription>Choose which accounts to post to.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading accounts...
                </div>
              ) : accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No accounts connected.{" "}
                  <a href="/white-labeler/social?tab=connections" className="underline text-primary">
                    Connect one first →
                  </a>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((account) => (
                    <PlatformToggle key={account.id} account={account}
                      selected={selectedIds.has(account.id)} onToggle={() => toggleAccount(account.id)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Caption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea placeholder="What do you want to share today?"
                value={content} onChange={(e) => setContent(e.target.value)}
                rows={6} className="resize-none text-sm leading-relaxed" disabled={publishing} />
              <div className={`text-right text-xs font-mono ${charColor}`}>
                {content.length} / {activeCharLimit.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImagePlus className="h-4 w-4" /> Media
              </CardTitle>
              <CardDescription>Images and videos attached to the post.</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaUploadZone media={media} onAdd={handleMediaAdd}
                onRemove={handleMediaRemove} uploading={uploadingMedia} />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Schedule (Optional)
              </CardTitle>
              <CardDescription>Leave blank to publish immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <Input type="datetime-local" value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1" disabled={publishing}
                  min={new Date().toISOString().slice(0, 16)} />
                {scheduledAt && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                    onClick={() => setScheduledAt("")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2"
              onClick={() => handlePublish("now")}
              disabled={publishing || (!content.trim() && media.length === 0) || selectedIds.size === 0}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Now
            </Button>
            <Button variant="outline" className="flex-1 gap-2"
              onClick={() => handlePublish("schedule")}
              disabled={publishing || (!content.trim() && media.length === 0) || selectedIds.size === 0 || !scheduledAt}>
              <Clock className="h-4 w-4" /> Schedule
            </Button>
          </div>
        </div>

        {/* ── Right: Preview ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Live Preview</h3>
            {selectedAccounts.length > 0 && (
              <Badge variant="secondary">
                {selectedAccounts.length} platform{selectedAccounts.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <PostPreview content={content} media={media} selectedAccounts={selectedAccounts} />
        </div>
      </div>
    </div>
  )
}
