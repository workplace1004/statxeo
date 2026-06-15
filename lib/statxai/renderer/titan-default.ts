import type { RenderManifest } from "../agents/build-manifest"
import type { RenderResult } from "./primitives"
import { renderCoreDefault } from "./core-default"
import { esc, iconSvg, renderHead, renderNav, renderFooter, s, sa } from "./primitives"

/**
 * Titan renderer — Core pages + service detail pages + city/area pages.
 * Spreads Core output and adds dynamic routes.
 * Contact form is only on /contact/ (inherited from Core).
 */

export function renderTitanDefault(manifest: RenderManifest, siteToken: string): RenderResult {
  // Start with Core output
  const coreResult = renderCoreDefault(manifest, siteToken)

  const { meta } = manifest
  const navLinks = [
    { href: "/services/", label: "Services" },
    { href: "/about/", label: "About" },
    { href: "/contact/", label: "Contact" },
  ]

  const extraFiles: Record<string, string> = {}
  const extraPreviewPages: string[] = []
  const extraSitemapRoutes: string[] = []

  // ── Service detail pages ──────────────────────────────────────────────────
  for (const [routeKey, slots] of Object.entries(manifest.slotsByRoute)) {
    if (!routeKey.startsWith("services/")) continue

    const slug = routeKey.replace("services/", "")
    const seo = manifest.seoByRoute[routeKey]
    const filePath = `${routeKey}/index.html`
    const urlPath = `/${routeKey}/`

    extraFiles[filePath] = renderServiceDetailPage(manifest, slots, seo, navLinks, slug)
    extraPreviewPages.push(urlPath)
    extraSitemapRoutes.push(urlPath)
  }

  // ── City/area pages ───────────────────────────────────────────────────────
  for (const [routeKey, slots] of Object.entries(manifest.slotsByRoute)) {
    // City pages are top-level routes (not services/, about/, contact/, index)
    if (
      routeKey === "index" ||
      routeKey === "services" ||
      routeKey === "about" ||
      routeKey === "contact" ||
      routeKey.startsWith("services/")
    ) continue

    const seo = manifest.seoByRoute[routeKey]
    const filePath = `${routeKey}/index.html`
    const urlPath = `/${routeKey}/`

    extraFiles[filePath] = renderCityPage(manifest, slots, seo, navLinks)
    extraPreviewPages.push(urlPath)
    extraSitemapRoutes.push(urlPath)
  }

  return {
    files: { ...coreResult.files, ...extraFiles },
    previewPages: [...coreResult.previewPages, ...extraPreviewPages],
    sitemapRoutes: [...coreResult.sitemapRoutes, ...extraSitemapRoutes],
  }
}

// ─── Service detail page ──────────────────────────────────────────────────────

function renderServiceDetailPage(
  manifest: RenderManifest,
  slots: Record<string, unknown>,
  seo: RenderManifest["seoByRoute"][string],
  navLinks: Array<{ href: string; label: string }>,
  slug: string,
): string {
  const { meta } = manifest

  const benefits = sa<{ title: string; description: string }>(slots, "benefits")
  const process = sa<{ step: number; title: string; description: string }>(slots, "process")
  const faq = sa<{ question: string; answer: string }>(slots, "faq")
  const relatedServices = sa<string>(slots, "relatedServices")

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: TITAN_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="page-hero">
  <div class="section-inner">
    <div class="breadcrumb"><a href="/">Home</a> / <a href="/services/">Services</a> / ${esc(s(slots, "headline"))}</div>
    <h1>${esc(s(slots, "headline"))}</h1>
    <p>${esc(s(slots, "intro"))}</p>
    <a href="/contact/" class="hero-btn" style="margin-top:1.5rem">${esc(meta.phone ? `Call ${meta.phone}` : "Get a Free Quote")}</a>
  </div>
</section>

${benefits.length > 0 ? `
<section class="section">
  <div class="section-inner">
    <h2 class="section-title">Why Choose Us</h2>
    <div class="benefits-grid">
      ${benefits.map((b) => `
      <div class="benefit-card">
        <div class="service-icon">${iconSvg("check")}</div>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.description)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${process.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <h2 class="section-title">How It Works</h2>
    <div class="process-list">
      ${process.map((step) => `
      <div class="process-step">
        <div class="step-number">${step.step}</div>
        <div>
          <h3>${esc(step.title)}</h3>
          <p>${esc(step.description)}</p>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${faq.length > 0 ? `
<section class="section">
  <div class="section-inner">
    <h2 class="section-title">Frequently Asked Questions</h2>
    <div class="faq-list">
      ${faq.map((item) => `
      <div class="faq-item">
        <h3 class="faq-question">${esc(item.question)}</h3>
        <p class="faq-answer">${esc(item.answer)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${relatedServices.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <h2 class="section-title">Related Services</h2>
    <div class="related-links">
      ${relatedServices.map((relSlug) => `
      <a href="/services/${esc(relSlug)}/" class="related-link">${esc(relSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}</a>`).join("")}
    </div>
  </div>
</section>` : ""}

<section class="cta-section">
  <h2>Ready to Get Started?</h2>
  <p>Contact us today for a free estimate on ${esc(s(slots, "headline"))}.</p>
  <a href="/contact/" class="cta-btn">Contact Us</a>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── City/area page ───────────────────────────────────────────────────────────

function renderCityPage(
  manifest: RenderManifest,
  slots: Record<string, unknown>,
  seo: RenderManifest["seoByRoute"][string],
  navLinks: Array<{ href: string; label: string }>,
): string {
  const { meta } = manifest

  const serviceHighlights = sa<{ title: string; description: string }>(slots, "serviceHighlights")
  const localSignals = sa<string>(slots, "localSignals")
  const city = s(slots, "city")

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: TITAN_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="page-hero">
  <div class="section-inner">
    <div class="breadcrumb"><a href="/">Home</a> / ${esc(city)}</div>
    <h1>${esc(s(slots, "headline"))}</h1>
    <p>${esc(s(slots, "intro"))}</p>
    <a href="/contact/" class="hero-btn" style="margin-top:1.5rem">Get a Free Quote in ${esc(city)}</a>
  </div>
</section>

${serviceHighlights.length > 0 ? `
<section class="section">
  <div class="section-inner">
    <h2 class="section-title">Our Services in ${esc(city)}</h2>
    <div class="services-grid">
      ${serviceHighlights.map((svc) => `
      <div class="service-card">
        <div class="service-icon">${iconSvg("wrench")}</div>
        <h3>${esc(svc.title)}</h3>
        <p>${esc(svc.description)}</p>
        <a href="/services/" class="service-link">View all services →</a>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${localSignals.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <h2 class="section-title">Why ${esc(meta.businessName)} in ${esc(city)}</h2>
    <div class="signals-list">
      ${localSignals.map((signal) => `
      <div class="signal-item">
        <div class="signal-icon">${iconSvg("check", 20)}</div>
        <p>${esc(signal)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

<section class="cta-section">
  <h2>Serving ${esc(city)} and Surrounding Areas</h2>
  <p>Contact ${esc(meta.businessName)} today for fast, reliable service in ${esc(city)}.</p>
  <a href="/contact/" class="cta-btn">Get a Free Quote</a>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── Titan-specific styles ────────────────────────────────────────────────────

const TITAN_STYLES = `
  .page-hero { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #fff; padding: 5rem 1.5rem 4rem; }
  .page-hero .breadcrumb { font-size: 0.8125rem; opacity: 0.7; margin-bottom: 1rem; }
  .page-hero .breadcrumb a { color: rgba(255,255,255,0.8); }
  .page-hero h1 { font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
  .page-hero p { opacity: 0.88; font-size: 1.0625rem; max-width: 560px; }
  .hero-btn { display: inline-block; background: #fff; color: var(--primary); padding: 0.875rem 2rem; border-radius: 50px; font-weight: 700; font-size: 0.9375rem; }

  .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
  .service-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem 1.75rem; }
  .service-icon { width: 52px; height: 52px; border-radius: 12px; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
  .service-card h3 { font-size: 1.0625rem; font-weight: 700; margin-bottom: 0.5rem; }
  .service-card p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
  .service-link { display: inline-block; margin-top: 1rem; font-size: 0.875rem; font-weight: 600; color: var(--primary); }

  .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
  .benefit-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; }
  .benefit-card h3 { font-size: 1rem; font-weight: 700; margin: 1rem 0 0.5rem; }
  .benefit-card p { font-size: 0.9rem; color: var(--text-muted); }

  .process-list { max-width: 640px; margin: 0 auto; }
  .process-step { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 2rem; }
  .step-number { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 800; font-size: 1.125rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .process-step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.35rem; }
  .process-step p { font-size: 0.9rem; color: var(--text-muted); }

  .faq-list { max-width: 720px; margin: 0 auto; }
  .faq-item { border-bottom: 1px solid var(--border); padding: 1.5rem 0; }
  .faq-question { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .faq-answer { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.7; }

  .related-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .related-link { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--primary); transition: background 0.15s; }
  .related-link:hover { background: color-mix(in srgb, var(--primary) 8%, transparent); }

  .signals-list { display: flex; flex-direction: column; gap: 1rem; max-width: 600px; }
  .signal-item { display: flex; gap: 1rem; align-items: flex-start; }
  .signal-icon { color: var(--primary); flex-shrink: 0; margin-top: 2px; }
  .signal-item p { font-size: 1rem; color: var(--text-muted); }

  .cta-section { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #fff; padding: 5rem 1.5rem; text-align: center; }
  .cta-section h2 { font-size: clamp(1.75rem, 3.5vw, 2.75rem); font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em; }
  .cta-section p { opacity: 0.88; margin-bottom: 2rem; font-size: 1.0625rem; max-width: 480px; margin-left: auto; margin-right: auto; }
  .cta-btn { display: inline-block; background: #fff; color: var(--primary); padding: 0.875rem 2.5rem; border-radius: 50px; font-weight: 700; font-size: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.18); transition: transform 0.15s; }
  .cta-btn:hover { transform: translateY(-2px); }
`
