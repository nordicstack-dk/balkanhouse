type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

type LexicalRoot = {
  root?: {
    children?: LexicalNode[]
  }
}

function extractText(nodes: LexicalNode[] | undefined): string {
  if (!nodes) return ''
  return nodes
    .map((node) => {
      if (node.type === 'text' && node.text) return node.text
      if (node.children) return extractText(node.children)
      return ''
    })
    .join('')
}

export function RichText({ content }: { content: LexicalRoot | null | undefined }) {
  const text = extractText(content?.root?.children)
  if (!text) return null

  return (
    <div className="prose prose-sm max-w-none text-text-muted">
      {text.split('\n').map((line, i) => (
        <p key={i} className="mb-2 last:mb-0">
          {line}
        </p>
      ))}
    </div>
  )
}
