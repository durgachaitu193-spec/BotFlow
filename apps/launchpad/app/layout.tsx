import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from './global/provider'
import ogImage from './opengraph-image.png'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: 'Wazabi.ai - Epi-Agentic Infra',
  description: 'Epi-Agentic Infra for the Autonomous Agent Economy',
  metadataBase: new URL('https://wazabi.ai/'),
  openGraph: {
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
      },
    ],
  },
  twitter: {
    images: [
      {
        url: ogImage.src,
        width: ogImage.width,
        height: ogImage.height,
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: {
      url: '/favicon/apple-touch-icon.png',
      sizes: '180x180',
    },
  },
  manifest: '/favicon/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      </head>
      <body
        className={`${inter.variable} ${robotoMono.variable} bg-bg-deep font-sans text-text-primary antialiased`}
      >
        <Providers>
          {children}
          <Toaster position='bottom-right' theme='dark' />
        </Providers>
      </body>
    </html>
  )
}
