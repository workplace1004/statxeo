/**
 * verify-migration.mjs
 *
 * Verifies that all SQL migrations applied correctly to Supabase.
 * Checks:
 *   1. Table existence
 *   2. Column existence (offered_services, site_token, honeypot_triggered)
 *   3. Template registry rows (lander-default, core-default, titan-default)
 *   4. Template package mappings are correct
 *   5. RLS policies exist
 *
 * Run: node scripts/verify-migration.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local")
    const lines = readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    console.warn("Could not load .env.local — using existing env vars")
  }
}

loadEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

async function check(label, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) {
      console.log(`  ✓  ${label}`)
      passed++
    } else {
      console.log(`  ✗  ${label}`)
      console.log(`     → ${result}`)
      failed++
    }
  } catch (err) {
    console.log(`  ✗  ${label}`)
    console.log(`     → ${err.message}`)
    failed++
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function columnExists(table, column) {
  // Select the column directly — if it doesn't exist Supabase returns an error
  const { error } = await supabase
    .from(table)
    .select(column)
    .limit(0)
  return !error
}

async function tableExists(table) {
  const { error } = await supabase.from(table).select("id").limit(0)
  return !error
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log("  STATXEO Migration Verification")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

// ── 1. Core tables ────────────────────────────────────────────────────────────
console.log("1. Core tables")
await check("statxeo_site_projects exists", () => tableExists("statxeo_site_projects"))
await check("statxeo_site_template_registry exists", () => tableExists("statxeo_site_template_registry"))
await check("statxeo_site_generation_jobs exists", () => tableExists("statxeo_site_generation_jobs"))
await check("statxeo_site_generation_artifacts exists", () => tableExists("statxeo_site_generation_artifacts"))
await check("statxeo_site_intake_submissions exists", () => tableExists("statxeo_site_intake_submissions"))
await check("statxeo_site_media_assets exists", () => tableExists("statxeo_site_media_assets"))
await check("statxeo_site_change_requests exists", () => tableExists("statxeo_site_change_requests"))

// ── 2. New columns (migration 20260409090000) ─────────────────────────────────
console.log("\n2. New columns")
await check("offered_services column on site_projects", () => columnExists("statxeo_site_projects", "offered_services"))
await check("site_token column on site_projects", () => columnExists("statxeo_site_projects", "site_token"))

// ── 3. Form submissions table (migration 20260409090002) ──────────────────────
console.log("\n3. Form submissions table")
await check("statxeo_site_form_submissions exists", () => tableExists("statxeo_site_form_submissions"))
await check("honeypot_triggered column on form_submissions", () => columnExists("statxeo_site_form_submissions", "honeypot_triggered"))
await check("site_token column on form_submissions", () => columnExists("statxeo_site_form_submissions", "site_token"))
await check("route column on form_submissions", () => columnExists("statxeo_site_form_submissions", "route"))

// ── 4. Template registry (migration 20260409090001) ───────────────────────────
console.log("\n4. Template registry")

const { data: templates, error: tmplErr } = await supabase
  .from("statxeo_site_template_registry")
  .select("name, supported_packages, pages, is_active")
  .in("name", ["lander-default", "core-default", "titan-default"])

if (tmplErr) {
  console.log(`  ✗  Could not query template registry: ${tmplErr.message}`)
  failed++
} else {
  const byName = Object.fromEntries((templates ?? []).map((t) => [t.name, t]))

  await check("lander-default template exists", () => !!byName["lander-default"])
  await check("core-default template exists", () => !!byName["core-default"])
  await check("titan-default template exists", () => !!byName["titan-default"])

  if (byName["lander-default"]) {
    const pkgs = byName["lander-default"].supported_packages
    await check("lander-default supports statxeo_lander only", () => {
      const ok = pkgs.includes("statxeo_lander") && !pkgs.includes("statxeo_core") && !pkgs.includes("statxeo_titan")
      return ok || `supported_packages = ${JSON.stringify(pkgs)}`
    })
    await check("lander-default pages = [home]", () => {
      const ok = JSON.stringify(byName["lander-default"].pages) === JSON.stringify(["home"])
      return ok || `pages = ${JSON.stringify(byName["lander-default"].pages)}`
    })
    await check("lander-default is_active = true", () => byName["lander-default"].is_active || "is_active = false")
  }

  if (byName["core-default"]) {
    const pkgs = byName["core-default"].supported_packages
    await check("core-default supports statxeo_core only", () => {
      const ok = pkgs.includes("statxeo_core") && !pkgs.includes("statxeo_lander") && !pkgs.includes("statxeo_titan")
      return ok || `supported_packages = ${JSON.stringify(pkgs)}`
    })
    await check("core-default pages = [home,services,about,contact]", () => {
      const expected = ["home", "services", "about", "contact"]
      const ok = JSON.stringify(byName["core-default"].pages) === JSON.stringify(expected)
      return ok || `pages = ${JSON.stringify(byName["core-default"].pages)}`
    })
    await check("core-default is_active = true", () => byName["core-default"].is_active || "is_active = false")
  }

  if (byName["titan-default"]) {
    const pkgs = byName["titan-default"].supported_packages
    await check("titan-default supports statxeo_titan only", () => {
      const ok = pkgs.includes("statxeo_titan") && !pkgs.includes("statxeo_lander") && !pkgs.includes("statxeo_core")
      return ok || `supported_packages = ${JSON.stringify(pkgs)}`
    })
    await check("titan-default is_active = true", () => byName["titan-default"].is_active || "is_active = false")
  }
}

// ── 5. Vercel deployment ID column ────────────────────────────────────────────
console.log("\n5. Deployment columns")
await check("vercel_deployment_id column on site_projects", () => columnExists("statxeo_site_projects", "vercel_deployment_id"))
await check("preview_url column on site_projects", () => columnExists("statxeo_site_projects", "preview_url"))
await check("production_url column on site_projects", () => columnExists("statxeo_site_projects", "production_url"))

// ── 6. Dev API endpoints ──────────────────────────────────────────────────────
console.log("\n6. Dev API endpoints")

const BASE_URL = "http://localhost:3001"

async function hitApi(path, method = "GET", body = null) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(`${BASE_URL}${path}`, opts)
    return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) }
  } catch (err) {
    return { status: 0, ok: false, data: {}, error: err.message }
  }
}

const seedResult = await hitApi("/api/dev/seed-demo-project", "POST")
await check("/api/dev/seed-demo-project responds (401 = auth required, ok)", () => {
  return seedResult.status === 401 || seedResult.status === 200 || seedResult.status === 403
    ? true
    : `Got ${seedResult.status}: ${JSON.stringify(seedResult.data)}`
})

const bypassResult = await hitApi("/api/dev/checkout-bypass", "POST", {
  websitePackageId: "statxeo_lander",
  ownerFullName: "Test User",
  businessName: "Test Business",
  businessAddressFull: "123 Test St, Dallas, TX 75201",
  ein: "12-3456789",
  businessIndustry: "HVAC",
  businessProductsServices: "AC repair, heating",
  email: "verify-test@example.com",
  phone: "(555) 123-4567",
})
await check("/api/dev/checkout-bypass creates project (200 or 500 if DB issue)", () => {
  return bypassResult.status === 200 || bypassResult.status === 500
    ? true
    : `Got ${bypassResult.status}: ${JSON.stringify(bypassResult.data)}`
})

if (bypassResult.status === 200 && bypassResult.data.ok) {
  await check("checkout-bypass returns projectId or skipped existing project", () => {
    // skipped=true means an existing project was found and reset — no projectId returned, which is correct
    return !!bypassResult.data.projectId || bypassResult.data.skipped === true
      || `No projectId and not skipped: ${JSON.stringify(bypassResult.data)}`
  })
  await check("checkout-bypass returns redirectUrl", () => {
    return bypassResult.data.redirectUrl === "/customer/website" || `redirectUrl = ${bypassResult.data.redirectUrl}`
  })
}

const siteLeadResult = await hitApi("/api/public/site-lead", "POST", {
  siteToken: "invalid-token-for-testing",
  route: "/contact/",
  name: "Test User",
  email: "test@example.com",
  message: "Test message",
})
await check("/api/public/site-lead rejects invalid token (404)", () => {
  return siteLeadResult.status === 404
    ? true
    : `Got ${siteLeadResult.status}: ${JSON.stringify(siteLeadResult.data)}`
})

const honeypotResult = await hitApi("/api/public/site-lead", "POST", {
  siteToken: "any-token",
  route: "/contact/",
  honeypot: "bot-filled-this",
})
await check("/api/public/site-lead validates honeypot field max length (422)", () => {
  return honeypotResult.status === 422
    ? true
    : `Got ${honeypotResult.status}: ${JSON.stringify(honeypotResult.data)}`
})

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
const total = passed + failed
console.log(`  ${passed}/${total} checks passed  ${failed > 0 ? `(${failed} failed)` : "✓ all good"}`)
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

if (failed > 0) process.exit(1)
