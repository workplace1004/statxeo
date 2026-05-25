import { NextResponse } from "next/server"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://statxeo.com"

const content = `# Statxeo

Statxeo sells high-converting SEO websites for service businesses with 10DLC-aware messaging and Statxt lead routing.

## Primary pages
- Home: ${siteUrl}/
- About: ${siteUrl}/about
- FAQ: ${siteUrl}/faq
- Privacy Policy: ${siteUrl}/privacy-policy
- Hosted Site Terms: ${siteUrl}/statxeo/terms
- Product Terms: ${siteUrl}/statxeo/product-terms

## Offer summary
- One-time website packages: Lander, Core, Titan
- Optional monthly Boost Packages: Mach 1, Mach 2, Mach 3 XEO
- Lead routing into Statxt
- 10DLC-ready messaging position
- AI-readable / LLM-friendly discovery support

## Audience
- Local service businesses
- Operators who need websites that rank, convert, and route leads quickly
`

export async function GET() {
  return new NextResponse(content, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  })
}
