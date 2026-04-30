import { createHash } from "crypto"

const VERCEL_API = "https://api.vercel.com"

export class VercelNotConfiguredError extends Error {
  constructor() {
    super("VERCEL_TOKEN is not set — skipping Vercel deployment")
    this.name = "VercelNotConfiguredError"
  }
}

export class VercelApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "VercelApiError"
    this.status = status
    this.body = body
  }
}

export type VercelDeploymentFile = {
  file: string
  content: string
}

export type VercelDeploymentResult = {
  id: string
  url: string
  inspectorUrl: string | null
  readyState: string
}

function getConfig(): { token: string; teamId: string | null } {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new VercelNotConfiguredError()
  return { token, teamId: process.env.VERCEL_TEAM_ID ?? null }
}

async function vercelFetch(
  path: string,
  init: RequestInit & { token: string; teamId: string | null },
): Promise<Response> {
  const { token, teamId, ...fetchInit } = init
  const url = new URL(`${VERCEL_API}${path}`)
  if (teamId) url.searchParams.set("teamId", teamId)

  const res = await fetch(url.toString(), {
    ...fetchInit,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(fetchInit.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      (body as { error?: { message?: string } })?.error?.message ??
      `Vercel API error: ${res.status}`
    throw new VercelApiError(msg, res.status, body)
  }

  return res
}

async function uploadFile(
  content: string,
  token: string,
  teamId: string | null,
): Promise<{ sha: string; size: number }> {
  const buf = Buffer.from(content, "utf-8")
  const sha = createHash("sha1").update(buf).digest("hex")
  const size = buf.byteLength

  const url = new URL(`${VERCEL_API}/v2/files`)
  if (teamId) url.searchParams.set("teamId", teamId)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${token}`,
      "x-now-digest": sha,
      "x-now-size": String(size),
    },
    body: buf,
  })

  if (!res.ok && res.status !== 409) {
    const body = await res.json().catch(() => ({}))
    throw new VercelApiError(`File upload failed: ${res.status}`, res.status, body)
  }

  return { sha, size }
}

async function ensureProjectPublic(name: string, token: string, teamId: string | null): Promise<void> {
  await vercelFetch(`/v9/projects`, {
    method: "POST",
    token,
    teamId,
    body: JSON.stringify({ name, framework: null }),
  }).catch((err: unknown) => {
    if (err instanceof VercelApiError && err.status === 409) return
    throw err
  })

  await vercelFetch(`/v9/projects/${encodeURIComponent(name)}`, {
    method: "PATCH",
    token,
    teamId,
    body: JSON.stringify({ ssoProtection: null, passwordProtection: null }),
  })
}

export async function deployToVercel(
  name: string,
  files: VercelDeploymentFile[],
  target: "preview" | "production" = "preview",
): Promise<VercelDeploymentResult> {
  const { token, teamId } = getConfig()

  await ensureProjectPublic(name, token, teamId)

  const fileRefs = await Promise.all(
    files.map(async (f) => {
      const { sha, size } = await uploadFile(f.content, token, teamId)
      return { file: f.file, sha, size }
    }),
  )

  // For static file deployments, Vercel only accepts "production" as a target.
  // Omitting `target` creates a preview deployment by default.
  const deployBody: Record<string, unknown> = {
    name,
    files: fileRefs,
    projectSettings: { framework: null },
  }
  if (target === "production") {
    deployBody.target = "production"
  }

  const res = await vercelFetch("/v13/deployments", {
    method: "POST",
    token,
    teamId,
    body: JSON.stringify(deployBody),
  })

  const deployment = (await res.json()) as {
    id: string
    url: string
    inspectorUrl?: string
    readyState: string
  }

  const url = target === "production" ? `${name}.vercel.app` : deployment.url

  return {
    id: deployment.id,
    url,
    inspectorUrl: deployment.inspectorUrl ?? null,
    readyState: deployment.readyState,
  }
}

export function vercelProjectName(projectId: string): string {
  const short = projectId.replace(/-/g, "").slice(0, 8)
  return `statxai-${short}`
}
