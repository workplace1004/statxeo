import type { RenderManifest } from "../agents/build-manifest"
import type { RenderResult } from "./primitives"
import { esc, iconSvg, renderHead, renderNav, renderFooter, renderContactForm, s, sa } from "./primitives"
import type { SeoBundle } from "../schemas/seo-bundle"

/**
 * Core renderer — 4 pages: index, services, about, contact.
 * Each page is a self-contained HTML file.
 * Contact form is only rendered on the /contact/ page.
 */

export function renderCoreDefault(manifest: RenderManifest, siteToken: string): RenderResult {
  const { meta } = manifest

  const navLinks = [
    { href: "/services/", label: "Services" },
    { href: "/about/", label: "About" },
    { href: "/contact/", label: "Contact" },
  ]

  const files: Record<string, string> = {
    "index.html": renderHomePage(manifest, navLinks),
    "services/index.html": renderServicesPage(manifest, navLinks),
    "about/index.html": renderAboutPage(manifest, navLinks),
    "contact/index.html": renderContactPage(manifest, navLinks, siteToken),
    "llms.txt": manifest.seoByRoute["index"]?.llmsTxt ?? "",
  }

  return {
    files,
    previewPages: ["/", "/services/", "/about/", "/contact/"],
    sitemapRoutes: ["/", "/services/", "/about/", "/contact/"],
  }
}

// ─── Home page ────────────────────────────────────────────────────────────────

function renderHomePage(manifest: RenderManifest, navLinks: Array<{ href: string; label: string }>): string {
  const slots = manifest.slotsByRoute["index"] ?? {}
  const seo = manifest.seoByRoute["index"]
  const { meta } = manifest

  const featuredServices = sa<{ title: string; description: string; icon: string }>(slots, "featuredServices")
  const testimonials = sa<{ quote: string; name: string; role: string }>(slots, "testimonials.items")
  const stats = sa<{ value: string; label: string }>(slots, "stats")

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: CORE_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="hero">
  <div class="hero-inner">
    <h1>${esc(s(slots, "hero.headline"))}</h1>
    <p>${esc(s(slots, "hero.subheadline"))}</p>
    <a href="/contact/" class="hero-btn">${esc(s(slots, "hero.ctaText", "Get a Free Quote"))}</a>
  </div>
</section>

<section class="section">
  <div class="section-inner">
    <div class="services-grid">
      ${featuredServices.map((svc) => `
      <div class="service-card">
        <div class="service-icon">${iconSvg(svc.icon)}</div>
        <h3>${esc(svc.title)}</h3>
        <p>${esc(svc.description)}</p>
        <a href="/services/" class="service-link">Learn more →</a>
      </div>`).join("")}
    </div>
  </div>
</section>

${stats.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <div class="stats-grid">
      ${stats.map((stat) => `
      <div class="stat-item">
        <div class="stat-value">${esc(stat.value)}</div>
        <div class="stat-label">${esc(stat.label)}</div>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

<section class="section">
  <div class="section-inner">
    <div class="about-grid">
      <div>
        <span class="about-badge">About Us</span>
        <h2 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:700;letter-spacing:-0.01em;">${esc(s(slots, "aboutPreview.headline"))}</h2>
        <p class="about-body">${esc(s(slots, "aboutPreview.body"))}</p>
        <p class="about-owner">${esc(s(slots, "aboutPreview.ownerName"))}</p>
        <p class="about-role">${esc(s(slots, "aboutPreview.ownerRole"))}</p>
        <a href="/about/" class="btn-primary" style="margin-top:1.5rem">Our Story →</a>
      </div>
      <div class="about-visual">${iconSvg("users", 64)}</div>
    </div>
  </div>
</section>

${testimonials.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <h2 class="section-title">${esc(s(slots, "testimonials.headline", "What Our Clients Say"))}</h2>
    <div class="testimonials-grid">
      ${testimonials.map((t) => `
      <div class="testimonial-card">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="testimonial-quote">${esc(t.quote)}</p>
        <p class="testimonial-name">${esc(t.name)}</p>
        <p class="testimonial-role">${esc(t.role)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

<section class="cta-section">
  <h2>${esc(s(slots, "primaryCta.headline"))}</h2>
  <p>${esc(s(slots, "primaryCta.subheadline"))}</p>
  <a href="/contact/" class="cta-btn">${esc(s(slots, "primaryCta.buttonText", "Contact Us"))}</a>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── Services page ────────────────────────────────────────────────────────────

function renderServicesPage(manifest: RenderManifest, navLinks: Array<{ href: string; label: string }>): string {
  const slots = manifest.slotsByRoute["services"] ?? {}
  const seo = manifest.seoByRoute["services"]
  const { meta } = manifest

  const services = sa<{ title: string; description: string; features: string[]; icon: string }>(slots, "services")
  const faq = sa<{ question: string; answer: string }>(slots, "faq")

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: CORE_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="page-hero">
  <div class="section-inner">
    <h1>${esc(s(slots, "headline", "Our Services"))}</h1>
    <p>${esc(s(slots, "intro"))}</p>
  </div>
</section>

<section class="section">
  <div class="section-inner">
    <div class="services-detail-grid">
      ${services.map((svc) => `
      <div class="service-detail-card">
        <div class="service-icon">${iconSvg(svc.icon)}</div>
        <h3>${esc(svc.title)}</h3>
        <p>${esc(svc.description)}</p>
        ${svc.features?.length ? `<ul class="feature-list">${svc.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      </div>`).join("")}
    </div>
  </div>
</section>

${faq.length > 0 ? `
<section class="section section-alt">
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

<section class="cta-section">
  <h2>${esc(s(slots, "cta.headline"))}</h2>
  <p>${esc(s(slots, "cta.subheadline"))}</p>
  <a href="/contact/" class="cta-btn">${esc(s(slots, "cta.buttonText", "Contact Us"))}</a>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── About page ───────────────────────────────────────────────────────────────

function renderAboutPage(manifest: RenderManifest, navLinks: Array<{ href: string; label: string }>): string {
  const slots = manifest.slotsByRoute["about"] ?? {}
  const seo = manifest.seoByRoute["about"]
  const { meta } = manifest

  const values = sa<{ title: string; description: string }>(slots, "values")

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: CORE_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="page-hero">
  <div class="section-inner">
    <h1>${esc(s(slots, "headline", "About Us"))}</h1>
  </div>
</section>

<section class="section">
  <div class="section-inner">
    <div class="about-grid">
      <div>
        <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;">Our Story</h2>
        <p style="color:var(--text-muted);line-height:1.8;margin-bottom:1.5rem;">${esc(s(slots, "story"))}</p>
        <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:0.5rem;">Our Mission</h3>
        <p style="color:var(--text-muted);line-height:1.8;">${esc(s(slots, "mission"))}</p>
        <div style="margin-top:1.5rem;">
          <p style="font-weight:700;">${esc(s(slots, "ownerName"))}</p>
          <p style="font-size:0.875rem;color:var(--text-muted);">${esc(s(slots, "ownerRole"))}</p>
        </div>
      </div>
      <div class="about-visual">${iconSvg("users", 64)}</div>
    </div>
  </div>
</section>

${values.length > 0 ? `
<section class="section section-alt">
  <div class="section-inner">
    <h2 class="section-title">Our Values</h2>
    <div class="values-grid">
      ${values.map((v) => `
      <div class="value-card">
        <div class="service-icon">${iconSvg("star")}</div>
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.description)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>` : ""}

<section class="cta-section">
  <h2>${esc(s(slots, "cta.headline"))}</h2>
  <p>${esc(s(slots, "cta.subheadline"))}</p>
  <a href="/contact/" class="cta-btn">${esc(s(slots, "cta.buttonText", "Contact Us"))}</a>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── Contact page ─────────────────────────────────────────────────────────────

function renderContactPage(
  manifest: RenderManifest,
  navLinks: Array<{ href: string; label: string }>,
  siteToken: string,
): string {
  const slots = manifest.slotsByRoute["contact"] ?? {}
  const seo = manifest.seoByRoute["contact"]
  const { meta } = manifest

  return `<!DOCTYPE html>
<html lang="en">
${renderHead({ seo, primaryColor: meta.primaryColor, secondaryColor: meta.secondaryColor, extraStyles: CORE_STYLES })}
<body>
${renderNav({ businessName: meta.businessName, phone: meta.phone, links: navLinks })}

<section class="page-hero">
  <div class="section-inner">
    <h1>${esc(s(slots, "headline", "Contact Us"))}</h1>
    <p>${esc(s(slots, "intro"))}</p>
  </div>
</section>

<section class="section">
  <div class="section-inner">
    <div class="contact-grid">
      <div>
        ${meta.phone ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("phone", 18)}</div>
          <div>
            <div class="contact-item-label">Phone</div>
            <a href="tel:${esc(meta.phone.replace(/\D/g, ""))}" class="contact-item-value">${esc(meta.phone)}</a>
          </div>
        </div>` : ""}
        ${meta.email ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("mail", 18)}</div>
          <div>
            <div class="contact-item-label">Email</div>
            <a href="mailto:${esc(meta.email)}" class="contact-item-value">${esc(meta.email)}</a>
          </div>
        </div>` : ""}
        ${meta.address ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("map-pin", 18)}</div>
          <div>
            <div class="contact-item-label">Address</div>
            <div class="contact-item-value">${esc(meta.address)}</div>
          </div>
        </div>` : ""}
        ${s(slots, "hours") ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("clock", 18)}</div>
          <div>
            <div class="contact-item-label">Hours</div>
            <div class="contact-item-value">${esc(s(slots, "hours"))}</div>
          </div>
        </div>` : ""}
      </div>
      ${renderContactForm({
        formHeadline: s(slots, "formHeadline", "Send Us a Message"),
        formButtonText: s(slots, "formButtonText", "Send Message"),
        siteToken,
        projectId: manifest.projectId,
      })}
    </div>
  </div>
</section>

${renderFooter({ businessName: meta.businessName, phone: meta.phone, email: meta.email, address: meta.address })}
</body>
</html>`
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const CORE_STYLES = `
  .hero { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #fff; padding: 6rem 1.5rem 5rem; text-align: center; }
  .hero-inner { max-width: 780px; margin: 0 auto; }
  .hero h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.15; margin-bottom: 1.25rem; letter-spacing: -0.02em; }
  .hero p { font-size: clamp(1rem, 2vw, 1.25rem); opacity: 0.88; margin-bottom: 2rem; max-width: 560px; margin-left: auto; margin-right: auto; }
  .hero-btn { display: inline-block; background: #fff; color: var(--primary); padding: 0.875rem 2.5rem; border-radius: 50px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 24px rgba(0,0,0,0.18); transition: transform 0.15s; }
  .hero-btn:hover { transform: translateY(-2px); }

  .page-hero { background: var(--bg-alt); padding: 4rem 1.5rem; border-bottom: 1px solid var(--border); }
  .page-hero h1 { font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.75rem; }
  .page-hero p { color: var(--text-muted); font-size: 1.0625rem; max-width: 560px; }

  .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
  .service-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem 1.75rem; transition: box-shadow 0.2s, transform 0.2s; }
  .service-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-3px); }
  .service-icon { width: 52px; height: 52px; border-radius: 12px; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
  .service-card h3 { font-size: 1.0625rem; font-weight: 700; margin-bottom: 0.5rem; }
  .service-card p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
  .service-link { display: inline-block; margin-top: 1rem; font-size: 0.875rem; font-weight: 600; color: var(--primary); }

  .services-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
  .service-detail-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
  .service-detail-card h3 { font-size: 1.125rem; font-weight: 700; margin: 1rem 0 0.5rem; }
  .service-detail-card p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
  .feature-list { margin-top: 1rem; padding-left: 1.25rem; }
  .feature-list li { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.35rem; }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 2rem; text-align: center; }
  .stat-value { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
  .stat-label { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 500; }

  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 700px) { .about-grid { grid-template-columns: 1fr; gap: 2rem; } }
  .about-badge { display: inline-block; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.35rem 0.85rem; border-radius: 50px; margin-bottom: 1rem; }
  .about-body { font-size: 1rem; color: var(--text-muted); line-height: 1.8; margin: 1rem 0 1.5rem; }
  .about-owner { font-weight: 700; font-size: 1rem; }
  .about-role { font-size: 0.875rem; color: var(--text-muted); }
  .about-visual { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); border-radius: 20px; min-height: 320px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); }

  .values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
  .value-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; }
  .value-card h3 { font-size: 1rem; font-weight: 700; margin: 1rem 0 0.5rem; }
  .value-card p { font-size: 0.9rem; color: var(--text-muted); }

  .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
  .testimonial-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
  .testimonial-quote { font-size: 0.9375rem; line-height: 1.75; color: var(--text-muted); margin-bottom: 1.5rem; position: relative; }
  .testimonial-quote::before { content: '"'; font-size: 3rem; color: var(--primary); opacity: 0.2; position: absolute; top: -0.5rem; left: -0.25rem; line-height: 1; }
  .testimonial-name { font-weight: 700; font-size: 0.9375rem; }
  .testimonial-role { font-size: 0.8125rem; color: var(--text-muted); }
  .stars { color: #f59e0b; font-size: 0.875rem; letter-spacing: 2px; margin-bottom: 0.75rem; }

  .faq-list { max-width: 720px; margin: 0 auto; }
  .faq-item { border-bottom: 1px solid var(--border); padding: 1.5rem 0; }
  .faq-question { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
  .faq-answer { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.7; }

  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
  @media (max-width: 700px) { .contact-grid { grid-template-columns: 1fr; gap: 2rem; } }
  .contact-item { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
  .contact-item-icon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .contact-item-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .contact-item-value { font-size: 0.9375rem; font-weight: 600; margin-top: 0.15rem; }
  .contact-form-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
  .form-headline { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.4rem; }
  .form-input { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 0.6875rem 1rem; font-size: 0.9375rem; font-family: inherit; transition: border-color 0.15s; }
  .form-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); }
  textarea.form-input { resize: vertical; min-height: 110px; }
  .form-submit { width: 100%; background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 0.875rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
  .form-submit:hover { opacity: 0.88; }

  .cta-section { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #fff; padding: 5rem 1.5rem; text-align: center; }
  .cta-section h2 { font-size: clamp(1.75rem, 3.5vw, 2.75rem); font-weight: 800; margin-bottom: 1rem; letter-spacing: -0.02em; }
  .cta-section p { opacity: 0.88; margin-bottom: 2rem; font-size: 1.0625rem; max-width: 480px; margin-left: auto; margin-right: auto; }
  .cta-btn { display: inline-block; background: #fff; color: var(--primary); padding: 0.875rem 2.5rem; border-radius: 50px; font-weight: 700; font-size: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.18); transition: transform 0.15s; }
  .cta-btn:hover { transform: translateY(-2px); }
`
