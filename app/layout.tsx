import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

function getMetadataBase() {
  const fallback = 'https://statxeo.com'
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  try {
    return new URL(configured && configured.length > 0 ? configured : fallback)
  } catch {
    return new URL(fallback)
  }
}

const siteUrl = getMetadataBase()
const siteTitle = 'Statxeo — High-Converting SEO Sites with Lead Routing'
const siteDescription = 'Statxeo launches optimized, high-converting SEO sites with 10DLC-ready messaging and instant Statxt lead routing in one build.'

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: 'Statxeo',
  title: siteTitle,
  description: siteDescription,
  generator: 'Statxeo',
  category: 'business',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website',
    url: '/',
    siteName: 'Statxeo',
    images: [
      {
        url: '/blackNBG.svg',
        alt: 'Statxeo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/blackNBG.svg'],
  },
  icons: {
    shortcut: '/blackNBG.svg',
    icon: [
      {
        url: '/blackNBG.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/whiteNBG.png',
        type: 'image/png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: [
      {
        url: '/whiteNBG.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
