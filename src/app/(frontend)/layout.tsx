import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import React from 'react'

import '../../styles/globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Balkan House',
  description: 'Produse românești autentice în Danemarca',
}

export default function FrontendRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={sourceSans.variable}>
      <body className="min-h-screen bg-cream font-sans text-text antialiased">{children}</body>
    </html>
  )
}
