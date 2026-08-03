import { RichText } from '@payloadcms/richtext-lexical/react'
import clsx from 'clsx'
import type { ComponentProps } from 'react'

type LexicalData = ComponentProps<typeof RichText>['data']

/**
 * Renders a Payload Lexical rich-text value as formatted HTML (headings, lists,
 * links, bold, etc.) using Payload's official React converters. The `bh-richtext`
 * class supplies the storefront typography since the Tailwind typography plugin
 * isn't installed.
 */
export function RichTextContent({
  data,
  className,
}: {
  data?: LexicalData | null
  className?: string
}) {
  if (!data) return null
  return <RichText data={data} className={clsx('bh-richtext', className)} />
}
