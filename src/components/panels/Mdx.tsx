import { MDXRemote } from 'next-mdx-remote/rsc'
import { Gallery } from '@/components/panels/Gallery'

export function Mdx({ source }: { source: string }) {
  return <MDXRemote source={source} components={{ Gallery }} />
}
