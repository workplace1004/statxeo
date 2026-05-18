import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const themeBootScript = `(() => {
  try {
    const storageKey = 'statxeo-theme';
    const fallbackTheme = 'glass-light';
    const root = document.documentElement;
    const storedTheme = localStorage.getItem(storageKey);
    const theme = storedTheme === 'glass-light' || storedTheme === 'glass-dark'
      ? storedTheme
      : fallbackTheme;

    root.dataset.theme = theme;
    root.classList.remove('dark', 'glass-dark', 'glass-light');

    if (theme === 'glass-dark') {
      root.classList.add('dark', 'glass-dark');
      return;
    }

    root.classList.add('glass-light');
  } catch {}
})();`

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
  themeColor: '#f8fafc',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="glass-light bg-background text-foreground" data-theme="glass-light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="data-theme" defaultTheme="glass-light" enableSystem={false} storageKey="statxeo-theme" themes={["glass-dark", "glass-light"]}>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
