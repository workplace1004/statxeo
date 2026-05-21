import type { RenderManifest } from "../agents/build-manifest"
import type { RenderResult } from "./primitives"
import { esc, iconSvg, renderHead, renderNav, renderFooter, s, sa, buildJsonLd } from "./primitives"
import type { SeoBundle } from "../schemas/seo-bundle"

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = { key: string; title: string; description: string; icon: string }
type TestimonialItem = { key: string; quote: string; name: string; role: string }

// ─── Main renderer ────────────────────────────────────────────────────────────

export function renderLanderDefault(manifest: RenderManifest): RenderResult {
  const slots = manifest.slotsByRoute["index"] ?? {}
  const seo = manifest.seoByRoute["index"]
  const { meta } = manifest

  const html = renderLanderPage(slots, seo, meta)

  return {
    files: { "index.html": html },
    previewPages: ["/"],
    sitemapRoutes: ["/"],
  }
}

function renderLanderPage(
  slots: Record<string, unknown>,
  seo: SeoBundle,
  meta: RenderManifest["meta"],
): string {
  const primary = meta.primaryColor || "#1a1a2e"
  const secondary = meta.secondaryColor || "#16213e"

  const services = sa<ServiceItem>(slots, "services.items")
  const testimonials = sa<TestimonialItem>(slots, "testimonials.items")

  const contactPhone = s(slots, "contact.phone", meta.phone ?? "")
  const contactEmail = s(slots, "contact.email", meta.email ?? "")
  const contactAddress = s(slots, "contact.address", meta.address ?? "")
  const contactHours = s(slots, "contact.hours")

  const heroCtaUrl = s(slots, "hero.ctaUrl", "/contact/")
  const ctaButtonUrl = s(slots, "cta.buttonUrl", "/contact/")

  const headHtml = renderHead({ seo, primaryColor: primary, secondaryColor: secondary, extraStyles: LANDER_STYLES })
  const navHtml = renderNav({
    businessName: meta.businessName,
    phone: meta.phone,
    links: [],
  })
  const footerHtml = renderFooter({
    businessName: meta.businessName,
    phone: meta.phone,
    email: meta.email,
    address: meta.address,
  })

  return `<!DOCTYPE html>
<html lang="en">
${headHtml}
<body>

${navHtml}

<!-- Hero -->
<section class="hero" id="home">
  <div class="hero-inner">
    <h1>${esc(s(slots, "hero.headline"))}</h1>
    <p>${esc(s(slots, "hero.subheadline"))}</p>
    <a href="${esc(heroCtaUrl)}" class="hero-btn">${esc(s(slots, "hero.ctaText", "Get Started"))}</a>
  </div>
</section>

<!-- Services -->
<section class="section" id="services">
  <div class="section-inner">
    <h2 class="section-title">${esc(s(slots, "services.headline", "Our Services"))}</h2>
    <div class="services-grid">
      ${services.map((item) => `
      <div class="service-card">
        <div class="service-icon">${iconSvg(item.icon)}</div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.description)}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- About -->
<section class="section section-alt" id="about">
  <div class="section-inner">
    <div class="about-grid">
      <div>
        <span class="about-badge">About Us</span>
        <h2 style="font-size:clamp(1.5rem,3vw,2.25rem);font-weight:700;letter-spacing:-0.01em;">${esc(s(slots, "about.headline"))}</h2>
        <p class="about-body">${esc(s(slots, "about.body"))}</p>
        <p class="about-owner">${esc(s(slots, "about.ownerName"))}</p>
        <p class="about-role">${esc(s(slots, "about.ownerRole"))}</p>
      </div>
      <div class="about-visual">${iconSvg("users", 64)}</div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="section" id="testimonials">
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
</section>

<!-- Contact -->
<section class="section section-alt" id="contact">
  <div class="section-inner">
    <h2 class="section-title">${esc(s(slots, "contact.headline", "Get In Touch"))}</h2>
    <p class="section-sub">${esc(s(slots, "contact.subheadline"))}</p>
    <div class="contact-grid">
      <div>
        ${contactPhone ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("phone", 18)}</div>
          <div>
            <div class="contact-item-label">Phone</div>
            <a href="tel:${esc(contactPhone.replace(/\D/g, ""))}" class="contact-item-value">${esc(contactPhone)}</a>
          </div>
        </div>` : ""}
        ${contactEmail ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("mail", 18)}</div>
          <div>
            <div class="contact-item-label">Email</div>
            <a href="mailto:${esc(contactEmail)}" class="contact-item-value">${esc(contactEmail)}</a>
          </div>
        </div>` : ""}
        ${contactAddress ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("map-pin", 18)}</div>
          <div>
            <div class="contact-item-label">Address</div>
            <div class="contact-item-value">${esc(contactAddress)}</div>
          </div>
        </div>` : ""}
        ${contactHours ? `<div class="contact-item">
          <div class="contact-item-icon">${iconSvg("clock", 18)}</div>
          <div>
            <div class="contact-item-label">Hours</div>
            <div class="contact-item-value">${esc(contactHours)}</div>
          </div>
        </div>` : ""}
      </div>
      <div class="contact-form-card">
        <form>
          <div class="form-group">
            <label class="form-label" for="cf-name">Your Name</label>
            <input id="cf-name" type="text" class="form-input" placeholder="John Smith" />
          </div>
          <div class="form-group">
            <label class="form-label" for="cf-email">Email Address</label>
            <input id="cf-email" type="email" class="form-input" placeholder="john@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label" for="cf-phone">Phone Number</label>
            <input id="cf-phone" type="tel" class="form-input" placeholder="(555) 000-0000" />
          </div>
          <div class="form-group">
            <label class="form-label" for="cf-message">Message</label>
            <textarea id="cf-message" class="form-input" placeholder="How can we help you?"></textarea>
          </div>
          <button type="submit" class="form-submit">Send Message</button>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section class="cta-section">
  <h2>${esc(s(slots, "cta.headline"))}</h2>
  <p>${esc(s(slots, "cta.subheadline"))}</p>
  <a href="${esc(ctaButtonUrl)}" class="cta-btn">${esc(s(slots, "cta.buttonText", "Get Started"))}</a>
</section>

${footerHtml}

</body>
</html>`
}

const LANDER_STYLES = `
  .hero {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: #fff; padding: 6rem 1.5rem 5rem; text-align: center;
  }
  .hero-inner { max-width: 780px; margin: 0 auto; }
  .hero h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.15; margin-bottom: 1.25rem; letter-spacing: -0.02em; }
  .hero p { font-size: clamp(1rem, 2vw, 1.25rem); opacity: 0.88; margin-bottom: 2rem; max-width: 560px; margin-left: auto; margin-right: auto; }
  .hero-btn { display: inline-block; background: #fff; color: var(--primary); padding: 0.875rem 2.5rem; border-radius: 50px; font-size: 1rem; font-weight: 700; box-shadow: 0 4px 24px rgba(0,0,0,0.18); transition: transform 0.15s, box-shadow 0.15s; }
  .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.22); }

  .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
  .service-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem 1.75rem; transition: box-shadow 0.2s, transform 0.2s; }
  .service-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.09); transform: translateY(-3px); }
  .service-icon { width: 52px; height: 52px; border-radius: 12px; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; }
  .service-card h3 { font-size: 1.0625rem; font-weight: 700; margin-bottom: 0.5rem; }
  .service-card p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }

  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  @media (max-width: 700px) { .about-grid { grid-template-columns: 1fr; gap: 2rem; } }
  .about-badge { display: inline-block; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.35rem 0.85rem; border-radius: 50px; margin-bottom: 1rem; }
  .about-body { font-size: 1rem; color: var(--text-muted); line-height: 1.8; margin: 1rem 0 1.5rem; }
  .about-owner { font-weight: 700; font-size: 1rem; }
  .about-role { font-size: 0.875rem; color: var(--text-muted); }
  .about-visual { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); border-radius: 20px; min-height: 320px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); }

  .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
  .testimonial-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
  .testimonial-quote { font-size: 0.9375rem; line-height: 1.75; color: var(--text-muted); margin-bottom: 1.5rem; position: relative; }
  .testimonial-quote::before { content: '"'; font-size: 3rem; color: var(--primary); opacity: 0.2; position: absolute; top: -0.5rem; left: -0.25rem; line-height: 1; }
  .testimonial-name { font-weight: 700; font-size: 0.9375rem; }
  .testimonial-role { font-size: 0.8125rem; color: var(--text-muted); }
  .stars { color: #f59e0b; font-size: 0.875rem; letter-spacing: 2px; margin-bottom: 0.75rem; }

  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
  @media (max-width: 700px) { .contact-grid { grid-template-columns: 1fr; gap: 2rem; } }
  .contact-item { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
  .contact-item-icon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .contact-item-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .contact-item-value { font-size: 0.9375rem; font-weight: 600; margin-top: 0.15rem; }
  .contact-form-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; }
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

  @media (max-width: 640px) { .hero { padding: 4rem 1.25rem 3.5rem; } }
`
