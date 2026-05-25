import { ReactNode } from 'react'

export const metadata = {
  title: 'FlatLedger - Maintenance Billing for Apartment Societies',
  description: 'FlatLedger is a complete society management platform for maintenance billing, payments, expenses, and analytics. Simplify apartment administration.',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192x192.png',
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
