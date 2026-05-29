import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://statxeo.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/faq", "/privacy-policy", "/statxeo/terms", "/statxeo/product-terms", "/affiliate", "/affiliate/help", "/wl"],
        disallow: [
          "/affiliate/login",
          "/affiliate/portal",
          "/affiliate/portal/",
          "/api/",
          "/white-label",
          "/white-label/",
          "/customer",
          "/customer/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
