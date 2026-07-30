import type { ReactNode } from 'react'
import { display, body, mono } from './fonts'
import './globals.css'

export const metadata = { title: 'Vikram Penumarti', description: 'Personal starmap' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</body>
    </html>
  )
}
