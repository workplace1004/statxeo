"use client";

import {Plus, TrashBin} from "@gravity-ui/icons";
import {Button, Card, Chip} from "@heroui/react";
import {useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";

import {triggerGeneration} from "../../server/actions/site-projects";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MediaAssetItem {
  id: string;
  asset_type: string;
  original_filename: string | null;
  storage_path: string;
}

export interface CustomerWebsiteAssetsPageProps {
  projectId: string;
  businessName: string | null;
  existingAssets: MediaAssetItem[];
}

// ─── Upload slot config ─────────────────────────────────────────────────────

const ASSET_SLOTS = [
  {
    type: "logo" as const,
    label: "Logo",
    accept: "image/jpeg,image/png,image/webp,image/svg+xml",
    description: "Your primary brand logo (PNG, SVG, or JPEG recommended)",
  },
  {
    type: "photo" as const,
    label: "Photos",
    accept: "image/jpeg,image/png,image/webp",
    description: "Team, office, or product photos",
  },
  {
    type: "document" as const,
    label: "Documents",
    accept: "image/jpeg,image/png,image/webp,application/pdf",
    description: "Brand guidelines or reference materials",
  },
] as const;

type AssetType = (typeof ASSET_SLOTS)[number]["type"];

// ─── Asset slot component ───────────────────────────────────────────────────

function AssetSlot({
  type,
  label,
  accept,
  description,
  assets,
  uploading,
  onFileSelect,
  onRemove,
}: {
  type: AssetType;
  label: string;
  accept: string;
  description: string;
  assets: MediaAssetItem[];
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-xl">
      <Card.Content className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-muted mt-0.5 text-xs">{description}</p>
          </div>
          <div className="shrink-0">
            <input
              ref={inputRef}
              accept={accept}
              className="hidden"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
                e.target.value = "";
              }}
            />
            <Button
              isDisabled={uploading}
              size="sm"
              variant="outline"
              onPress={() => inputRef.current?.click()}
            >
              {uploading ? (
                <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Add {label}
            </Button>
          </div>
        </div>

        {assets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center gap-1">
                <Chip size="sm" variant="soft">
                  {a.original_filename ?? a.asset_type}
                </Chip>
                <button
                  aria-label={`Remove ${a.original_filename ?? a.asset_type}`}
                  className="text-muted hover:text-foreground transition-colors"
                  type="button"
                  onClick={() => onRemove(a.id)}
                >
                  <TrashBin className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Main page component ────────────────────────────────────────────────────

export function CustomerWebsiteAssetsPage({
  projectId,
  businessName,
  existingAssets,
}: CustomerWebsiteAssetsPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [assets, setAssets] = useState<MediaAssetItem[]>([...existingAssets]);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(file: File, assetType: AssetType) {
    setUploading((u) => ({...u, [assetType]: true}));
    setError(null);
    try {
      // Register the asset in MongoDB and receive the upload URL
      const signRes = await fetch(`/api/site-projects/${projectId}/media/sign-upload`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({filename: file.name, mimeType: file.type, assetType}),
      });
      if (!signRes.ok) {
        const errBody = (await signRes.json().catch(() => null)) as {message?: string} | null;
        throw new Error(errBody?.message ?? "Failed to register file");
      }
      const {uploadUrl} = (await signRes.json()) as {uploadUrl: string; storagePath: string};

      // Upload the binary to the storage endpoint
      await fetch(uploadUrl, {method: "PUT", body: file, headers: {"Content-Type": file.type}});

      setAssets((prev) => [
        ...prev,
        {id: `${Date.now()}-${Math.random()}`, asset_type: assetType, original_filename: file.name, storage_path: ""},
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — please try again");
    } finally {
      setUploading((u) => ({...u, [assetType]: false}));
    }
  }

  function handleRemove(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await triggerGeneration(projectId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/customer/website");
    });
  }

  const isAnyUploading = Object.values(uploading).some(Boolean);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-8">
      <div>
        <h1 className="text-xl font-semibold">
          {businessName ? `${businessName} — ` : ""}Brand assets
        </h1>
        <p className="text-muted mt-1 text-sm">
          Upload your logo and photos so the AI can match your brand. Assets are
          optional — you can skip this step and add them later.
        </p>
      </div>

      {error && (
        <Card className="rounded-xl border-danger/30 bg-danger/5">
          <Card.Content className="py-3 text-sm text-danger">{error}</Card.Content>
        </Card>
      )}

      {ASSET_SLOTS.map((slot) => (
        <AssetSlot
          key={slot.type}
          accept={slot.accept}
          assets={assets.filter((a) => a.asset_type === slot.type)}
          description={slot.description}
          label={slot.label}
          type={slot.type}
          uploading={uploading[slot.type] ?? false}
          onFileSelect={(f) => handleFileSelect(f, slot.type)}
          onRemove={handleRemove}
        />
      ))}

      <div className="flex flex-col gap-2 pt-2">
        <Button
          isDisabled={isPending || isAnyUploading}
          size="lg"
          onPress={handleGenerate}
        >
          {isPending && (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Generate my website
        </Button>
        <p className="text-muted text-center text-xs">
          The AI will use any uploaded assets. Generation usually takes 1–2 minutes.
        </p>
      </div>
    </div>
  );
}
