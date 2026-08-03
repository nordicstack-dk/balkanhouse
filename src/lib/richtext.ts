/** Flatten a Lexical editor value to plain text (used only to detect empties). */
export function lexicalPlainText(data: unknown): string {
  const walk = (nodes: unknown): string => {
    if (!Array.isArray(nodes)) return ''
    return nodes
      .map((node) => {
        if (!node || typeof node !== 'object') return ''
        const n = node as { text?: unknown; children?: unknown }
        const text = typeof n.text === 'string' ? n.text : ''
        return text + walk(n.children)
      })
      .join('')
  }

  const root = (data as { root?: { children?: unknown } } | null | undefined)?.root
  return walk(root?.children).trim()
}

/** True when a rich-text field has no meaningful content yet. */
export function isLexicalEmpty(data: unknown): boolean {
  return lexicalPlainText(data) === ''
}
