import "server-only";

import type {GoogleAuthPersona} from "@/server/auth/constants";

import type {AuthPrincipalType, SiteProjectAction} from "./permissions";
import {personaToPrincipal} from "./permissions";

export type SiteProjectsContext = {
  requestId: string;
  principal: AuthPrincipalType;
  userId: string | null;
  orgId: string | null;
  email: string | null;
  persona: GoogleAuthPersona | null;
  apiKeyId: string | null;
  apiKeyScopes: string[];
};

export function sessionContext(input: {
  requestId: string;
  userId: string;
  orgId: string;
  email: string;
  persona: GoogleAuthPersona;
}): SiteProjectsContext {
  return {
    requestId: input.requestId,
    principal: personaToPrincipal(input.persona),
    userId: input.userId,
    orgId: input.orgId,
    email: input.email,
    persona: input.persona,
    apiKeyId: null,
    apiKeyScopes: [],
  };
}

export function apiKeyContext(input: {
  requestId: string;
  apiKeyId: string;
  scopes: string[];
  orgId?: string | null;
}): SiteProjectsContext {
  return {
    requestId: input.requestId,
    principal: "api_key",
    userId: null,
    orgId: input.orgId ?? null,
    email: null,
    persona: null,
    apiKeyId: input.apiKeyId,
    apiKeyScopes: input.scopes,
  };
}

export function systemWorkerContext(requestId: string): SiteProjectsContext {
  return {
    requestId,
    principal: "system_worker",
    userId: null,
    orgId: null,
    email: null,
    persona: null,
    apiKeyId: null,
    apiKeyScopes: ["*"],
  };
}

export type {SiteProjectAction};
