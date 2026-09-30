import { useState } from 'react'
import { CASES, convertCase, textStats } from '../logic'
import { CopyButton, Note, TextArea } from '../ui'

export default function CaseConverter() {
  const [input, setInput] = useState('user account id\nparseHTTPResponse\nMAX_RETRY_COUNT')
  const stats = textStats(input)

  return (
    <div className="space-y-5">
      <TextArea
        label="Text or identifiers (one per line)"
        value={input}
        onChange={setInput}
        rows={5}
        placeholder="e.g. user account id"
      />
      <Note>
        {stats.words} words · {stats.characters} characters · {stats.lines} lines
      </Note>
      <ul className="grid gap-3 sm:grid-cols-2">
        {CASES.map((c) => {
          const out = convertCase(input, c.fn)
          return (
            <li key={c.key} className="card flex min-w-0 flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted text-xs font-semibold tracking-wide uppercase">
                  {c.label}
                </span>
                <CopyButton value={out} />
              </div>
              <pre className="font-mono text-sm break-all whitespace-pre-wrap">{out || ' '}</pre>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
