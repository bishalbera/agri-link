import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agri-Link - Crisis Shield for Farmers',
  description: 'Autonomous AI Agent System for Farmer Negotiation & Distress Prevention',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
