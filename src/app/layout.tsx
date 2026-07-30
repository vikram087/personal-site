import type { ReactNode } from 'react'
import { display, body, mono } from './fonts'
import { SceneRoot } from '@/components/scene/SceneRoot'
import { buildSceneData } from '@/lib/content/scene-data'
import './globals.css'

export const metadata = {
  title: 'Vikram Penumarti — Starmap',
  description: 'Personal site: education, work, hobbies, and writing, charted as destinations.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const sceneData = buildSceneData()
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <SceneRoot sceneData={sceneData}>{children}</SceneRoot>
      </body>
    </html>
  )
}
