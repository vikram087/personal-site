import { MDXRemote } from 'next-mdx-remote/rsc'
import { Gallery } from '@/components/panels/Gallery'

export function Mdx({ source }: { source: string }) {
  // blockJS defaults to true in next-mdx-remote v6 and strips JSX expression
  // props like Gallery's images={[...]}. Our MDX is trusted repo content, so
  // allow JS; blockDangerousJS stays on (blocks eval/process/etc).
  return (
    <MDXRemote
      source={source}
      components={{ Gallery }}
      options={{ blockJS: false }}
    />
  )
}
