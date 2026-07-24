// This is the wrapper that wraps EVERY page in your app
// Like a picture frame — every page goes inside it

import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  weight:   ['400', '600', '700'],
})

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title:       'TravelPro — Agency Management',
  description: 'Complete travel agency management software',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}