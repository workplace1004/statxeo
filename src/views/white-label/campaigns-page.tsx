"use client";

import type {Customer} from "../../server/db/schemas/customers";
import type {Campaign} from "../../server/db/schemas/campaigns";
import type {DataGridColumn, DataGridSortDescriptor} from "@heroui-pro/react";

import {
  ArrowsRotateLeft,
  ChartLine,
  ChevronDown,
  Copy,
  Display,
  Ellipsis,
  Eye,
  FileText,
  Globe,
  Megaphone,
  Picture,
  Plus,
  Rocket,
  Star,
  Target,
  TrashBin,
  Video,
} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import {DataGrid, KPI, KPIGroup} from "@heroui-pro/react";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useMemo, useState} from "react";

import {IconButton} from "../../components/icon-button";
import {notifyInfo, notifySuccess} from "../../lib/ui/white-label-notify";
import {ModalShell} from "../../lib/ui/modal-shell";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

// Currency / number formatters
const formatDollars = (val: number) => {
  return new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(val || 0);
};

const formatPercent = (val: number) => {
  return `${((val || 0) * 100).toFixed(2)}%`;
};

export interface WhiteLabelCampaignsPageProps {
  customers: Customer[];
}

export function WhiteLabelCampaignsPage({customers}: WhiteLabelCampaignsPageProps) {
  const router = useRouter();
  const draftState = useOverlayState();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [mutatingApprovalId, setMutatingApprovalId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "campaignName",
    direction: "ascending",
  });

  // Modal Form State
  const [campaignName, setCampaignName] = useState("");
  const [channel, setChannel] = useState<string>("meta");
  const [clientOrgId, setClientOrgId] = useState<string>("");
  const [dailyBudget, setDailyBudget] = useState("100");
  const [totalAllocated, setTotalAllocated] = useState("1000");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [formCreatives, setFormCreatives] = useState<
    Array<{
      type: "video" | "image";
      url: string;
      headline: string;
      description: string;
    }>
  >([
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      headline: "Grow Your Local Business",
      description: "Launch your custom designed website with real automation workflows today.",
    },
  ]);

  // Fetch campaigns, audit history, and pending approvals
  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [campaignsRes, approvalsRes] = await Promise.all([
        fetch("/api/marketing/campaigns?audit=true"),
        fetch("/api/white-label/approvals"),
      ]);

      if (!campaignsRes.ok) {
        throw new Error(`Failed to load campaigns: ${campaignsRes.statusText}`);
      }
      const campaignsJson = await campaignsRes.ok ? await campaignsRes.json() : { data: [], auditLogs: [] };
      setCampaigns(campaignsJson.data || []);
      setAuditLogs(campaignsJson.auditLogs || []);

      if (approvalsRes.ok) {
        const approvalsJson = await approvalsRes.json();
        // Only display "ads" kind approvals on this campaign page
        const adsApprovals = (approvalsJson.approvals || []).filter(
          (a: any) => a.kind === "ads"
        );
        setApprovals(adsApprovals);
      }
    } catch (err: any) {
      console.error("Fetch campaigns error:", err);
      setError(err.message || "Failed to load marketing campaigns.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleProcessApproval = async (approvalId: string, action: "approve" | "reject") => {
    setMutatingApprovalId(approvalId);
    notifyInfo(`${action === "approve" ? "Approving" : "Rejecting"} recommendation...`);
    try {
      const res = await fetch("/api/white-label/approvals", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({approvalId, action}),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || `Failed to ${action} recommendation.`);
      }

      notifySuccess(`Recommendation successfully ${action === "approve" ? "approved & executed" : "rejected"}.`);
      await fetchCampaigns(true);
    } catch (err: any) {
      console.error(`Approval process error (${action}):`, err);
      toast.danger(err.message || `Failed to complete ${action} action.`);
    } finally {
      setMutatingApprovalId(null);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Selected Campaign reference
  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Aggregate KPI metrics
  const kpis = useMemo(() => {
    const totalCount = campaigns.length;
    const activeCount = campaigns.filter((c) => c.status === "active").length;
    const totalDailyBudget = campaigns.reduce((acc, c) => acc + (c.budget?.dailyLimit || 0), 0);
    const totalSpend = campaigns.reduce((acc, c) => acc + (c.budget?.spendToDate || 0), 0);

    const activeCreatives = campaigns
      .flatMap((c) => c.creatives || [])
      .filter((cr) => cr.status === "active");

    const avgCtr = activeCreatives.length
      ? activeCreatives.reduce((sum, cr) => sum + (cr.ctr || 0), 0) / activeCreatives.length
      : 0;

    return {
      totalCount,
      activeCount,
      totalDailyBudget,
      totalSpend,
      avgCtr,
    };
  }, [campaigns]);

  // Run AI Optimization cycle
  const handleRunOptimization = async () => {
    setOptimizing(true);
    notifyInfo("Executing AI campaign optimization check...");
    try {
      const res = await fetch("/api/marketing/optimize", {method: "POST"});
      if (!res.ok) {
        throw new Error(`Optimization run failed: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.success) {
        notifySuccess(`AI check complete! Processed ${json.optimizedCount} active campaigns.`);
        await fetchCampaigns(true);
      } else {
        toast.danger("Optimization failed to complete.");
      }
    } catch (err: any) {
      console.error(err);
      toast.danger(err.message || "Failed to run automated budget/creative checks.");
    } finally {
      setOptimizing(false);
    }
  };

  // Create campaign submission
  const handleCreateCampaignDraft = async (close: () => void) => {
    if (!campaignName.trim()) {
      toast.danger("Campaign name is required.");
      return;
    }
    if (!clientOrgId) {
      toast.danger("Please select a target client organization.");
      return;
    }

    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          campaignName: campaignName.trim(),
          channel,
          clientOrgId,
          dailyBudget: parseFloat(dailyBudget) || 0,
          totalAllocated: parseFloat(totalAllocated) || 0,
          keywords: keywordsInput
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          creatives: formCreatives,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to submit campaign draft.");
      }

      notifySuccess(`Campaign "${campaignName}" drafted successfully (Pending approval).`);
      close();

      // Reset form
      setCampaignName("");
      setClientOrgId("");
      setChannel("meta");
      setDailyBudget("100");
      setTotalAllocated("1000");
      setKeywordsInput("");
      setFormCreatives([
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
          headline: "Grow Your Local Business",
          description: "Launch your custom designed website with real automation workflows today.",
        },
      ]);

      await fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      toast.danger(err.message || "Failed to submit draft.");
    }
  };

  // Creatives helpers in modal form
  const addFormCreative = () => {
    setFormCreatives([
      ...formCreatives,
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
        headline: "Premium Business Services",
        description: "Experience fully automated operations with XEO.",
      },
    ]);
  };

  const removeFormCreative = (index: number) => {
    if (formCreatives.length <= 1) return;
    setFormCreatives(formCreatives.filter((_, i) => i !== index));
  };

  const updateFormCreative = (index: number, key: string, value: string) => {
    const updated = [...formCreatives];
    updated[index] = {...updated[index], [key]: value} as any;
    setFormCreatives(updated);
  };

  const filtered = useMemo<Campaign[]>(() => {
    let rows = [...campaigns];
    if (platformFilter) rows = rows.filter((c) => c.channel === platformFilter);
    if (!search) return rows;
    const q = search.toLowerCase();

    return rows.filter(
      (c) =>
        c.campaignName.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q),
    );
  }, [campaigns, search, platformFilter]);

  const sorted = useMemo<Campaign[]>(() => {
    if (!sortDescriptor.column) return filtered;
    const column = sortDescriptor.column as keyof Campaign;

    return [...filtered].sort((a, b) => {
      let av: any = a[column];
      let bv: any = b[column];

      // Handle nested fields
      if (sortDescriptor.column === "dailyLimit") {
        av = a.budget?.dailyLimit;
        bv = b.budget?.dailyLimit;
      } else if (sortDescriptor.column === "spendToDate") {
        av = a.budget?.spendToDate;
        bv = b.budget?.spendToDate;
      }

      const direction = sortDescriptor.direction === "descending" ? -1 : 1;

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;

      return String(av ?? "").localeCompare(String(bv ?? "")) * direction;
    });
  }, [filtered, sortDescriptor]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);

  // Columns configuration
  const columns = useMemo<DataGridColumn<Campaign>[]>(() => {
    return [
      {
        accessorKey: "campaignName",
        allowsSorting: true,
        header: "Campaign Details",
        id: "campaignName",
        isRowHeader: true,
        minWidth: 240,
        cell: (row: Campaign) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium leading-tight">
              {row.campaignName}
            </span>
            <span className="text-muted text-xs leading-tight">
              ID: <span className="font-mono">{row.id?.slice(-8) || "N/A"}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: "channel",
        allowsSorting: true,
        header: "Platform",
        id: "channel",
        minWidth: 120,
        cell: (row: Campaign) => (
          <Chip
            size="sm"
            variant="soft"
            color={row.channel === "meta" ? "accent" : "default"}
            className="font-semibold uppercase tracking-wider text-[11px]"
          >
            {row.channel === "meta" ? "Meta Ads" : "Google Ads"}
          </Chip>
        ),
      },
      {
        allowsSorting: true,
        header: "Daily Limit",
        id: "dailyLimit",
        minWidth: 150,
        cell: (row: Campaign) => (
          <span className="text-foreground font-medium tabular-nums">
            {formatDollars(row.budget?.dailyLimit)}/day
          </span>
        ),
      },
      {
        allowsSorting: true,
        header: "Total Budget",
        id: "totalAllocated",
        minWidth: 150,
        cell: (row: Campaign) => (
          <span className="text-muted tabular-nums">
            {formatDollars(row.budget?.totalAllocated)}
          </span>
        ),
      },
      {
        allowsSorting: true,
        header: "Spend To Date",
        id: "spendToDate",
        minWidth: 140,
        cell: (row: Campaign) => (
          <span className="text-foreground font-semibold tabular-nums">
            {formatDollars(row.budget?.spendToDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        header: "Status",
        id: "status",
        minWidth: 140,
        cell: (row: Campaign) => {
          let color: "default" | "success" | "warning" | "danger" = "default";
          if (row.status === "active") color = "success";
          if (row.status === "paused") color = "warning";
          if (row.status === "pending_approval") color = "default";
          if (row.status === "failed") color = "danger";

          const statusLabels: Record<string, string> = {
            active: "Active",
            paused: "Paused",
            pending_approval: "Pending Approval",
            failed: "Failed",
          };

          return (
            <Chip size="sm" variant="soft" color={color}>
              {statusLabels[row.status] || row.status}
            </Chip>
          );
        },
      },
      {
        align: "end",
        header: "Actions",
        id: "actions",
        minWidth: 140,
        cell: (row: Campaign) => (
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant={selectedCampaignId === row.id ? "primary" : "tertiary"}
              onPress={() => setSelectedCampaignId(selectedCampaignId === row.id ? null : row.id)}
            >
              {selectedCampaignId === row.id ? "Close Assets" : "View Assets"}
            </Button>
          </div>
        ),
      },
    ];
  }, [selectedCampaignId]);

  const isEmpty = campaigns.length === 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Monitor multi-channel digital ad spend and manage creative assets. Automated AI loops analyze performance history hourly to detect ad fatigue and reallocate budgets."
        showPeriod={false}
        title="Ad Campaigns"
        trailing={
          <>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={optimizing}
              onPress={handleRunOptimization}
            >
              <ArrowsRotateLeft className={`size-4 ${optimizing ? "animate-spin" : ""}`} />
              Run AI Optimization
            </Button>
            <Button size="sm" onPress={draftState.open}>
              <Plus className="size-4" />
              Draft Campaign
            </Button>
          </>
        }
      />

      {/* AI Optimization Recommendations & Approvals Queue */}
      {approvals.length > 0 && (
        <Card className="border border-warning-200/50 bg-warning-50/5 dark:bg-warning-950/5 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
          <Card.Header className="flex items-center justify-between border-b border-border/40 py-3.5 px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-warning-500/10 text-warning-600 dark:text-warning-400">
                <Rocket className="size-4 animate-pulse" />
              </div>
              <div>
                <Card.Title className="text-sm font-semibold text-foreground leading-tight">
                  AI Optimization Queue
                </Card.Title>
                <Card.Description className="text-xs text-muted leading-tight mt-0.5">
                  Review and authorize AI-recommended actions before they are executed.
                </Card.Description>
              </div>
            </div>
            <Chip color="warning" size="sm" variant="soft" className="font-semibold text-xs">
              {approvals.length} Actions Required
            </Chip>
          </Card.Header>
          <Card.Content className="p-0 divide-y divide-border/40">
            {approvals.map((app) => {
              const isMutating = mutatingApprovalId === app.id;
              return (
                <div key={app.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-content2/20 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="size-9 border border-border/60">
                      <Avatar.Image alt={app.customer} src={app.customerAvatar} />
                      <Avatar.Fallback className="text-xs font-semibold">
                        {app.customer
                          ? app.customer
                              .split(" ")
                              .map((p: any) => p[0])
                              .join("")
                          : "U"}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground text-sm font-semibold leading-tight truncate">
                          {app.customer}
                        </span>
                        <Chip size="sm" variant="soft" className="h-5 text-[10px] font-bold tracking-wide uppercase px-1.5">
                          {app.meta?.actionType === "activate_campaign" ? "Launch Campaign" : "Pause Fatigue Ad"}
                        </Chip>
                      </div>
                      <p className="text-foreground/90 text-xs font-medium leading-relaxed mt-1 whitespace-pre-wrap">
                        {app.summary}
                      </p>
                      <span className="text-muted text-[10px] mt-1.5">
                        Requested: {app.requestedAt ? new Date(app.requestedAt).toLocaleString() : "just now"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 sm:self-center self-end mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      variant="tertiary"
                      className="text-muted-foreground hover:text-foreground text-xs font-medium"
                      isDisabled={isMutating || mutatingApprovalId !== null}
                      onPress={() => handleProcessApproval(app.id, "reject")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs font-semibold"
                      isDisabled={isMutating || mutatingApprovalId !== null}
                      onPress={() => handleProcessApproval(app.id, "approve")}
                    >
                      {isMutating && mutatingApprovalId === app.id ? "Authorizing..." : "Approve & Execute"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {isEmpty ? (
        <EmptyState
          body="Create your first marketing campaign draft with custom copy and creatives to start tracking performance."
          cta={{label: "Draft Campaign", onPress: draftState.open}}
          icon={Target}
          title="No campaigns configured"
        />
      ) : (
        <>
          <KPIGroup>
            <KPI>
              <KPI.Header>
                <KPI.Title>Total ad budget</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={kpis.totalDailyBudget}
                />
                <span className="text-muted text-xs leading-none">/ day</span>
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Total spend to date</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={kpis.totalSpend}
                />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Avg active CTR</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value
                  maximumFractionDigits={2}
                  style="percent"
                  value={kpis.avgCtr}
                />
              </KPI.Content>
            </KPI>
            <KPIGroup.Separator />
            <KPI>
              <KPI.Header>
                <KPI.Title>Tracked campaigns</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value maximumFractionDigits={0} value={kpis.totalCount} />
                <span className="text-muted text-xs leading-none">({kpis.activeCount} active)</span>
              </KPI.Content>
            </KPI>
          </KPIGroup>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Dropdown>
                <Button size="sm" variant="tertiary">
                  <Megaphone className="size-4" />
                  {platformFilter === "meta"
                    ? "Platform: Meta Ads"
                    : platformFilter === "google"
                      ? "Platform: Google Ads"
                      : "Filter by Platform"}
                </Button>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "all") setPlatformFilter(null);
                      else setPlatformFilter(String(key));
                    }}
                  >
                    <Dropdown.Item id="all" textValue="All platforms">
                      <Label>All platforms</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="meta" textValue="Meta Ads">
                      <Label>Meta Ads</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="google" textValue="Google Ads">
                      <Label>Google Ads</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
            <SearchField
              aria-label="Search campaigns"
              className="w-full sm:w-[260px]"
              name="campaigns-search"
              onChange={handleSearchChange}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search campaigns…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>

          <DataGrid
            aria-label="Campaigns"
            columns={columns}
            contentClassName="min-w-[1000px]"
            data={sorted}
            getRowId={(item: Campaign) => item.id}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          />
        </>
      )}

      {/* Selected Campaign Creatives Detail Grid */}
      {selectedCampaign ? (
        <Card className="rounded-2xl mt-4">
          <Card.Header className="flex-col items-start gap-1">
            <Card.Title className="text-base font-semibold">
              Ad Creatives: {selectedCampaign.campaignName}
            </Card.Title>
            <Card.Description>
              Creative performance metrics and AI Fatigue checks for this campaign.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {selectedCampaign.creatives?.length === 0 ? (
              <p className="text-muted py-6 text-center text-sm">
                No creatives registered for this campaign.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedCampaign.creatives.map((creative: any, idx: number) => {
                  const isFatiguePaused =
                    selectedCampaign.status === "active" &&
                    creative.status === "paused" &&
                    creative.ctr < 0.015;

                  return (
                    <div
                      key={idx}
                      className="group relative rounded-2xl border border-border bg-content2/30 p-4 transition-all duration-200 hover:border-foreground/20"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-1.5">
                          {creative.type === "video" ? (
                            <Video className="size-4 text-indigo-500" />
                          ) : (
                            <Picture className="size-4 text-sky-500" />
                          )}
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            {creative.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFatiguePaused ? (
                            <Chip size="sm" variant="soft" color="danger" className="animate-pulse">
                              <Star className="size-3 mr-1 inline" /> AI Paused (Fatigue)
                            </Chip>
                          ) : null}
                          <Chip
                            size="sm"
                            variant="soft"
                            color={creative.status === "active" ? "success" : "default"}
                            className="capitalize"
                          >
                            {creative.status}
                          </Chip>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <p className="font-semibold text-sm text-foreground">
                          {creative.headline}
                        </p>
                        <p className="text-xs text-muted line-clamp-2">
                          {creative.description}
                        </p>
                        <p className="text-[11px] text-muted truncate mt-1">
                          Media URL:{" "}
                          <a
                            href={creative.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            {creative.url}
                          </a>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted">
                            Spend
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-foreground mt-0.5">
                            {formatDollars(creative.spend)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted">
                            CTR
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-foreground mt-0.5">
                            {formatPercent(creative.ctr)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted">
                            Conv. Rate
                          </p>
                          <p className="text-xs font-semibold tabular-nums text-foreground mt-0.5">
                            {formatPercent(creative.conversionRate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      ) : null}

      {/* AI Optimization Audit Logs */}
      {!loading && (
        <Card className="rounded-2xl mt-4">
          <Card.Header className="flex-col items-start gap-1">
            <Card.Title className="text-base font-semibold">
              Optimization History & Audit Logs
            </Card.Title>
            <Card.Description>
              Detailed logs tracking AI recommendations, budget shift calculations, and manual actions.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {auditLogs.length === 0 ? (
              <p className="text-muted py-6 text-center text-sm">
                No audit logs recorded yet. Run optimization loops to populate history.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-content2/10 shadow-sm">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted">
                        Timestamp
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted">
                        Actor
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted">
                        Action
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.flatMap((exec) =>
                      (exec.auditLogs || []).map((log: any, lIdx: number) => {
                        let actorColor: "default" | "success" | "warning" | "accent" = "default";
                        if (log.actor === "ai") actorColor = "warning";
                        if (log.actor === "user") actorColor = "accent";
                        if (log.actor === "system") actorColor = "default";

                        return (
                          <tr key={`${exec.id}-${lIdx}`} className="hover:bg-content2/20">
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <Chip size="sm" variant="soft" color={actorColor} className="uppercase text-[10px] font-bold">
                                {log.actor}
                              </Chip>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-foreground">
                              {log.action}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-foreground max-w-md">
                              {log.description}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Draft Campaign Modal */}
      <ModalShell state={draftState}>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="flex items-center gap-2">
                <Megaphone className="size-5 text-indigo-500" />
                Draft Advertising Campaign
              </Modal.Heading>
              <p className="text-muted text-sm">
                Draft details for a new Meta or Google campaign. Campaigns initialize as `pending_approval` for review.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              <TextField isRequired name="c-name" value={campaignName} onChange={setCampaignName}>
                <Label>Campaign Name</Label>
                <Input placeholder="e.g. Dallas Roofing Lead Generation" />
              </TextField>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  className="w-full"
                  name="c-channel"
                  selectedKey={channel}
                  onSelectionChange={(key) => setChannel(String(key))}
                >
                  <Label>Channel Platform</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="meta" textValue="Meta Ads">
                        Meta Ads (Facebook / Instagram)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="google" textValue="Google Ads">
                        Google Ads (Search / Display)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  className="w-full"
                  name="c-client"
                  selectedKey={clientOrgId}
                  onSelectionChange={(key) => setClientOrgId(String(key))}
                >
                  <Label>Client Account Organization</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {customers.map((c) => (
                        <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                          {c.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField isRequired name="c-daily" value={dailyBudget} onChange={setDailyBudget}>
                  <Label>Daily Budget ($)</Label>
                  <Input type="number" />
                </TextField>

                <TextField isRequired name="c-total" value={totalAllocated} onChange={setTotalAllocated}>
                  <Label>Total Allocated ($)</Label>
                  <Input type="number" />
                </TextField>
              </div>

              <TextField name="c-keywords" value={keywordsInput} onChange={setKeywordsInput}>
                <Label>Keywords / Ad Groups</Label>
                <Input placeholder="e.g. roofing contractor, roof repair, local builder (comma separated)" />
              </TextField>

              {/* Creative List Builder */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground">Ad Creative Asset Variants</Label>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={addFormCreative}
                  >
                    <Plus className="size-3" /> Add Creative
                  </Button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {formCreatives.map((cr, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border space-y-3 relative bg-content2/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-indigo-500">Variant #{idx + 1}</span>
                        {formCreatives.length > 1 && (
                          <IconButton
                            label="Remove creative variant"
                            size="sm"
                            variant="tertiary"
                            onPress={() => removeFormCreative(idx)}
                          >
                            <TrashBin className="size-4 text-rose-500" />
                          </IconButton>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select
                          className="w-full"
                          name={`cr-type-${idx}`}
                          selectedKey={cr.type}
                          onSelectionChange={(key) => updateFormCreative(idx, "type", String(key))}
                        >
                          <Label>Media Type</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id="image" textValue="Image Asset">
                                Image Asset
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item id="video" textValue="Video Asset">
                                Video Asset
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>

                        <TextField isRequired name={`cr-url-${idx}`} value={cr.url} onChange={(v) => updateFormCreative(idx, "url", v)}>
                          <Label>Media File URL</Label>
                          <Input placeholder="https://..." />
                        </TextField>
                      </div>

                      <TextField isRequired name={`cr-headline-${idx}`} value={cr.headline} onChange={(v) => updateFormCreative(idx, "headline", v)}>
                        <Label>Ad Headline</Label>
                        <Input placeholder="Premium service in your area" />
                      </TextField>

                      <TextField isRequired name={`cr-desc-${idx}`} value={cr.description} onChange={(v) => updateFormCreative(idx, "description", v)}>
                        <Label>Ad Description Body</Label>
                        <TextArea placeholder="Sign up for our limited promotion today..." className="min-h-16 resize-y" />
                      </TextField>
                    </div>
                  ))}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button onPress={() => handleCreateCampaignDraft(draftState.close)}>
                <Plus className="size-4" /> Save Campaign Draft
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </ModalShell>
    </div>
  );
}
