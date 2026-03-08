import type { Metadata } from 'next'
import { ReactNode } from 'react'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'FlatLedger - Maintenance Billing for Apartment Societies',
  description: 'FlatLedger is a complete society management platform for maintenance billing, payments, expenses, and analytics. Simplify apartment administration.',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
