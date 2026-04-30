"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, LogOut, RefreshCcw, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import {
  fetchCustomerOverview,
  fetchCustomerOrders,
  fetchCustomerWorkflow,
  fetchCustomerDocuments,
  fetchCustomerSupportThread,
  ensureCustomerSupportThread,
  fetchCustomerSupportMessages,
  sendCustomerSupportMessage,
  CustomerApiError,
  type CustomerOverviewResponse,
  type CustomerOrder,
  type CustomerWorkflow,
  type CustomerDocument,
  type SupportMessage,
  type SupportThread,
} from "@/lib/statxeo/customer-client"

import {
  fetchSiteProjects,
  type SiteProject,
} from "@/lib/statxeo/site-project-client"

type TabValue = "overview" | "orders" | "progress" | "documents" | "support" | "website"

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  awaiting_purchase: { label: "Awaiting Purchase", variant: "outline" },
  awaiting_preferences: { label: "Setup Required", variant: "default" },
  assets_pending: { label: "Upload Assets", variant: "default" },
  ready_for_generation: { label: "Ready to Generate", variant: "default" },
  generating: { label: "Generating...", variant: "secondary" },
  preview_ready: { label: "Preview Ready", variant: "default" },
  changes_requested: { label: "Changes Requested", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  production_deploying: { label: "Deploying...", variant: "secondary" },
  live: { label: "Live", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof CustomerApiError) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function CustomerPortalSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Overview state
  const [overviewData, setOverviewData] = useState<CustomerOverviewResponse | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState("")

  // Orders state
  const [ordersData, setOrdersData] = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState("")

  // Workflow state
  const [workflowData, setWorkflowData] = useState<CustomerWorkflow | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [workflowError, setWorkflowError] = useState("")

  // Documents state
  const [documentsData, setDocumentsData] = useState<CustomerDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState("")

  // Support state
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [messagesError, setMessagesError] = useState("")
  const [messageText, setMessageText] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // Website state
  const [websiteProjects, setWebsiteProjects] = useState<SiteProject[]>([])
  const [websiteLoading, setWebsiteLoading] = useState(true)

  // Load overview on mount
  useEffect(() => {
    async function loadOverview() {
      setOverviewLoading(true)
      setOverviewError("")
      try {
        const data = await fetchCustomerOverview()
        setOverviewData(data)
      } catch (error) {
        setOverviewError(getErrorMessage(error, "Failed to load overview"))
      } finally {
        setOverviewLoading(false)
      }
    }

    loadOverview()
  }, [])

  // Load orders on mount
  useEffect(() => {
    async function loadOrders() {
      setOrdersLoading(true)
      setOrdersError("")
      try {
        const data = await fetchCustomerOrders()
        setOrdersData(data)
      } catch (error) {
        setOrdersError(getErrorMessage(error, "Failed to load orders"))
        setOrdersData([])
      } finally {
        setOrdersLoading(false)
      }
    }

    loadOrders()
  }, [])

  // Load workflow on mount
  useEffect(() => {
    async function loadWorkflow() {
      setWorkflowLoading(true)
      setWorkflowError("")
      try {
        const data = await fetchCustomerWorkflow()
        setWorkflowData(data)
      } catch (error) {
        setWorkflowError(getErrorMessage(error, "Failed to load workflow"))
        setWorkflowData(null)
      } finally {
        setWorkflowLoading(false)
      }
    }

    loadWorkflow()
  }, [])

  // Load documents on mount
  useEffect(() => {
    async function loadDocuments() {
      setDocumentsLoading(true)
      setDocumentsError("")
      try {
        const data = await fetchCustomerDocuments()
        setDocumentsData(data)
      } catch (error) {
        setDocumentsError(getErrorMessage(error, "Failed to load documents"))
        setDocumentsData([])
      } finally {
        setDocumentsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  // Initialize and load support thread
  useEffect(() => {
    async function initializeSupport() {
      setMessagesLoading(true)
      setMessagesError("")
      try {
        let thread: SupportThread | null = null
        try {
          thread = await fetchCustomerSupportThread()
        } catch {
          // Fallback to creating a new thread if fetch fails
          thread = await ensureCustomerSupportThread()
        }

        if (!thread) {
          thread = await ensureCustomerSupportThread()
        }

        setThreadId(thread.id)

        const msgs = await fetchCustomerSupportMessages({ thread_id: thread.id })
        setMessages(msgs)
      } catch (error) {
        setMessagesError(getErrorMessage(error, "Failed to load support thread"))
        setMessages([])
      } finally {
        setMessagesLoading(false)
      }
    }

    initializeSupport()
  }, [])

  // Load website projects on mount
  useEffect(() => {
    async function loadWebsiteProjects() {
      setWebsiteLoading(true)
      try {
        const data = await fetchSiteProjects()
        setWebsiteProjects(data)
      } catch {
        setWebsiteProjects([])
      } finally {
        setWebsiteLoading(false)
      }
    }

    loadWebsiteProjects()
  }, [])

  // Set up realtime subscription for messages when thread is ready
  useEffect(() => {
    if (!threadId) return

    const currentThreadId = threadId

    let pollIntervalId: NodeJS.Timeout | null = null
    let unsubscribe: (() => void) | null = null

    async function setupRealtimeSubscription() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Attempt realtime subscription
        const channel = (supabase
          .channel(`support-messages-${currentThreadId}`) as ReturnType<typeof supabase.channel> & {
            on: (
              event: "postgres_changes",
              filter: {
                event: "INSERT"
                schema: string
                table: string
                filter: string
              },
              callback: (payload: { new?: SupportMessage | null }) => void,
            ) => ReturnType<typeof supabase.channel>
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "statxeo_support_messages",
              filter: `thread_id=eq.${currentThreadId}`,
            },
            (payload: { new?: SupportMessage | null }) => {
              const nextMessage = payload.new

              if (nextMessage) {
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === nextMessage.id)
                  if (exists) return prev
                  return [...prev, nextMessage]
                })
              }
            },
          )
          .subscribe()

        unsubscribe = () => channel.unsubscribe()
      } catch {
        // Realtime subscription failed; polling will handle it
      }

      // Set up polling fallback
      pollIntervalId = setInterval(async () => {
        try {
          const msgs = await fetchCustomerSupportMessages({ thread_id: currentThreadId })
          setMessages(msgs)
        } catch {
          // Poll failed silently; thread will try again
        }
      }, 15000)
    }

    setupRealtimeSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
      if (pollIntervalId) clearInterval(pollIntervalId)
    }
  }, [threadId])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      if (activeTab === "overview") {
        const data = await fetchCustomerOverview()
        setOverviewData(data)
      } else if (activeTab === "orders") {
        const data = await fetchCustomerOrders()
        setOrdersData(data)
      } else if (activeTab === "progress") {
        const data = await fetchCustomerWorkflow()
        setWorkflowData(data)
      } else if (activeTab === "documents") {
        const data = await fetchCustomerDocuments()
        setDocumentsData(data)
      } else if (activeTab === "support" && threadId) {
        const msgs = await fetchCustomerSupportMessages({ thread_id: threadId })
        setMessages(msgs)
      } else if (activeTab === "website") {
        const data = await fetchSiteProjects()
        setWebsiteProjects(data)
      }
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [activeTab, threadId])

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      router.replace("/customer/login")
      router.refresh()
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !threadId) return

    setIsSendingMessage(true)
    try {
      const response = await sendCustomerSupportMessage({
        thread_id: threadId,
        body: messageText.trim(),
      })
      setMessages((prev) => [...prev, response])
      setMessageText("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 text-slate-950 dark:from-slate-950 dark:to-slate-900 dark:text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Portal</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your orders, workflow, and support</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="website" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website
            </TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {overviewLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span>Loading overview...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {overviewError && (
              <Card className="neo-surface border-red-200 bg-red-50/50 backdrop-blur dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="py-4">
                  <p className="text-red-700 dark:text-red-200">{overviewError}</p>
                </CardContent>
              </Card>
            )}

            {overviewData && !overviewLoading && (
              <div className="space-y-4">
                <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                  <CardHeader>
                    <CardTitle>Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {overviewData.packages && overviewData.packages.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {overviewData.packages.map((pkg) => (
                          <div key={pkg.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                            <p className="font-semibold">{pkg.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Status: <span className="font-medium capitalize">{pkg.status}</span>
                            </p>
                            {pkg.expires_at && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Expires: {new Date(pkg.expires_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400">No active packages</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="space-y-4">
            {websiteLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span>Loading website project...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!websiteLoading && websiteProjects.length === 0 && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Globe className="mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No Website Project Yet</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your website project will appear here after your purchase is confirmed.
                  </p>
                </CardContent>
              </Card>
            )}

            {!websiteLoading && websiteProjects.length > 0 && (
              <div className="space-y-4">
                {websiteProjects.map((project) => {
                  const statusInfo = STATUS_LABELS[project.status] ?? { label: project.status, variant: "outline" as const }
                  return (
                    <Card key={project.id} className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{project.business_name ?? "Website Project"}</CardTitle>
                            <CardDescription className="capitalize">
                              {project.package_tier.replace("statxeo_", "")} package
                            </CardDescription>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => router.push("/customer/website")}
                          className="gap-2"
                        >
                          <Globe className="h-4 w-4" />
                          {project.status === "awaiting_preferences" || project.status === "assets_pending"
                            ? "Complete Setup"
                            : project.status === "preview_ready" || project.status === "changes_requested"
                              ? "View Preview"
                              : project.status === "live"
                                ? "View Website"
                                : "View Details"}
                        </Button>
                        {project.preview_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.preview_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                              Preview
                            </a>
                          </Button>
                        )}
                        {project.production_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.production_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                              Live Site
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span>Loading orders...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {ordersError && (
              <Card className="neo-surface border-red-200 bg-red-50/50 backdrop-blur dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="py-4">
                  <p className="text-red-700 dark:text-red-200">{ordersError}</p>
                </CardContent>
              </Card>
            )}

            {!ordersLoading && ordersData.length === 0 && !ordersError && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">No orders found</p>
                </CardContent>
              </Card>
            )}

            {!ordersLoading && ordersData.length > 0 && (
              <div className="space-y-4">
                {ordersData.map((order) => (
                  <Card key={order.id} className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Order {order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>{new Date(order.created_at).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><span className="font-semibold">Package:</span> {order.package_name}</p>
                      <p><span className="font-semibold">Status:</span> <span className="capitalize">{order.status}</span></p>
                      {order.amount_cents && (
                        <p><span className="font-semibold">Amount:</span> ${(order.amount_cents / 100).toFixed(2)}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            {workflowLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span>Loading progress...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {workflowError && (
              <Card className="neo-surface border-red-200 bg-red-50/50 backdrop-blur dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="py-4">
                  <p className="text-red-700 dark:text-red-200">{workflowError}</p>
                </CardContent>
              </Card>
            )}

            {workflowData && !workflowLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardHeader>
                  <CardTitle>Website Build Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflowData.stages && workflowData.stages.length > 0 ? (
                    <div className="space-y-3">
                      {workflowData.stages.map((stage, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                          <div>
                            <p className="font-semibold">{stage.name}</p>
                            {stage.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">{stage.description}</p>
                            )}
                            {stage.completed_at && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Completed: {new Date(stage.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">No workflow stages</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {documentsLoading && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Spinner />
                    <span>Loading documents...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {documentsError && (
              <Card className="neo-surface border-red-200 bg-red-50/50 backdrop-blur dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="py-4">
                  <p className="text-red-700 dark:text-red-200">{documentsError}</p>
                </CardContent>
              </Card>
            )}

            {!documentsLoading && documentsData.length === 0 && !documentsError && (
              <Card className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">No documents available</p>
                </CardContent>
              </Card>
            )}

            {!documentsLoading && documentsData.length > 0 && (
              <div className="space-y-2">
                {documentsData.map((doc) => (
                  <Card key={doc.id} className="neo-surface border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-semibold">{doc.name}</p>
                        {doc.uploaded_at && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/api/customer/documents/download?document_id=${doc.id}`}
                      >
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card className="neo-surface flex h-[600px] flex-col border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
              <CardHeader>
                <CardTitle>Support Chat</CardTitle>
                <CardDescription>Message our support team</CardDescription>
              </CardHeader>

              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-3">
                      <Spinner />
                      <span>Loading messages...</span>
                    </div>
                  </div>
                ) : messagesError ? (
                  <div className="p-4">
                    <p className="text-red-700 dark:text-red-200">{messagesError}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-3 p-4">
                      {messages.length === 0 ? (
                        <p className="text-slate-600 dark:text-slate-400">No messages yet. Start the conversation!</p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex gap-3",
                              msg.is_from_staff ? "justify-start" : "justify-end"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-xs rounded-lg px-3 py-2",
                                msg.is_from_staff
                                  ? "bg-slate-200 dark:bg-slate-700"
                                  : "bg-blue-500 text-white dark:bg-blue-600"
                              )}
                            >
                              <p className="text-sm">{msg.body}</p>
                              <p className={cn(
                                "mt-1 text-xs",
                                msg.is_from_staff
                                  ? "text-slate-600 dark:text-slate-300"
                                  : "text-blue-100"
                              )}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-200 p-4 dark:border-slate-700">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        handleSendMessage()
                      }
                    }}
                    className="max-h-20 flex-1 resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                    size="sm"
                    className="h-auto gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingMessage ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
