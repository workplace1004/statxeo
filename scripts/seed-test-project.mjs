/**
 * Seed script: creates a test site project linked to the demo customer account.
 * Run: node scripts/seed-test-project.mjs
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS.
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

// ─── Load .env.local ─────────────────────────────────────────────────────────
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

// ─── Step 1: Find the demo customer user ─────────────────────────────────────
console.log("🔍  Looking up demo customer user...")

const DEMO_EMAIL = "white-labeler-demo-owner@statxt.com"

const { data: { users }, error: userErr } = await db.auth.admin.listUsers()
if (userErr) { console.error("❌  listUsers:", userErr.message); process.exit(1) }

const demoUser = users.find(u => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase())
if (!demoUser) {
  console.error(`❌  No user found with email: ${DEMO_EMAIL}`)
  console.log("Available users:", users.map(u => u.email).join(", "))
  process.exit(1)
}
console.log(`✅  Found user: ${demoUser.email} (${demoUser.id})`)

// ─── Step 2: Find or create a lead ───────────────────────────────────────────
console.log("🔍  Looking for existing lead...")

let leadId

const { data: existingLead } = await db
  .from("statxeo_leads")
  .select("id, contact_email, business_name")
  .ilike("contact_email", DEMO_EMAIL)
  .maybeSingle()

if (existingLead) {
  leadId = existingLead.id
  console.log(`✅  Found existing lead: ${existingLead.business_name ?? existingLead.contact_email} (${leadId})`)
} else {
  console.log("➕  Creating new lead...")
  const { data: newLead, error: leadErr } = await db
    .from("statxeo_leads")
    .insert({
      contact_email: DEMO_EMAIL,
      contact_name: "Demo Owner",
      business_name: "Demo Plumbing Co.",
      business_industry: "Plumbing",
      business_address: "123 Main St, Dallas, TX 75201",
      phone: "+1 (214) 555-0100",
      business_products_services: "Residential and commercial plumbing, drain cleaning, water heater installation",
      source: "seed_script",
      status: "active",
    })
    .select("id")
    .single()

  if (leadErr) { console.error("❌  Create lead:", leadErr.message); process.exit(1) }
  leadId = newLead.id
  console.log(`✅  Created lead: ${leadId}`)
}

// ─── Step 3: Check for existing site project ─────────────────────────────────
console.log("🔍  Checking for existing site project...")

const { data: existingProject } = await db
  .from("statxeo_site_projects")
  .select("id, status, business_name")
  .eq("lead_id", leadId)
  .maybeSingle()

if (existingProject) {
  console.log(`\n⚠️   A site project already exists for this lead:`)
  console.log(`    ID:     ${existingProject.id}`)
  console.log(`    Name:   ${existingProject.business_name}`)
  console.log(`    Status: ${existingProject.status}`)
  console.log(`\n    Resetting status to 'awaiting_preferences' so the form shows...`)

  await db
    .from("statxeo_site_projects")
    .update({ status: "awaiting_preferences" })
    .eq("id", existingProject.id)

  console.log(`✅  Status reset. Visit: http://localhost:3001/customer/website`)
  process.exit(0)
}

// ─── Step 4: Create site project ─────────────────────────────────────────────
console.log("➕  Creating site project...")

const { data: project, error: projErr } = await db
  .from("statxeo_site_projects")
  .insert({
    lead_id: leadId,
    package_tier: "statxeo_thin",
    business_name: "Demo Plumbing Co.",
    owner_full_name: "Demo Owner",
    email: DEMO_EMAIL,
    phone: "+1 (214) 555-0100",
    business_industry: "Plumbing",
    business_address: "123 Main St, Dallas, TX 75201",
    business_products_services: "Residential and commercial plumbing, drain cleaning, water heater installation",
    status: "awaiting_preferences",
    template_id: "lander-default",
    template_version: 1,
  })
  .select("id")
  .single()

if (projErr) { console.error("❌  Create project:", projErr.message); process.exit(1) }
console.log(`✅  Created site project: ${project.id}`)

// ─── Step 5: Link user to lead ────────────────────────────────────────────────
console.log("🔗  Linking user to lead...")

const { error: linkErr } = await db
  .from("statxeo_customer_lead_links")
  .upsert(
    { user_id: demoUser.id, lead_id: leadId },
    { onConflict: "user_id,lead_id", ignoreDuplicates: true }
  )

if (linkErr) {
  console.warn("⚠️   Link warning (may already exist):", linkErr.message)
} else {
  console.log(`✅  User linked to lead`)
}

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log(`
✨  Done! Visit:
    http://localhost:3001/customer/website

    You should now see the form with Brand / Content / Media / Social tabs.
    Status: awaiting_preferences
`)
