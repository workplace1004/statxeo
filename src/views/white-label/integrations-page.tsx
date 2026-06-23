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
import {PageToolbar} from "../../widgets/page-toolbar";
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
  microsoftAdsConnected?: boolean;
  microsoftAdsCustomerId?: string | null;
  linkedinAdsConnected?: boolean;
  linkedinAdsAccountId?: string | null;
  tiktokAdsConnected?: boolean;
  tiktokAdsAdvertiserId?: string | null;
  amazonAdsConnected?: boolean;
  amazonAdsProfileId?: string | null;
}

export function WhiteLabelIntegrationsPage({
  socialAccounts,
  metaAdsConnected,
  googleAdsConnected,
  googleAdsCustomerId,
  microsoftAdsConnected = false,
  microsoftAdsCustomerId = null,
  linkedinAdsConnected = false,
  linkedinAdsAccountId = null,
  tiktokAdsConnected = false,
  tiktokAdsAdvertiserId = null,
  amazonAdsConnected = false,
  amazonAdsProfileId = null,
}: WhiteLabelIntegrationsPageProps) {
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  
  const [disconnectingNetwork, setDisconnectingNetwork] = useState<string | null>(null);

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

  // Connect Native Ads via OAuth 2.0
  const handleConnectAds = (network: string) => {
    window.location.href = `/api/auth/integrations/${network}/login`;
  };

  // Disconnect Native Ads
  const handleDisconnectAds = async (network: string, label: string) => {
    if (!confirm(`Are you sure you want to disconnect ${label}?`)) return;
    setDisconnectingNetwork(network);
    try {
      const res = await fetch(`/api/integrations/ads?network=${network}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        notifySuccess(`${label} account disconnected.`);
        window.location.reload();
      } else {
        alert(data.error?.message || `Failed to disconnect ${label}`);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setDisconnectingNetwork(null);
    }
  };

  const socialProviders = [
    {id: "facebook", label: "Facebook", desc: "Publish image posts and updates directly to pages."},
    {id: "instagram", label: "Instagram", desc: "Share photos and visual content to business profiles."},
    {id: "linkedin", label: "LinkedIn", desc: "Publish professional posts and updates to company pages."},
    {id: "twitter", label: "X (Twitter)", desc: "Post quick alerts and text snippets to accounts."},
    {id: "youtube", label: "YouTube", desc: "Upload and schedule video content to channels."},
  ];

  const adNetworks = [
    {
      id: "google",
      label: "Google Ads",
      desc: "Optimize search & display campaigns.",
      connected: googleAdsConnected,
      accountId: googleAdsCustomerId,
      scopes: "Ads Management (read/write)",
    },
    {
      id: "meta",
      label: "Meta Ads Manager",
      desc: "Automate Facebook & Instagram campaigns.",
      connected: metaAdsConnected,
      accountId: metaAdsConnected ? "Authorized Profile" : null,
      scopes: "Ads Management, Page Posts (read/write)",
    },
    {
      id: "microsoft",
      label: "Microsoft Advertising",
      desc: "Automate Bing search campaigns.",
      connected: microsoftAdsConnected,
      accountId: microsoftAdsCustomerId,
      scopes: "Ads Management, Offline Access (read/write)",
    },
    {
      id: "linkedin",
      label: "LinkedIn Campaign Manager",
      desc: "Optimize professional B2B campaigns.",
      connected: linkedinAdsConnected,
      accountId: linkedinAdsAccountId,
      scopes: "Ads, Reporting, Company Social (read/write)",
    },
    {
      id: "tiktok",
      label: "TikTok Ads Manager",
      desc: "Manage and optimize video ad creatives.",
      connected: tiktokAdsConnected,
      accountId: tiktokAdsAdvertiserId,
      scopes: "Ads Management (read/write)",
    },
    {
      id: "amazon",
      label: "Amazon Advertising",
      desc: "Automate sponsored product ads.",
      connected: amazonAdsConnected,
      accountId: amazonAdsProfileId,
      scopes: "Campaign Management (read/write)",
    },
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
                <Card.Description>Authorize and manage native campaign sync.</Card.Description>
              </div>
            </div>
          </Card.Header>

          <Card.Content className="px-6 pb-6 pt-2 flex flex-col gap-4">
            {adNetworks.map((network) => (
              <div
                key={network.id}
                className="flex flex-col gap-2 border-b border-default-100 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{network.label}</span>
                      {network.connected && (
                        <Chip color="success" size="sm" variant="soft">
                          Active
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-default-400 mt-0.5">{network.desc}</span>
                    
                    {network.connected && (
                      <div className="mt-2 flex flex-col gap-1 rounded-lg bg-default-50 p-2 border border-default-100">
                        {network.accountId && (
                          <div className="flex items-center justify-between text-[10px] font-mono text-default-600">
                            <span>ID:</span>
                            <span>{network.accountId}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] font-mono text-default-600">
                          <span>Scopes:</span>
                          <span className="text-right text-primary font-semibold">{network.scopes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  {network.connected ? (
                    <Button
                      size="sm"
                      variant="tertiary"
                      isDisabled={disconnectingNetwork !== null}
                      onPress={() => handleDisconnectAds(network.id, network.label)}
                    >
                      {disconnectingNetwork === network.id ? (
                        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                      ) : (
                        <TrashBin className="size-4 mr-1 text-danger" />
                      )}
                      <span className="text-danger">Disconnect</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => handleConnectAds(network.id)}
                    >
                      <PlugWire className="size-4 mr-1" />
                      Connect via OAuth 2.0
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
