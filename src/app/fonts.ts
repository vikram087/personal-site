import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'

export const display = Chakra_Petch({
  weight: ['500', '600'],
  subsets: ['latin'],
  variable: '--font-display',
})

export const body = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
})

export const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})
