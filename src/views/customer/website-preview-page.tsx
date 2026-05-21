"use client";

import {ArrowUpRightFromSquare, Check, CircleXmark, Display} from "@gravity-ui/icons";
import {Button, Card, Chip, Input, Label, TextArea, TextField} from "@heroui/react";
import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

import {approvePreview, submitChangeRequest, triggerGeneration} from "../../server/actions/site-projects";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChangeRequestItem {
  id: string;
  scope_type: string;
  page_key: string | null;
  section_key: string | null;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface CustomerWebsitePreviewPageProps {
  projectId: string;
  businessName: string | null;
  status: string;
  previewUrl: string | null;
  changeRequests: ChangeRequestItem[];
}

// ─── Change request form ────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  {key: "entire_site", label: "Entire site", hint: "Applies across all pages"},
  {key: "specific_page", label: "Specific page", hint: "Targets one page"},
  {key: "specific_section", label: "Specific section", hint: "Targets one section"},
] as const;

type ScopeKey = (typeof SCOPE_OPTIONS)[number]["key"];

function ChangeRequestForm({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [scopeType, setScopeType] = useState<ScopeKey>("entire_site");
  const [pageKey, setPageKey] = useState("");
  const [sectionKey, setSectionKey] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setFormError("Please describe the changes you'd like.");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const res = await submitChangeRequest(projectId, {
        scopeType,
        pageKey: pageKey.trim() || undefined,
        sectionKey: sectionKey.trim() || undefined,
        description: description.trim(),
      });
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      setDescription("");
      setPageKey("");
      setSectionKey("");
      onSuccess();
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <Label className="text-xs font-medium" htmlFor="cr-scope">
          Scope
        </Label>
        <select
          className="border-content3 bg-content2 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          id="cr-scope"
          value={scopeType}
          onChange={(e) => setScopeType(e.target.value as ScopeKey)}
        >
          {SCOPE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label} — {opt.hint}
            </option>
          ))}
        </select>
      </div>

      {(scopeType === "specific_page" || scopeType === "specific_section") && (
        <TextField value={pageKey} onChange={setPageKey}>
          <Label>Page key or slug</Label>
          <Input placeholder="/about" />
        </TextField>
      )}

      {scopeType === "specific_section" && (
        <TextField value={sectionKey} onChange={setSectionKey}>
          <Label>Section key</Label>
          <Input placeholder="hero, testimonials, cta…" />
        </TextField>
      )}

      <TextField value={description} onChange={setDescription}>
        <Label>Describe the changes</Label>
        <TextArea
          className="min-h-20 resize-y"
          placeholder="E.g. Change the hero headline to emphasise speed, update the colour palette to darker tones…"
          rows={3}
        />
      </TextField>

      {formError && <p className="text-danger text-xs">{formError}</p>}

      <Button
        isDisabled={isPending || !description.trim()}
        size="sm"
        type="submit"
        variant="secondary"
      >
        {isPending && (
          <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
        )}
        Submit change request
      </Button>
    </form>
  );
}

// ─── Change request list ────────────────────────────────────────────────────

const CR_STATUS_COLORS: Record<string, "default" | "warning" | "success" | "danger"> = {
  pending: "warning",
  resolved: "success",
  rejected: "danger",
};

function ChangeRequestList({items}: {items: ChangeRequestItem[]}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {items.map((cr) => (
        <div key={cr.id} className="bg-content2 flex flex-col gap-1 rounded-lg px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{cr.scope_type.replace(/_/g, " ")}</span>
            <Chip
              color={CR_STATUS_COLORS[cr.status] ?? "default"}
              size="sm"
              variant="soft"
            >
              {cr.status}
            </Chip>
          </div>
          <p className="text-foreground text-sm">{cr.description}</p>
          {cr.page_key && (
            <p className="text-muted text-xs">
              Page: <span className="font-mono">{cr.page_key}</span>
              {cr.section_key && (
                <>
                  {" · "}Section: <span className="font-mono">{cr.section_key}</span>
                </>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function CustomerWebsitePreviewPage({
  projectId,
  businessName,
  status,
  previewUrl,
  changeRequests,
}: CustomerWebsitePreviewPageProps) {
  const router = useRouter();
  const [approvePending, startApprove] = useTransition();
  const [regenPending, startRegen] = useTransition();
  const [pageError, setPageError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const isChangesRequested = status === "changes_requested";
  const pendingRequests = changeRequests.filter((cr) => cr.status === "pending");

  function handleApprove() {
    setPageError(null);
    startApprove(async () => {
      const res = await approvePreview(projectId);
      if (!res.ok) {
        setPageError(res.error);
        return;
      }
      router.push("/customer/website");
    });
  }

  function handleRegen() {
    setPageError(null);
    startRegen(async () => {
      const res = await triggerGeneration(projectId);
      if (!res.ok) {
        setPageError(res.error);
        return;
      }
      router.push("/customer/website");
    });
  }

  function handleChangeSubmitted() {
    setSubmitCount((n) => n + 1);
    setShowForm(false);
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold">
          {businessName ? `${businessName} — ` : ""}
          {isChangesRequested ? "Changes requested" : "Preview ready"}
        </h1>
        <p className="text-muted mt-1 text-sm">
          {isChangesRequested
            ? "Your change requests have been submitted. Generate a new revision when you're ready."
            : "Review your website preview. Approve to publish, or request changes."}
        </p>
      </div>

      {pageError && (
        <Card className="rounded-xl border-danger/30 bg-danger/5">
          <Card.Content className="flex items-center gap-2 py-3 text-sm text-danger">
            <CircleXmark className="size-4 shrink-0" />
            {pageError}
          </Card.Content>
        </Card>
      )}

      {/* ── Preview frame ── */}
      {previewUrl ? (
        <Card className="rounded-xl">
          <Card.Content className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview</p>
              <a
                className="text-muted hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                href={previewUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open in new tab
                <ArrowUpRightFromSquare className="size-3" />
              </a>
            </div>
            <div className="bg-content2 relative overflow-hidden rounded-lg" style={{aspectRatio: "16/9"}}>
              <iframe
                className="absolute inset-0 size-full scale-[0.5] origin-top-left"
                sandbox="allow-scripts allow-same-origin"
                src={previewUrl}
                style={{width: "200%", height: "200%"}}
                title="Website preview"
              />
            </div>
          </Card.Content>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <Card.Content className="flex items-center gap-3 py-5">
            <Display className="text-muted size-5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Preview not available yet</span>
              <span className="text-muted text-xs">
                The preview URL will appear here once your site has been built.
              </span>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* ── Action cards ── */}
      {isChangesRequested ? (
        <Card className="rounded-xl">
          <Card.Content className="flex flex-col gap-4 p-4">
            <div>
              <p className="text-sm font-medium">Ready to regenerate?</p>
              <p className="text-muted mt-0.5 text-xs">
                The AI will apply all pending change requests in a new revision.
              </p>
            </div>

            {pendingRequests.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  {pendingRequests.length} pending request
                  {pendingRequests.length !== 1 ? "s" : ""}
                </p>
                <ChangeRequestList items={pendingRequests} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                isDisabled={regenPending || approvePending}
                onPress={handleRegen}
              >
                {regenPending && (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Generate new revision
              </Button>
              <Button
                isDisabled={regenPending || approvePending}
                variant="outline"
                onPress={() => setShowForm((v) => !v)}
              >
                Add another change request
              </Button>
            </div>

            {showForm && (
              <ChangeRequestForm
                key={submitCount}
                projectId={projectId}
                onSuccess={handleChangeSubmitted}
              />
            )}
          </Card.Content>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <Card.Content className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="sm:flex-1"
                isDisabled={approvePending || regenPending}
                onPress={handleApprove}
              >
                {approvePending && (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                <Check className="size-4" />
                Approve &amp; deploy
              </Button>
              <Button
                className="sm:flex-1"
                isDisabled={approvePending || regenPending}
                variant="outline"
                onPress={() => setShowForm((v) => !v)}
              >
                Request changes
              </Button>
            </div>

            {showForm && (
              <ChangeRequestForm
                key={submitCount}
                projectId={projectId}
                onSuccess={handleChangeSubmitted}
              />
            )}
          </Card.Content>
        </Card>
      )}

      {/* ── All change requests ── */}
      {changeRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">
            All change requests ({changeRequests.length})
          </p>
          <ChangeRequestList items={changeRequests} />
        </div>
      )}
    </div>
  );
}
