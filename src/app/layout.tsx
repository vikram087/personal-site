import type { ReactNode } from 'react'
import { display, body, mono } from './fonts'
import { SceneRoot } from '@/components/scene/SceneRoot'
import { buildSceneData } from '@/lib/content/scene-data'
import { HudChrome } from '@/components/hud/HudChrome'
import { loadPage } from '@/lib/content/loader'
import { Mdx } from '@/components/panels/Mdx'
import { SITE_METADATA } from '@/config/site-metadata'
import './globals.css'

export const metadata = SITE_METADATA

export default function RootLayout({ children }: { children: ReactNode }) {
  const sceneData = buildSceneData()
  const hud = (
    <HudChrome
      about={<Mdx source={loadPage('about').body} />}
      now={<Mdx source={loadPage('now').body} />}
      uses={<Mdx source={loadPage('uses').body} />}
      contact={<Mdx source={loadPage('contact').body} />}
    />
  )
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <SceneRoot sceneData={sceneData} hud={hud}>{children}</SceneRoot>
      </body>
    </html>
  )
}
