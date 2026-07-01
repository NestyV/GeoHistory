import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from './components/common/ErrorBoundary'

export const metadata: Metadata = {
  title: 'GeoHistory',
  description: 'Map historical events',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full bg-white">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}