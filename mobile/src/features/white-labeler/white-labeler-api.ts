import { Session } from "@supabase/supabase-js";

import { apiRequest } from "../../lib/api-client";

export type WhiteLabelerOverview = {
  account: {
    displayName: string;
    role: "owner" | "admin" | "member";
    status: string;
  };
  kpis: {
    activeClients: number;
    activeSites: number;
    monthRevenueCents: number;
    monthNetPayoutCents: number;
  };
};

export type WhiteLabelerClient = {
  id: string;
  client_name: string;
  billing_email: string | null;
  status: "active" | "paused" | "cancelled";
  active_site_count: number;
};

export async function fetchWhiteLabelerOverview(session: Session | null) {
  return apiRequest<WhiteLabelerOverview>("/api/white-labeler/overview", { session });
}

export async function fetchWhiteLabelerClients(session: Session | null) {
  return apiRequest<{ clients: WhiteLabelerClient[] }>("/api/white-labeler/clients?limit=50", { session });
}
