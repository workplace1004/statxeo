"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCcw, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  CustomerApiError,
  fetchSupportOpsMessages,
  fetchSupportOpsThreads,
  sendSupportOpsMessage,
  type SupportMessage,
  type SupportOpsThread,
} from "@/lib/statxeo/customer-client"
import { cn } from "@/lib/utils"

type ThreadStatusFilter = "open" | "closed" | "all"

function formatDateTime(value: string | null | undefined) {
  if (!value) return ""
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return ""
  return new Date(parsed).toLocaleString()
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof CustomerApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function CustomerSupportOpsSection() {
  const [statusFilter, setStatusFilter] = useState<ThreadStatusFilter>("open")
  const [threads, setThreads] = useState<SupportOpsThread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [threadsError, setThreadsError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState("")

  const [composeBody, setComposeBody] = useState("")
  const [isSending, setIsSending] = useState(false)

  const [isForbidden, setIsForbidden] = useState(false)

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  )

  const loadThreads = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setThreadsLoading(true)
      }

      setThreadsError("")

      try {
        const response = await fetchSupportOpsThreads({ status: statusFilter, limit: 100 })
        setThreads(response)
        setIsForbidden(false)

        setSelectedThreadId((prev) => {
          if (response.length === 0) return null
          if (prev && response.some((item) => item.id === prev)) return prev
          return response[0].id
        })
      } catch (error) {
        if (error instanceof CustomerApiError && error.status === 403) {
          setIsForbidden(true)
        }
        setThreads([])
        setThreadsError(describeError(error, "Failed to load support threads."))
      } finally {
        if (!options?.silent) {
          setThreadsLoading(false)
        }
      }
    },
    [statusFilter],
  )

  const loadMessages = useCallback(async (threadId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setMessagesLoading(true)
    }

    setMessagesError("")

    try {
      const response = await fetchSupportOpsMessages({ thread_id: threadId, limit: 300 })
      setMessages(response)
      setIsForbidden(false)
    } catch (error) {
      if (error instanceof CustomerApiError && error.status === 403) {
        setIsForbidden(true)
      }
      setMessages([])
      setMessagesError(describeError(error, "Failed to load support messages."))
    } finally {
      if (!options?.silent) {
        setMessagesLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!selectedThreadId || isForbidden) {
      setMessages([])
      return
    }

    void loadMessages(selectedThreadId)
  }, [isForbidden, loadMessages, selectedThreadId])

  useEffect(() => {
    if (!selectedThreadId || isForbidden) return

    const interval = setInterval(() => {
      void loadMessages(selectedThreadId, { silent: true })
    }, 15000)

    return () => clearInterval(interval)
  }, [isForbidden, loadMessages, selectedThreadId])

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      await loadThreads()

      if (selectedThreadId) {
        await loadMessages(selectedThreadId)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmed = composeBody.trim()
    if (!trimmed || !selectedThreadId || isSending) {
      return
    }

    setIsSending(true)
    setMessagesError("")

    try {
      const sentMessage = await sendSupportOpsMessage({
        thread_id: selectedThreadId,
        body: trimmed,
      })

      setMessages((prev) => [...prev, sentMessage])
      setComposeBody("")
      await loadThreads({ silent: true })
    } catch (error) {
      if (error instanceof CustomerApiError && error.status === 403) {
        setIsForbidden(true)
      }
      setMessagesError(describeError(error, "Failed to send support message."))
    } finally {
      setIsSending(false)
    }
  }

  if (isForbidden) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-10 text-slate-950 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50">
        <div className="mx-auto max-w-5xl">
          <Card className="border-amber-300 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle>Support staff access required</CardTitle>
              <CardDescription>
                Your account is authenticated but does not have support operations permissions. Contact an administrator if this is unexpected.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-10 text-slate-950 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Support Ops</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Monitor customer support threads and reply as staff.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="overflow-hidden border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
            <CardHeader className="space-y-4 pb-4">
              <CardTitle className="text-lg">Threads</CardTitle>
              <div className="flex gap-2">
                {(["open", "closed", "all"] as ThreadStatusFilter[]).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={statusFilter === value ? "default" : "outline"}
                    onClick={() => setStatusFilter(value)}
                  >
                    {value[0].toUpperCase() + value.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {threadsLoading ? (
                <div className="flex h-[540px] items-center justify-center gap-3">
                  <Spinner />
                  <span>Loading threads...</span>
                </div>
              ) : threadsError ? (
                <div className="p-4 text-sm text-red-700 dark:text-red-300">{threadsError}</div>
              ) : threads.length === 0 ? (
                <div className="p-4 text-sm text-slate-600 dark:text-slate-400">No threads found.</div>
              ) : (
                <ScrollArea className="h-[540px]">
                  <div className="space-y-1 p-2">
                    {threads.map((thread) => {
                      const isSelected = selectedThreadId === thread.id
                      return (
                        <button
                          type="button"
                          key={thread.id}
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={cn(
                            "w-full rounded-md border p-3 text-left transition",
                            isSelected
                              ? "border-cyan-300 bg-cyan-50 dark:border-cyan-500/50 dark:bg-cyan-900/20"
                              : "border-transparent hover:border-slate-200 hover:bg-slate-100/70 dark:hover:border-slate-700 dark:hover:bg-slate-800/60",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{thread.subject || "Support Request"}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                                thread.status === "closed"
                                  ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
                              )}
                            >
                              {thread.status}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                            {thread.last_message_preview || "No messages yet."}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {formatDateTime(thread.last_message_created_at || thread.updated_at || thread.created_at)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-[640px] flex-col overflow-hidden border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
            <CardHeader className="border-b border-slate-200/80 dark:border-slate-800">
              <CardTitle className="text-lg">
                {selectedThread ? selectedThread.subject || "Support Request" : "Select a thread"}
              </CardTitle>
              <CardDescription>
                {selectedThread
                  ? `${selectedThread.customer_email || "Unknown customer"}${selectedThread.lead_id ? ` - lead ${selectedThread.lead_id.slice(0, 8)}` : ""}`
                  : "Choose a thread from the left panel to view messages."}
              </CardDescription>
            </CardHeader>

            <div className="flex-1 overflow-hidden">
              {!selectedThread ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                  Select a thread to open the timeline.
                </div>
              ) : messagesLoading ? (
                <div className="flex h-full items-center justify-center gap-3">
                  <Spinner />
                  <span>Loading messages...</span>
                </div>
              ) : messagesError ? (
                <div className="p-4 text-sm text-red-700 dark:text-red-300">{messagesError}</div>
              ) : (
                <ScrollArea className="h-[460px]">
                  <div className="space-y-3 p-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No messages yet.</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn("flex", message.is_from_staff ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              message.is_from_staff
                                ? "bg-cyan-600 text-white"
                                : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <p
                              className={cn(
                                "mt-1 text-[11px]",
                                message.is_from_staff ? "text-cyan-100" : "text-slate-600 dark:text-slate-300",
                              )}
                            >
                              {message.is_from_staff ? "Staff" : "Customer"} - {formatDateTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
              <div className="flex items-end gap-3">
                <Textarea
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  placeholder="Write a staff reply"
                  rows={3}
                  maxLength={4000}
                  className="resize-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault()
                      void handleSendMessage()
                    }
                  }}
                  disabled={!selectedThread || isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!selectedThread || isSending || composeBody.trim().length === 0}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Press Cmd/Ctrl+Enter to send.</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
