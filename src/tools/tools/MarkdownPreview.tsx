import { useDeferredValue, useMemo, useState } from 'react'
import { Article } from '../../components/blog/Article'
import { renderArticle } from '../../lib/markdown/rich'
import { textStats } from '../logic'
import { CopyButton, Segmented, TextArea } from '../ui'

const SAMPLE = `# Project title

A short description of **what this does** and _why it exists_.

## Features

- [x] Fast and lightweight
- [x] Works offline
- [ ] Dark mode (coming soon)

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

\`\`\`ts
export function add(a: number, b: number): number {
  return a + b
}
\`\`\`

## Comparison

| Tool   | Language   | Stars |
| ------ | ---------- | ----: |
| React  | JavaScript | ★★★★★ |
| Django | Python     | ★★★★☆ |

> **Tip:** Use \`inline code\` for commands and file names.

Read more on [the blog](/blog).
`

const VIEWS = [
  { value: 'split', label: 'Split' },
  { value: 'edit', label: 'Editor' },
  { value: 'preview', label: 'Preview' },
] as const

export default function MarkdownPreview() {
  const [md, setMd] = useState(SAMPLE)
  const [view, setView] = useState<(typeof VIEWS)[number]['value']>('split')
  // Keep typing responsive on long documents: render the preview at lower priority.
  const deferred = useDeferredValue(md)
  const html = useMemo(
    () => renderArticle(deferred, '/tools/markdown-preview', { keepH1: true }).html,
    [deferred],
  )
  const stats = textStats(md)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Layout" value={view} onChange={setView} options={VIEWS} />
        <div className="flex items-center gap-3">
          <span className="text-muted text-sm">
            {stats.words.toLocaleString()} words · {stats.characters.toLocaleString()} chars
          </span>
          <CopyButton value={html} label="Copy HTML" />
        </div>
      </div>
      <div className={`grid gap-5 ${view === 'split' ? 'lg:grid-cols-2' : ''}`}>
        {view !== 'preview' && <TextArea label="Markdown" value={md} onChange={setMd} rows={26} />}
        {view !== 'edit' && (
          <section aria-label="Preview" className="flex min-w-0 flex-col gap-2">
            <p className="text-muted flex min-h-7 items-center text-xs font-semibold tracking-wide uppercase">
              Preview
            </p>
            <div className="card max-h-[42rem] min-h-80 overflow-auto p-5 sm:p-6">
              <Article html={html} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
