import { createBrowserSupabaseClient } from "@/lib/supabase/client"

// ─── Types ──────────────────────────────────────────────────────────────────

export type SiteProject = {
  id: string
  lead_id: string
  package_tier: string
  business_name: string | null
  owner_full_name: string | null
  status: string
  preview_url: string | null
  production_url: string | null
  domain_name: string | null
  template_id: string | null
  brand_tone: string | null
  primary_color: string | null
  secondary_color: string | null
  target_audience: string | null
  cta_preference: string | null
  created_at: string
  updated_at: string
}

export type SiteProjectDetail = SiteProject & {
  business_industry: string | null
  business_address: string | null
  business_products_services: string | null
  email: string | null
  phone: string | null
  unique_selling_points: string[] | null
  offered_services: string[] | null
  service_areas: string[] | null
  business_hours: Record<string, string> | null
  social_links: Record<string, string> | null
  template_version: number
  purchase_id: string | null
  white_labeler_id: string | null
  statxeo_site_generation_jobs: GenerationJob[]
  statxeo_site_change_requests: ChangeRequest[]
  statxeo_site_media_assets: MediaAsset[]
  // Enriched from preview_deployment artifact
  previewPages: string[] | null
  pageCount: number | null
  sitemapRoutes: string[] | null
}

export type GenerationJob = {
  id: string
  job_type: string
  status: string
  stage: string
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export type ChangeRequest = {
  id: string
  scope_type: string
  page_key: string | null
  section_key: string | null
  description: string
  status: string
  created_at: string
  resolved_at: string | null
}

export type MediaAsset = {
  id: string
  asset_type: string
  storage_path: string
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  placement_hint: string | null
  sort_order: number
  created_at: string
}

export type SignedUploadResult = {
  signedUrl: string
  token: string
  storagePath: string
  bucket: string
}

// ─── Error class ────────────────────────────────────────────────────────────

export class SiteProjectApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "SiteProjectApiError"
    this.status = status
    this.payload = payload
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  }

  try {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      headers.authorization = `Bearer ${session.access_token}`
    }
  } catch {
    // Proceed without auth
  }

  return headers
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()

  const response = await fetch(path, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    cache: "no-store",
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const msg =
      typeof payload?.error === "string"
        ? payload.error
        : response.status === 401
          ? "You need to sign in."
          : "Request failed."
    throw new SiteProjectApiError(msg, response.status, payload)
  }

  return payload as T
}

// ─── API functions ──────────────────────────────────────────────────────────

export async function fetchSiteProjects(): Promise<SiteProject[]> {
  const data = await request<{ projects: SiteProject[] }>("/api/site-projects")
  return data.projects ?? []
}

export async function fetchSiteProjectDetail(projectId: string): Promise<SiteProjectDetail> {
  const data = await request<{
    project: SiteProjectDetail
    previewPages: string[] | null
    pageCount: number | null
    sitemapRoutes: string[] | null
  }>(`/api/site-projects/${projectId}`)
  return {
    ...data.project,
    previewPages: data.previewPages ?? null,
    pageCount: data.pageCount ?? null,
    sitemapRoutes: data.sitemapRoutes ?? null,
  }
}

export async function updateSiteProject(
  projectId: string,
  updates: Record<string, unknown>,
): Promise<{ id: string; status: string; updated_at: string }> {
  const data = await request<{ project: { id: string; status: string; updated_at: string } }>(
    `/api/site-projects/${projectId}`,
    { method: "PATCH", body: JSON.stringify(updates) },
  )
  return data.project
}

export async function saveIntakePreferences(
  projectId: string,
  preferences: Record<string, unknown>,
): Promise<{ ok: boolean; version: number; status: string }> {
  return request(`/api/site-projects/${projectId}/intake`, {
    method: "POST",
    body: JSON.stringify(preferences),
  })
}

export async function requestSignedUpload(
  projectId: string,
  file: { filename: string; mimeType: string; assetType: "logo" | "photo" | "favicon"; sizeBytes: number },
): Promise<SignedUploadResult> {
  return request(`/api/site-projects/${projectId}/media/sign-upload`, {
    method: "POST",
    body: JSON.stringify(file),
  })
}

export async function registerMediaAsset(
  projectId: string,
  asset: {
    storageBucket: string
    storagePath: string
    assetType: "logo" | "photo" | "favicon"
    originalFilename?: string
    mimeType?: string
    sizeBytes?: number
    placementHint?: string
  },
): Promise<MediaAsset> {
  const data = await request<{ asset: MediaAsset }>(`/api/site-projects/${projectId}/media`, {
    method: "POST",
    body: JSON.stringify(asset),
  })
  return data.asset
}

export async function uploadMediaFile(
  projectId: string,
  file: File,
  assetType: "logo" | "photo" | "favicon",
  placementHint?: string,
): Promise<MediaAsset> {
  // 1. Get signed upload URL
  const signed = await requestSignedUpload(projectId, {
    filename: file.name,
    mimeType: file.type,
    assetType,
    sizeBytes: file.size,
  })

  // 2. Upload directly to Supabase Storage
  const uploadResponse = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new SiteProjectApiError("File upload failed", uploadResponse.status, null)
  }

  // 3. Register the asset in the database
  return registerMediaAsset(projectId, {
    storageBucket: signed.bucket,
    storagePath: signed.storagePath,
    assetType,
    originalFilename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    placementHint,
  })
}

export async function fetchMediaAssets(projectId: string): Promise<MediaAsset[]> {
  const data = await request<{ assets: MediaAsset[] }>(`/api/site-projects/${projectId}/media`)
  return data.assets ?? []
}

export async function fetchChangeRequests(projectId: string): Promise<ChangeRequest[]> {
  const data = await request<{ changeRequests: ChangeRequest[] }>(
    `/api/site-projects/${projectId}/change-requests`,
  )
  return data.changeRequests ?? []
}

export async function createChangeRequest(
  projectId: string,
  payload: { scopeType: string; pageKey?: string; sectionKey?: string; description: string },
): Promise<ChangeRequest> {
  const data = await request<{ changeRequest: ChangeRequest }>(
    `/api/site-projects/${projectId}/change-requests`,
    { method: "POST", body: JSON.stringify(payload) },
  )
  return data.changeRequest
}

export async function triggerGeneration(
  projectId: string,
): Promise<GenerationJob> {
  const data = await request<{ job: GenerationJob }>(`/api/site-projects/${projectId}/trigger`, {
    method: "POST",
  })
  return data.job
}

export async function approveSiteProject(projectId: string): Promise<GenerationJob> {
  const data = await request<{ job: GenerationJob }>("/api/ai/approve", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  })
  return data.job
}

export async function fetchGenerationStatus(projectId: string): Promise<{
  projectId: string
  projectStatus: string
  latestJob: GenerationJob | null
  artifacts: Array<{ artifact_type: string; schema_version: string; created_at: string }>
}> {
  return request(`/api/ai/status/${projectId}`)
}
