/**
 * One-off: print site-generation–related rows from Supabase using .env.local.
 * Run: node scripts/dump-generation-context.mjs
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

function loadEnvLocal() {
  const raw = readFileSync(resolve(root, ".env.local"), "utf8")
  const env = {}
  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1)
    env[k] = v
  }
  return env
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: projects, error: pErr } = await supabase
  .from("statxeo_site_projects")
  .select(
    "id, lead_id, status, business_name, email, package_tier, template_id, preview_url, created_at, updated_at",
  )
  .order("updated_at", { ascending: false })
  .limit(50)

if (pErr) {
  console.error("statxeo_site_projects:", pErr.message)
  process.exit(1)
}

const { data: links, error: lErr } = await supabase
  .from("statxeo_customer_lead_links")
  .select("id, lead_id, user_id, created_at")
  .order("created_at", { ascending: false })
  .limit(100)

if (lErr) {
  console.error("statxeo_customer_lead_links:", lErr.message)
}

const projectIds = (projects ?? []).map((r) => r.id)
let jobs = []
if (projectIds.length) {
  const { data: j, error: jErr } = await supabase
    .from("statxeo_site_generation_jobs")
    .select("id, project_id, job_type, status, stage, error_message, created_at, completed_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(80)

  if (jErr) console.error("statxeo_site_generation_jobs:", jErr.message)
  else jobs = j ?? []
}

let users = []
const { data: authData, error: uErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
if (uErr) console.error("auth.users:", uErr.message)
else users = authData?.users ?? []

const userById = Object.fromEntries(users.map((u) => [u.id, u.email]))

const out = {
  generatedAt: new Date().toISOString(),
  siteProjects: projects ?? [],
  customerLeadLinks: links ?? [],
  generationJobs: jobs,
  usersSample: users.slice(0, 30).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
  })),
  /** Join hint: link.user_id -> usersSample.id; link.lead_id -> project.lead_id */
  triggerReadyProjects: (projects ?? []).filter((pr) =>
    ["ready_for_generation", "assets_pending", "changes_requested", "failed"].includes(pr.status),
  ),
  linksWithEmail: (links ?? []).map((l) => ({
    ...l,
    user_email: userById[l.user_id] ?? null,
  })),
}

console.log(JSON.stringify(out, null, 2))
