import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://statxeo.com"
const lastModified = new Date("2026-03-06T00:00:00.000Z")

const publicRoutes = [
  "/",
  "/about",
  "/affiliate",
  "/faq",
  "/privacy-policy",
  "/statxeo/terms",
  "/statxeo/product-terms",
  "/wl",
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route, index) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : index < 3 ? 0.8 : 0.6,
  }))
}
