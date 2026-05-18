"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, LogOut, RefreshCcw, Send } from "lucide-react"
import { Button as HeroButton, Chip, SearchField, Tabs } from "@heroui/react"

import {
  EmbeddedPortalShell,
  PortalActionButton,
  PortalEmptyState,
  PortalErrorState,
  PortalLoadingState,
  PortalStatCard,
  PortalSurfaceCard,
} from "@/components/portal/portal-primitives"
import { Spinner } from "@/components/ui/spinner"
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

type TabValue = "overview" | "orders" | "progress" | "documents" | "support"

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
  const [searchQuery, setSearchQuery] = useState("")
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

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredOrders = useMemo(() => {
    if (!normalizedSearch) return ordersData
    return ordersData.filter((order) => {
      return [order.id, order.package_name, order.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })
  }, [normalizedSearch, ordersData])

  const filteredDocuments = useMemo(() => {
    if (!normalizedSearch) return documentsData
    return documentsData.filter((doc) => {
      return [doc.name, doc.uploaded_at].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch))
    })
  }, [documentsData, normalizedSearch])

  const filteredMessages = useMemo(() => {
    if (!normalizedSearch) return messages
    return messages.filter((msg) => msg.body.toLowerCase().includes(normalizedSearch))
  }, [messages, normalizedSearch])

  const searchPlaceholder =
    activeTab === "orders"
      ? "Search orders"
      : activeTab === "documents"
        ? "Search documents"
        : activeTab === "support"
          ? "Search messages"
          : "Search this workspace"

  const activeTabLabel: Record<TabValue, string> = {
    overview: "Overview",
    orders: "Orders",
    progress: "Progress",
    documents: "Documents",
    support: "Support",
  }

  return (
    <EmbeddedPortalShell className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <section className="rounded-[16px] border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-transparent dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" color="default">Customer Portal</Chip>
              <Chip size="sm" variant="soft" color="default">{activeTabLabel[activeTab]}</Chip>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Manage orders, documents, and support</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-[15px]">
                Everything tied to your account lives in one workspace, with each section scoped to the task you need right now.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <PortalActionButton variant="outline" className="rounded-[10px] border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100" onPress={handleRefresh} isDisabled={isRefreshing}>
              <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </PortalActionButton>
            <PortalActionButton variant="danger-soft" className="rounded-[10px]" onPress={handleSignOut}>
              <LogOut className="size-4" />
              Sign out
            </PortalActionButton>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PortalStatCard
          label="Active packages"
          value={String(overviewData?.packages?.length ?? 0)}
          meta={overviewLoading ? "Loading account summary" : "Products currently tied to your account"}
        />
        <PortalStatCard
          label="Documents"
          value={String(documentsData.length)}
          meta={documentsLoading ? "Syncing files" : "Assets and downloadable deliverables"}
        />
        <PortalStatCard
          label="Support activity"
          value={String(messages.length)}
          meta={messagesLoading ? "Connecting support thread" : "Messages in your account thread"}
        />
      </div>

      <Tabs.Root
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(String(key) as TabValue)}
        className="w-full space-y-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs.List className="grid w-full grid-cols-2 gap-2 rounded-[14px] border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-white/5 dark:shadow-none md:grid-cols-3 xl:grid-cols-5">
                <Tabs.Tab id="overview">Overview</Tabs.Tab>
                <Tabs.Tab id="orders">Orders</Tabs.Tab>
                <Tabs.Tab id="progress">Progress</Tabs.Tab>
                <Tabs.Tab id="documents">Documents</Tabs.Tab>
                <Tabs.Tab id="support">Support</Tabs.Tab>
          </Tabs.List>

          <div className="flex flex-col gap-1 lg:min-w-[220px] lg:items-end">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{activeTabLabel[activeTab]}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Search stays scoped to this view.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{activeTabLabel[activeTab]}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Use this section to review only the details tied to the current task.</p>
          </div>
          {activeTab !== "overview" && activeTab !== "progress" ? (
            <SearchField.Root aria-label={searchPlaceholder} className="w-full md:max-w-sm" value={searchQuery} onChange={setSearchQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={searchPlaceholder} />
                <SearchField.ClearButton aria-label="Clear search" />
              </SearchField.Group>
            </SearchField.Root>
          ) : null}
        </div>

        <div>
          <Tabs.Panel id="overview" className="space-y-4">
                  {overviewLoading ? <PortalLoadingState label="Loading overview..." /> : null}

                  {overviewError ? <PortalErrorState title="Overview unavailable" message={overviewError} /> : null}

                  {overviewData && !overviewLoading ? (
                    <PortalSurfaceCard title="Account overview" description="Your packages and renewal timing live here; no fulfillment logic was changed.">
                      {overviewData.packages && overviewData.packages.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {overviewData.packages.map((pkg) => (
                            <div key={pkg.id} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/8 dark:bg-white/5">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{pkg.name}</p>
                                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pkg.status.replace(/_/g, " ")}</p>
                                </div>
                                <Chip size="sm" variant="soft" color="success">Active</Chip>
                              </div>
                              {pkg.expires_at ? (
                                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                  Expires {new Date(pkg.expires_at).toLocaleDateString()}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <PortalEmptyState title="No active packages" description="Once a package is attached to your account, it will show up here automatically." />
                      )}
                    </PortalSurfaceCard>
                  ) : null}
                  </Tabs.Panel>

                  <Tabs.Panel id="orders" className="space-y-4">
                  {ordersLoading ? <PortalLoadingState label="Loading orders..." /> : null}
                  {ordersError ? <PortalErrorState title="Orders unavailable" message={ordersError} /> : null}

                  {!ordersLoading && filteredOrders.length === 0 && !ordersError ? (
                    <PortalEmptyState
                      title={ordersData.length === 0 ? "No orders found" : "No matching orders"}
                      description={ordersData.length === 0 ? "Orders will appear here after checkout and fulfillment begin." : "Try a different order search term."}
                    />
                  ) : null}

                  {!ordersLoading && filteredOrders.length > 0 ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {filteredOrders.map((order) => (
                        <PortalSurfaceCard
                          key={order.id}
                          title={`Order ${order.id.slice(0, 8)}`}
                          description={new Date(order.created_at).toLocaleDateString()}
                        >
                          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/8">
                              <span>Package</span>
                              <span className="font-semibold text-slate-900 dark:text-white">{order.package_name}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/8">
                              <span>Status</span>
                              <Chip size="sm" variant="soft" color="accent">{order.status}</Chip>
                            </div>
                            {order.amount_cents ? (
                              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/8">
                                <span>Amount</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${(order.amount_cents / 100).toFixed(2)}</span>
                              </div>
                            ) : null}
                          </div>
                        </PortalSurfaceCard>
                      ))}
                    </div>
                  ) : null}
                  </Tabs.Panel>

                  <Tabs.Panel id="progress" className="space-y-4">
                  {workflowLoading ? <PortalLoadingState label="Loading progress..." /> : null}
                  {workflowError ? <PortalErrorState title="Progress unavailable" message={workflowError} /> : null}

                  {workflowData && !workflowLoading ? (
                    <PortalSurfaceCard title="Website build progress" description="Stages remain sourced from the current workflow endpoint.">
                      {workflowData.stages && workflowData.stages.length > 0 ? (
                        <div className="space-y-3">
                          {workflowData.stages.map((stage, idx) => (
                            <div key={idx} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 dark:border-white/8 dark:bg-white/5">
                              <div className="mt-1 size-2 rounded-full bg-sky-500" />
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900 dark:text-white">{stage.name}</p>
                                {stage.description ? <p className="text-sm text-slate-600 dark:text-slate-300">{stage.description}</p> : null}
                                {stage.completed_at ? (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Completed {new Date(stage.completed_at).toLocaleDateString()}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <PortalEmptyState title="No workflow stages" description="Stages will appear here as your delivery workflow advances." />
                      )}
                    </PortalSurfaceCard>
                  ) : null}
                  </Tabs.Panel>

                  <Tabs.Panel id="documents" className="space-y-4">
                  {documentsLoading ? <PortalLoadingState label="Loading documents..." /> : null}
                  {documentsError ? <PortalErrorState title="Documents unavailable" message={documentsError} /> : null}

                  {!documentsLoading && filteredDocuments.length === 0 && !documentsError ? (
                    <PortalEmptyState
                      title={documentsData.length === 0 ? "No documents available" : "No matching documents"}
                      description={documentsData.length === 0 ? "Assets and deliverables will appear here when they are ready." : "Try a different document search term."}
                    />
                  ) : null}

                  {!documentsLoading && filteredDocuments.length > 0 ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {filteredDocuments.map((doc) => (
                        <PortalSurfaceCard key={doc.id} title={doc.name} description={doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Ready to download"}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <FileText className="size-4" />
                              <span>Secure download</span>
                            </div>
                            <HeroButton
                              size="sm"
                              variant="outline"
                              onPress={() => {
                                window.location.href = `/api/customer/documents/download?document_id=${doc.id}`
                              }}
                            >
                              Download
                            </HeroButton>
                          </div>
                        </PortalSurfaceCard>
                      ))}
                    </div>
                  ) : null}
                  </Tabs.Panel>

                  <Tabs.Panel id="support" className="space-y-4">
                  <PortalSurfaceCard title="Support chat" description="Realtime and polling behavior is unchanged; only the message surface was modernized.">
                    <div className="flex h-[600px] flex-col gap-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm dark:border-white/8 dark:bg-white/5">
                          <p className="text-slate-500 dark:text-slate-400">Thread status</p>
                          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{threadId ? "Connected" : "Starting thread"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm dark:border-white/8 dark:bg-white/5">
                          <p className="text-slate-500 dark:text-slate-400">Messages</p>
                          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{messages.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm dark:border-white/8 dark:bg-white/5">
                          <p className="text-slate-500 dark:text-slate-400">Response mode</p>
                          <p className="mt-1 font-semibold text-slate-900 dark:text-white">Realtime + polling fallback</p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/65 dark:border-white/8 dark:bg-black/20">
                        {messagesLoading ? (
                          <div className="flex h-full items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <Spinner />
                            <span>Loading messages...</span>
                          </div>
                        ) : messagesError ? (
                          <div className="p-4">
                            <p className="text-sm text-rose-700 dark:text-rose-300">{messagesError}</p>
                          </div>
                        ) : (
                          <ScrollArea className="h-full">
                            <div className="space-y-3 p-4">
                              {filteredMessages.length === 0 ? (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  {messages.length === 0 ? "No messages yet. Start the conversation." : "No messages match your search."}
                                </p>
                              ) : (
                                filteredMessages.map((msg) => (
                                  <div key={msg.id} className={cn("flex gap-3", msg.is_from_staff ? "justify-start" : "justify-end")}>
                                    <div
                                      className={cn(
                                        "max-w-md rounded-2xl px-4 py-3 shadow-sm",
                                        msg.is_from_staff
                                          ? "border border-slate-200 bg-slate-100 text-slate-900 dark:border-white/8 dark:bg-white/8 dark:text-white"
                                          : "bg-sky-600 text-white",
                                      )}
                                    >
                                      <p className="text-sm leading-6">{msg.body}</p>
                                      <p className={cn("mt-2 text-xs", msg.is_from_staff ? "text-slate-500 dark:text-slate-300" : "text-sky-100")}>
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
                          className="max-h-24 flex-1 resize-none rounded-2xl border-slate-200/80 bg-white/85 dark:border-white/8 dark:bg-white/5"
                          rows={2}
                        />
                        <HeroButton
                          onPress={handleSendMessage}
                          isDisabled={!messageText.trim() || isSendingMessage}
                          variant="primary"
                          className="h-auto"
                        >
                          <Send className="size-4" />
                          {isSendingMessage ? "Sending..." : "Send"}
                        </HeroButton>
                      </div>
                    </div>
                  </PortalSurfaceCard>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </EmbeddedPortalShell>
  )
}
