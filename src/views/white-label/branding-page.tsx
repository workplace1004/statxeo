"use client";

import type {
  BrandAsset,
  BrandPalette,
  BrandedDomain,
} from "../../server/db/schemas/branding";

import {
  ArrowUpFromSquare,
  Check,
  Globe,
  Palette,
  Pencil,
  Plus,
  Star,
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
}

export function WhiteLabelBrandingPage({
  assets,
  domains,
  palettes,
}: WhiteLabelBrandingPageProps) {
  const domainState = useOverlayState();
  const [activePaletteId, setActivePaletteId] = useState(palettes[0]?.id ?? "");
  const [domainInput, setDomainInput] = useState("");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      <PageToolbar
        description="Make the platform yours — logo, colors, custom domain, and login experience."
        showPeriod={false}
        title="Branding"
        trailing={
          <Button
            size="sm"
            onPress={() => notifySuccess("Branding published to all customer workspaces")}
          >
            <Check className="size-4" />
            Publish branding
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
              {palettes.map((p, idx) => (
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
                      isDisabled={!domainInput.trim()}
                      onPress={() => {
                        notifySuccess(`Domain ${domainInput.trim()} added — DNS verification pending`);
                        setDomainInput("");
                        domainState.close();
                      }}
                    >
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
                <Chip
                  color={
                    d.status === "Active" ? "success" : d.status === "Pending" ? "warning" : "danger"
                  }
                  size="sm"
                  variant="soft"
                >
                  {d.status}
                </Chip>
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
            <TextField name="email-from-name">
              <Label className="text-foreground text-sm font-medium">From name</Label>
              <Input placeholder="Your agency" />
            </TextField>
            <TextField name="email-from-address">
              <Label className="text-foreground text-sm font-medium">From address</Label>
              <Input placeholder="hello@mail.youragency.com" type="email" />
            </TextField>
            <TextField name="email-footer">
              <Label className="text-foreground text-sm font-medium">Footer text</Label>
              <Input placeholder="© Your agency · all rights reserved" />
            </TextField>
            <Checkbox id="email-show-statxeo">
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
            <TextField name="login-headline">
              <Label className="text-foreground text-sm font-medium">Headline</Label>
              <Input placeholder="Welcome back" />
            </TextField>
            <TextField name="login-subhead">
              <Label className="text-foreground text-sm font-medium">Sub-headline</Label>
              <Input placeholder="Sign in to manage your growth dashboard." />
            </TextField>
            <div className="bg-content2 text-muted flex aspect-[4/2] items-center justify-center rounded-xl text-xs">
              Drag background image here · 1920 × 1080 recommended
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
