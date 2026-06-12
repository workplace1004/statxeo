"use client";

import type {
  BrandAsset,
  BrandPalette,
  BrandedDomain,
} from "../../server/db/schemas/branding";
import type {Organization} from "../../server/db/schemas/organizations";

import {
  ArrowUpFromSquare,
  Check,
  Globe,
  Palette,
  Pencil,
  Plus,
  Star,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";
import {ModalShell} from "../../lib/ui/modal-shell";
import {EmptyState} from "../../widgets/empty-state";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";

export interface WhiteLabelBrandingPageProps {
  palettes: BrandPalette[];
  assets: BrandAsset[];
  domains: BrandedDomain[];
  organization: Organization | null;
}

export function WhiteLabelBrandingPage({
  assets,
  domains,
  palettes,
  organization,
}: WhiteLabelBrandingPageProps) {
  const domainState = useOverlayState();
  const [domainInput, setDomainInput] = useState("");

  // Match organization brand colors to active palette if possible
  const matchedPalette = palettes.find(
    (p) =>
      p.primary === organization?.brand?.primaryColor &&
      p.secondary === organization?.brand?.secondaryColor &&
      p.accent === organization?.brand?.accentColor
  );
  const [activePaletteId, setActivePaletteId] = useState(matchedPalette?.id ?? palettes[0]?.id ?? "");

  // Form states
  const [emailFromName, setEmailFromName] = useState(organization?.brand?.emailFromName ?? "");
  const [emailFromAddress, setEmailFromAddress] = useState(organization?.brand?.emailFromAddress ?? "");
  const [emailFooter, setEmailFooter] = useState(organization?.brand?.emailFooter ?? "");
  const [emailHideBranding, setEmailHideBranding] = useState(!!organization?.brand?.emailHideBranding);

  const [loginHeadline, setLoginHeadline] = useState(organization?.brand?.loginHeadline ?? "");
  const [loginSubhead, setLoginSubhead] = useState(organization?.brand?.loginSubhead ?? "");
  const [loginBgUrl, setLoginBgUrl] = useState(organization?.brand?.loginBgUrl ?? "");

  const [isPublishing, setIsPublishing] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePublishBranding = async () => {
    setIsPublishing(true);
    try {
      const activePalette = palettes.find((p) => p.id === activePaletteId);
      const payload = {
        primaryColor: activePalette?.primary ?? organization?.brand?.primaryColor ?? null,
        secondaryColor: activePalette?.secondary ?? organization?.brand?.secondaryColor ?? null,
        accentColor: activePalette?.accent ?? organization?.brand?.accentColor ?? null,
        emailFromName: emailFromName || null,
        emailFromAddress: emailFromAddress || null,
        emailFooter: emailFooter || null,
        emailHideBranding: emailHideBranding,
        loginHeadline: loginHeadline || null,
        loginSubhead: loginSubhead || null,
        loginBgUrl: loginBgUrl || null,
      };

      const res = await fetch("/api/white-label/branding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        notifySuccess("Branding published to all customer workspaces");
      } else {
        alert(data.error?.message || "Failed to publish branding");
      }
    } catch (err) {
      console.error("Publish branding error:", err);
      alert("An unexpected error occurred while saving branding");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddDomain = async () => {
    const domain = domainInput.trim();
    if (!domain) return;
    setIsAddingDomain(true);
    try {
      const res = await fetch("/api/white-label/branding/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({domain, type: "app"}),
      });

      const data = await res.json();
      if (data.ok) {
        notifySuccess(`Domain ${domain} added — DNS verification pending`);
        setDomainInput("");
        domainState.close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to add domain");
      }
    } catch (err) {
      console.error("Add domain error:", err);
      alert("An unexpected error occurred");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingId(domainId);
    try {
      const res = await fetch("/api/white-label/branding/domains", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({domainId}),
      });

      const data = await res.json();
      if (data.ok) {
        notifySuccess("DNS verified successfully");
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to verify domain");
      }
    } catch (err) {
      console.error("Verify domain error:", err);
      alert("An unexpected error occurred");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to remove this custom domain?")) return;
    setDeletingId(domainId);
    try {
      const res = await fetch("/api/white-label/branding/domains", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({domainId}),
      });

      const data = await res.json();
      if (data.ok) {
        notifySuccess("Branded domain removed successfully");
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to remove domain");
      }
    } catch (err) {
      console.error("Delete domain error:", err);
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Make the platform yours — logo, colors, custom domain, and login experience."
        showPeriod={false}
        title="Branding"
        trailing={
          <Button
            size="sm"
            isDisabled={isPublishing}
            onPress={handlePublishBranding}
          >
            {isPublishing ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="size-4" />
            )}
            {isPublishing ? "Publishing…" : "Publish branding"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <Card.Header className="flex-row items-center justify-between">
            <div className="flex flex-col">
              <Card.Title className="text-base">Brand assets</Card.Title>
              <Card.Description>Logos, favicons, and social previews.</Card.Description>
            </div>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => notifySuccess("Upload dialog ready — drop a logo or favicon")}
            >
              <ArrowUpFromSquare className="size-4" />
              Upload
            </Button>
          </Card.Header>
          <Card.Content className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {assets.length === 0 ? (
              <p className="text-muted col-span-full py-6 text-center text-sm">
                Upload your first logo or social preview to get started.
              </p>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="border-border bg-content1 flex flex-col gap-2 rounded-xl border p-3"
                >
                  <div className="bg-content2 text-muted flex aspect-[3/1] items-center justify-center rounded-lg text-xs">
                    Preview · {asset.label}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm font-medium">{asset.label}</span>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => notifySuccess(`Editing ${asset.label}`)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                  <span className="text-muted text-xs leading-snug">{asset.description}</span>
                </div>
              ))
            )}
          </Card.Content>
        </Card>

        {palettes.length === 0 ? (
          <EmptyState
            body="Save reusable color palettes to standardize customer brands."
            cta={{
              label: "New palette",
              onPress: () => notifySuccess("Custom palette builder coming soon"),
            }}
            icon={Palette}
            title="No brand palettes yet"
          />
        ) : (
          <Card className="rounded-2xl">
            <Card.Header>
              <Card.Title className="text-base">Color palettes</Card.Title>
              <Card.Description>Choose a theme or build a custom one.</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-2">
              {palettes.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    p.id === activePaletteId ? "border-accent" : "border-border"
                  }`}
                >
                  <div className="flex -space-x-1.5">
                    {[p.primary, p.secondary, p.accent].map((c) => (
                      <span
                        key={c}
                        className="border-background size-7 rounded-full border-2"
                        style={{backgroundColor: c}}
                      />
                    ))}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-foreground text-sm font-medium">{p.name}</span>
                    <span className="text-muted text-xs">
                      {p.primary} · {p.secondary} · {p.accent}
                    </span>
                  </div>
                  {p.id === activePaletteId ? (
                    <Chip color="success" size="sm" variant="soft">
                      Active
                    </Chip>
                  ) : (
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => {
                        setActivePaletteId(p.id);
                        notifySuccess(`Applied palette “${p.name}”`);
                      }}
                    >
                      Apply
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => notifySuccess("Custom palette builder coming soon")}
              >
                <Plus className="size-4" />
                Custom palette
              </Button>
            </Card.Content>
          </Card>
        )}
      </div>

      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-accent-soft text-accent flex size-8 items-center justify-center rounded-xl">
              <Globe className="size-4" />
            </span>
            <div className="flex flex-col">
              <Card.Title className="text-base">Branded domains</Card.Title>
              <Card.Description>
                Customer-facing domains for the app, mailers, and tracking links.
              </Card.Description>
            </div>
          </div>
          <ModalShell
            state={domainState}
            trigger={
              <Button size="sm" variant="tertiary">
                <Plus className="size-4" />
                Add domain
              </Button>
            }
          >
            <Modal.Container placement="center" size="md">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Add branded domain</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <TextField name="domain" value={domainInput} onChange={setDomainInput}>
                    <Label>Domain</Label>
                    <Input placeholder="app.youragency.com" />
                  </TextField>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="tertiary">
                    Cancel
                  </Button>
                  <Button
                    isDisabled={!domainInput.trim() || isAddingDomain}
                    onPress={handleAddDomain}
                  >
                    {isAddingDomain ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : null}
                    Add domain
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </ModalShell>
        </Card.Header>
        <Card.Content className="flex flex-col gap-2">
          {domains.length === 0 ? (
            <p className="text-muted py-6 text-center text-sm">
              Add a custom domain so customers see your brand, not ours.
            </p>
          ) : (
            domains.map((d) => (
              <div
                key={d.id}
                className="border-border bg-content1 flex items-center justify-between rounded-xl border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <Avatar.Fallback>{d.domain.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">{d.domain}</span>
                    <span className="text-muted text-xs capitalize">{d.type} domain</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {d.status !== "Active" && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      isDisabled={verifyingId !== null}
                      onPress={() => handleVerifyDomain(d.id)}
                    >
                      {verifyingId === d.id ? "Verifying…" : "Verify DNS"}
                    </Button>
                  )}
                  
                  <Chip
                    color={
                      d.status === "Active" ? "success" : d.status === "Pending" ? "warning" : "danger"
                    }
                    size="sm"
                    variant="soft"
                  >
                    {d.status}
                  </Chip>

                  <Button
                    size="sm"
                    variant="tertiary"
                    isIconOnly
                    isDisabled={deletingId !== null}
                    onPress={() => handleDeleteDomain(d.id)}
                  >
                    <TrashBin className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <Card.Header>
            <div className="flex items-center gap-2">
              <span className="bg-warning-soft text-warning flex size-8 items-center justify-center rounded-xl">
                <Palette className="size-4" />
              </span>
              <div className="flex flex-col">
                <Card.Title className="text-base">Email branding</Card.Title>
                <Card.Description>How transactional emails look to customers.</Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <TextField name="email-from-name" value={emailFromName} onChange={setEmailFromName}>
              <Label className="text-foreground text-sm font-medium">From name</Label>
              <Input placeholder="Your agency" />
            </TextField>
            <TextField name="email-from-address" value={emailFromAddress} onChange={setEmailFromAddress}>
              <Label className="text-foreground text-sm font-medium">From address</Label>
              <Input placeholder="hello@mail.youragency.com" type="email" />
            </TextField>
            <TextField name="email-footer" value={emailFooter} onChange={setEmailFooter}>
              <Label className="text-foreground text-sm font-medium">Footer text</Label>
              <Input placeholder="© Your agency · all rights reserved" />
            </TextField>
            <Checkbox id="email-show-statxeo" isSelected={emailHideBranding} onChange={setEmailHideBranding}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label htmlFor="email-show-statxeo">
                  Hide &quot;powered by StatXEO&quot; in customer emails
                </Label>
              </Checkbox.Content>
            </Checkbox>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header>
            <div className="flex items-center gap-2">
              <span className="bg-success-soft text-success flex size-8 items-center justify-center rounded-xl">
                <Star className="size-4" />
              </span>
              <div className="flex flex-col">
                <Card.Title className="text-base">Login page</Card.Title>
                <Card.Description>Headline, supporting copy, and background image.</Card.Description>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3">
            <TextField name="login-headline" value={loginHeadline} onChange={setLoginHeadline}>
              <Label className="text-foreground text-sm font-medium">Headline</Label>
              <Input placeholder="Welcome back" />
            </TextField>
            <TextField name="login-subhead" value={loginSubhead} onChange={setLoginSubhead}>
              <Label className="text-foreground text-sm font-medium">Sub-headline</Label>
              <Input placeholder="Sign in to manage your growth dashboard." />
            </TextField>
            <TextField name="login-bg-url" value={loginBgUrl} onChange={setLoginBgUrl}>
              <Label className="text-foreground text-sm font-medium">Background image URL</Label>
              <Input placeholder="https://unsplash.com/... or relative path" />
            </TextField>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
