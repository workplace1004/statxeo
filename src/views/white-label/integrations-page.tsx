"use client";

import {
  ArrowRight,
  Check,
  ChartLine,
  Megaphone,
  PlugWire,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import {useState} from "react";

import {notifySuccess} from "../../lib/ui/white-label-notify";
import {PageToolbar} from "../../widgets/white-label/page-toolbar";
import {ModalShell} from "../../lib/ui/modal-shell";

export interface ConnectedSocialAccount {
  id: string;
  whiteLabelerId: string;
  outstandAccountId: string;
  provider: string;
  displayName: string;
  isActive: boolean;
  connectedByUserId: string | null;
}

export interface WhiteLabelIntegrationsPageProps {
  socialAccounts: ConnectedSocialAccount[];
  metaAdsConnected: boolean;
  googleAdsConnected: boolean;
  googleAdsCustomerId: string | null;
}

export function WhiteLabelIntegrationsPage({
  socialAccounts,
  metaAdsConnected,
  googleAdsConnected,
  googleAdsCustomerId,
}: WhiteLabelIntegrationsPageProps) {
  const googleAdsModalState = useOverlayState();
  const [googleCustomerIdInput, setGoogleCustomerIdInput] = useState(googleAdsCustomerId ?? "");

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Connect a social account
  const handleConnectSocial = async (provider: string) => {
    setConnectingProvider(provider);
    try {
      const res = await fetch(`/api/social/connect?provider=${provider}`);
      const data = await res.json();
      if (data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error?.message || "Failed to initiate social connection");
        setConnectingProvider(null);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
      setConnectingProvider(null);
    }
  };

  // Disconnect a social account
  const handleDisconnectSocial = async (accountId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${providerName} account?`)) return;
    setDisconnectingId(accountId);
    try {
      const res = await fetch(`/api/social/accounts?accountId=${accountId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`${providerName} account disconnected successfully.`);
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to disconnect account");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setDisconnectingId(null);
    }
  };

  // Connect Meta Ads
  const handleConnectMetaAds = async () => {
    setConnectingMeta(true);
    try {
      const res = await fetch("/api/integrations/ads", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({network: "meta"}),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess("Meta Ads account connected successfully.");
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to connect Meta Ads");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setConnectingMeta(false);
    }
  };

  // Disconnect Meta Ads
  const handleDisconnectMetaAds = async () => {
    if (!confirm("Are you sure you want to disconnect Meta Ads?")) return;
    setConnectingMeta(true);
    try {
      const res = await fetch("/api/integrations/ads?network=meta", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess("Meta Ads account disconnected.");
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to disconnect Meta Ads");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setConnectingMeta(false);
    }
  };

  // Connect Google Ads
  const handleConnectGoogleAds = async () => {
    if (!googleCustomerIdInput.trim()) return;
    setConnectingGoogle(true);
    try {
      const res = await fetch("/api/integrations/ads", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          network: "google",
          customerId: googleCustomerIdInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess("Google Ads account connected successfully.");
        googleAdsModalState.close();
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to connect Google Ads");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setConnectingGoogle(false);
    }
  };

  // Disconnect Google Ads
  const handleDisconnectGoogleAds = async () => {
    if (!confirm("Are you sure you want to disconnect Google Ads?")) return;
    setConnectingGoogle(true);
    try {
      const res = await fetch("/api/integrations/ads?network=google", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess("Google Ads account disconnected.");
        window.location.reload();
      } else {
        alert(data.error?.message || "Failed to disconnect Google Ads");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setConnectingGoogle(false);
    }
  };

  const socialProviders = [
    {id: "facebook", label: "Facebook", desc: "Publish image posts and updates directly to pages."},
    {id: "instagram", label: "Instagram", desc: "Share photos and visual content to business profiles."},
    {id: "linkedin", label: "LinkedIn", desc: "Publish professional posts and updates to company pages."},
    {id: "twitter", label: "X (Twitter)", desc: "Post quick alerts and text snippets to accounts."},
    {id: "youtube", label: "YouTube", desc: "Upload and schedule video content to channels."},
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-10 pt-4">
      <PageToolbar
        description="Global integrations control center. Link publishing networks and advertising channels."
        showPeriod={false}
        title="Integrations"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Social Integrations Card */}
        <Card className="lg:col-span-2 rounded-2xl">
          <Card.Header className="flex flex-col items-start gap-1 pb-0 pt-5 px-6">
            <div className="flex items-center gap-2">
              <span className="bg-primary-soft text-primary flex size-8 items-center justify-center rounded-xl">
                <Megaphone className="size-4" />
              </span>
              <div className="flex flex-col">
                <Card.Title className="text-base">Social Media Channels</Card.Title>
                <Card.Description>Manage API authorization hooks with Outstand.so proxy.</Card.Description>
              </div>
            </div>
          </Card.Header>
          
          <Card.Content className="flex flex-col gap-4 px-6 py-6">
            {socialProviders.map((provider) => {
              const connectedAcc = socialAccounts.find(
                (acc) => acc.provider.toLowerCase() === provider.id
              );

              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between border-b border-default-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <Avatar.Fallback className="uppercase bg-default-100 font-semibold text-sm">
                        {provider.label.slice(0, 2)}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{provider.label}</span>
                        {connectedAcc && (
                          <Chip color="success" size="sm" variant="soft">
                            Active
                          </Chip>
                        )}
                      </div>
                      <span className="text-xs text-default-400">{provider.desc}</span>
                      {connectedAcc && (
                        <span className="text-xs font-mono text-default-500 mt-0.5">
                          Connected as: {connectedAcc.displayName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {connectedAcc ? (
                      <Button
                        size="sm"
                        variant="tertiary"
                        isIconOnly
                        isDisabled={disconnectingId !== null}
                        onPress={() => handleDisconnectSocial(connectedAcc.id, provider.label)}
                      >
                        {disconnectingId === connectedAcc.id ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <TrashBin className="size-4 text-danger" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={connectingProvider !== null}
                        onPress={() => handleConnectSocial(provider.id)}
                      >
                        {connectingProvider === provider.id ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                        ) : (
                          <PlugWire className="size-4 mr-1" />
                        )}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </Card.Content>
        </Card>

        {/* Ad Campaigns Integrations Card */}
        <Card className="rounded-2xl h-fit">
          <Card.Header className="px-6 pt-5 pb-2 flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-success-soft text-success flex size-8 items-center justify-center rounded-xl">
                <ChartLine className="size-4" />
              </span>
              <div className="flex flex-col">
                <Card.Title className="text-base">Ad Networks</Card.Title>
                <Card.Description>Authorize Google & Meta campaigns.</Card.Description>
              </div>
            </div>
          </Card.Header>

          <Card.Content className="px-6 pb-6 pt-2 flex flex-col gap-4">
            {/* Meta Ads Integration */}
            <div className="flex flex-col gap-2 border-b border-default-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Meta Ads Manager</span>
                  <span className="text-xs text-default-400">Automate Facebook & Instagram campaigns.</span>
                </div>
                {metaAdsConnected && (
                  <Chip color="success" size="sm" variant="soft">
                    Linked
                  </Chip>
                )}
              </div>
              <div className="flex justify-end pt-1">
                {metaAdsConnected ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    isDisabled={connectingMeta}
                    onPress={handleDisconnectMetaAds}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    isDisabled={connectingMeta}
                    onPress={handleConnectMetaAds}
                  >
                    {connectingMeta ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                    ) : (
                      <PlugWire className="size-4 mr-1" />
                    )}
                    Connect Meta
                  </Button>
                )}
              </div>
            </div>

            {/* Google Ads Integration */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Google Ads Manager</span>
                  <span className="text-xs text-default-400">Optimize search campaigns.</span>
                </div>
                {googleAdsConnected && (
                  <Chip color="success" size="sm" variant="soft">
                    Linked
                  </Chip>
                )}
              </div>
              {googleAdsConnected && googleAdsCustomerId && (
                <span className="text-xs font-mono text-default-500">
                  Customer ID: {googleAdsCustomerId}
                </span>
              )}
              <div className="flex justify-end pt-1">
                {googleAdsConnected ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    isDisabled={connectingGoogle}
                    onPress={handleDisconnectGoogleAds}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <ModalShell
                    state={googleAdsModalState}
                    trigger={
                      <Button size="sm">
                        <PlugWire className="size-4 mr-1" />
                        Connect Google
                      </Button>
                    }
                  >
                    <Modal.Container placement="center" size="md">
                      <Modal.Dialog>
                        <Modal.Header>
                          <Modal.Heading>Connect Google Ads</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                          <TextField
                            name="customerId"
                            value={googleCustomerIdInput}
                            onChange={setGoogleCustomerIdInput}
                          >
                            <Label>Google Ads Customer ID</Label>
                            <Input placeholder="xxx-xxx-xxxx" />
                          </TextField>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button slot="close" variant="tertiary">
                            Cancel
                          </Button>
                          <Button
                            isDisabled={!googleCustomerIdInput.trim() || connectingGoogle}
                            onPress={handleConnectGoogleAds}
                          >
                            {connectingGoogle ? (
                              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                            ) : null}
                            Connect Account
                          </Button>
                        </Modal.Footer>
                      </Modal.Dialog>
                    </Modal.Container>
                  </ModalShell>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
