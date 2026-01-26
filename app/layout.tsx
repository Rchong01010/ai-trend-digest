import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Trend Digest - Daily AI News for Creators',
  description: 'A 2-minute daily digest of AI news, written for creators not engineers. Get caught up on what matters.',
  openGraph: {
    title: 'AI Trend Digest',
    description: 'AI moves fast. We catch you up.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
