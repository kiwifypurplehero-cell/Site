import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Porsche Catalog — Engineered for Icons',
    template: '%s | Porsche Catalog',
  },
  description: 'Explore the complete Porsche model lineup. Configure your dream sports car, SUV, or electric vehicle. Schedule a test drive at your local dealer.',
  keywords: ['Porsche', '911', 'Taycan', 'Cayenne', 'Macan', 'Panamera', '718', 'sports cars', 'luxury vehicles'],
  authors: [{ name: 'Porsche Catalog' }],
  creator: 'Porsche Catalog',
  publisher: 'Porsche Catalog',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://porsche-catalog.example.com',
    siteName: 'Porsche Catalog',
    title: 'Porsche Catalog — Engineered for Icons',
    description: 'Explore the complete Porsche model lineup.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Porsche Catalog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Porsche Catalog',
    description: 'Explore the complete Porsche model lineup.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F0' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

import { Layout } from '@/components/layout/Layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}