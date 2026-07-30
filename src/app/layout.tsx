import type { ReactNode } from 'react'
import './globals.css'

export const metadata = { title: 'Vikram Penumarti', description: 'Personal starmap' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
