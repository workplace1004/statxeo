import type { SeoBundle } from "../schemas/seo-bundle"

/**
 * Shared HTML rendering primitives used by all template renderers.
 * All functions are pure — no side effects, no external dependencies.
 */

// ─── HTML escaping ────────────────────────────────────────────────────────────

export function esc(str: unknown): string {
  if (str == null) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// ─── Slot accessors ───────────────────────────────────────────────────────────

export function s(slots: Record<string, unknown>, key: string, fallback = ""): string {
  const v = slots[key]
  return typeof v === "string" ? v : fallback
}

export function sa<T>(slots: Record<string, unknown>, key: string): T[] {
  const v = slots[key]
  return Array.isArray(v) ? (v as T[]) : []
}

// ─── Icon SVGs (inline Lucide icons) ─────────────────────────────────────────

export function iconSvg(name: string, size = 28): string {
  const icons: Record<string, string> = {
    wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    zap: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
    star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    check: `<polyline points="20 6 9 17 4 12"/>`,
    home: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    tool: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
    phone: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.9-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>`,
    users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    leaf: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`,
    truck: `<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
    hammer: `<path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>`,
    settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
    "map-pin": `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
    mail: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`,
  }
  const path = icons[name] ?? icons["star"]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
}

// ─── Schema.org JSON-LD ───────────────────────────────────────────────────────

export function buildJsonLd(seo: SeoBundle): string {
  const schema = seo.schemaOrg
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schema.type || "LocalBusiness",
    name: schema.name,
    description: schema.description,
  }
  if (schema.telephone) ld.telephone = schema.telephone
  if (schema.email) ld.email = schema.email
  if (schema.url) ld.url = schema.url
  if (schema.priceRange) ld.priceRange = schema.priceRange
  if (schema.openingHours) ld.openingHoursSpecification = schema.openingHours
  if (schema.sameAs) ld.sameAs = schema.sameAs
  if (schema.address) {
    ld.address = {
      "@type": "PostalAddress",
      streetAddress: schema.address.streetAddress,
      addressLocality: schema.address.addressLocality,
      addressRegion: schema.address.addressRegion,
      postalCode: schema.address.postalCode,
      addressCountry: schema.address.addressCountry,
    }
  }
  return JSON.stringify(ld, null, 2)
}

// ─── Shared HTML blocks ───────────────────────────────────────────────────────

export type NavConfig = {
  businessName: string
  phone: string | null | undefined
  links: Array<{ href: string; label: string }>
}

export function renderNav(config: NavConfig): string {
  const phoneHtml = config.phone
    ? `<a href="tel:${esc(config.phone.replace(/\D/g, ""))}" class="nav-cta">${esc(config.phone)}</a>`
    : `<a href="/contact/" class="nav-cta">Contact Us</a>`

  const linksHtml = config.links
    .map((l) => `<a href="${esc(l.href)}" class="nav-link">${esc(l.label)}</a>`)
    .join("")

  return `<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand">${esc(config.businessName)}</a>
    <div class="nav-links">${linksHtml}</div>
    ${phoneHtml}
  </div>
</nav>`
}

export type HeadConfig = {
  seo: SeoBundle
  primaryColor: string
  secondaryColor: string
  extraStyles?: string
}

export function renderHead(config: HeadConfig): string {
  const { seo, primaryColor, secondaryColor, extraStyles = "" } = config
  return `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seo.title)}</title>
  <meta name="description" content="${esc(seo.description)}" />
  <meta property="og:title" content="${esc(seo.ogTitle)}" />
  <meta property="og:description" content="${esc(seo.ogDescription)}" />
  <meta property="og:type" content="website" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <script type="application/ld+json">
${buildJsonLd(seo)}
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --text: #1a1a1a;
      --text-muted: #6b7280;
      --bg: #ffffff;
      --bg-alt: #f9fafb;
      --border: #e5e7eb;
      --radius: 12px;
    }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; display: block; }

    .nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,0.96); backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border); padding: 0 1.5rem;
    }
    .nav-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between; height: 64px;
    }
    .nav-brand { font-size: 1.125rem; font-weight: 700; color: var(--primary); }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-link { font-size: 0.9rem; font-weight: 500; color: var(--text-muted); transition: color 0.15s; }
    .nav-link:hover { color: var(--primary); }
    .nav-cta {
      background: var(--primary); color: #fff;
      padding: 0.5rem 1.25rem; border-radius: 8px;
      font-size: 0.875rem; font-weight: 600; transition: opacity 0.15s;
    }
    .nav-cta:hover { opacity: 0.88; }

    .section { padding: 5rem 1.5rem; }
    .section-alt { background: var(--bg-alt); }
    .section-inner { max-width: 1100px; margin: 0 auto; }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 700; margin-bottom: 1rem; text-align: center; letter-spacing: -0.01em;
    }
    .section-sub {
      text-align: center; color: var(--text-muted);
      max-width: 560px; margin: 0 auto 3rem;
    }

    .btn-primary {
      display: inline-block; background: var(--primary); color: #fff;
      padding: 0.875rem 2rem; border-radius: 8px; font-weight: 700;
      font-size: 0.9375rem; transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.88; }

    footer {
      background: #111; color: #9ca3af;
      padding: 2.5rem 1.5rem; text-align: center; font-size: 0.875rem;
    }
    footer strong { color: #fff; }
    .footer-links { margin-top: 0.75rem; display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
    .footer-links a:hover { color: #fff; }

    @media (max-width: 640px) {
      .section { padding: 3.5rem 1.25rem; }
      .nav-links { display: none; }
    }
    ${extraStyles}
  </style>
</head>`
}

export type FooterConfig = {
  businessName: string
  phone: string | null | undefined
  email: string | null | undefined
  address: string | null | undefined
}

export function renderFooter(config: FooterConfig): string {
  const { businessName, phone, email, address } = config
  return `<footer>
  <strong>${esc(businessName)}</strong>
  <div class="footer-links">
    ${phone ? `<a href="tel:${esc(phone.replace(/\D/g, ""))}">${esc(phone)}</a>` : ""}
    ${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : ""}
    ${address ? `<span>${esc(address)}</span>` : ""}
  </div>
  <p style="margin-top:1.25rem;font-size:0.75rem;opacity:0.5">
    &copy; ${new Date().getFullYear()} ${esc(businessName)}. All rights reserved.
  </p>
</footer>`
}

/**
 * Renders the contact form for the /contact/ page.
 * The form posts to /api/public/site-lead with the siteToken embedded.
 */
export function renderContactForm(config: {
  formHeadline: string
  formButtonText: string
  siteToken: string
  projectId: string
}): string {
  const { formHeadline, formButtonText, siteToken, projectId } = config
  return `<div class="contact-form-card">
  <h3 class="form-headline">${esc(formHeadline)}</h3>
  <form id="contact-form" data-site-token="${esc(siteToken)}" data-project-id="${esc(projectId)}">
    <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
    <div class="form-group">
      <label class="form-label" for="cf-name">Your Name</label>
      <input id="cf-name" name="name" type="text" class="form-input" placeholder="John Smith" required />
    </div>
    <div class="form-group">
      <label class="form-label" for="cf-email">Email Address</label>
      <input id="cf-email" name="email" type="email" class="form-input" placeholder="john@example.com" required />
    </div>
    <div class="form-group">
      <label class="form-label" for="cf-phone">Phone Number</label>
      <input id="cf-phone" name="phone" type="tel" class="form-input" placeholder="(555) 000-0000" />
    </div>
    <div class="form-group">
      <label class="form-label" for="cf-message">Message</label>
      <textarea id="cf-message" name="message" class="form-input" placeholder="How can we help you?"></textarea>
    </div>
    <button type="submit" class="form-submit">${esc(formButtonText)}</button>
    <p id="form-status" style="margin-top:0.75rem;font-size:0.875rem;display:none"></p>
  </form>
  <script>
    (function() {
      var form = document.getElementById('contact-form');
      var status = document.getElementById('form-status');
      if (!form) return;
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = {
          siteToken: form.dataset.siteToken,
          route: window.location.pathname,
          name: form.querySelector('[name=name]').value,
          email: form.querySelector('[name=email]').value,
          phone: form.querySelector('[name=phone]').value,
          message: form.querySelector('[name=message]').value,
          honeypot: form.querySelector('[name=website]').value
        };
        fetch('/api/public/site-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function(r) { return r.json(); }).then(function(res) {
          status.style.display = 'block';
          if (res.ok) {
            status.style.color = '#16a34a';
            status.textContent = "Thank you! We'll be in touch soon.";
            form.reset();
          } else {
            status.style.color = '#dc2626';
            status.textContent = res.error || 'Something went wrong. Please try again.';
          }
        }).catch(function() {
          status.style.display = 'block';
          status.style.color = '#dc2626';
          status.textContent = 'Network error. Please try again.';
        });
      });
    })();
  </script>
</div>`
}

// ─── Render result type ───────────────────────────────────────────────────────

export type RenderResult = {
  /** Map of file path → HTML content. e.g. { "index.html": "...", "services/index.html": "..." } */
  files: Record<string, string>
  /** Array of route paths for preview navigation. e.g. ["/", "/services/", "/about/"] */
  previewPages: string[]
  /** Array of URL paths for sitemap.xml */
  sitemapRoutes: string[]
}
