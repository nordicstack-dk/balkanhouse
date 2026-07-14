import type { Metadata } from 'next'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import '../../styles/globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Balkan House',
  description: 'Produse românești autentice în Danemarca',
}

export default function FrontendRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${sourceSans.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream font-sans text-text antialiased">{children}</body>
    </html>
  )
}
