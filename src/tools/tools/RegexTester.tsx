import { Fragment, useDeferredValue, useMemo, useState } from 'react'
import { runRegex } from '../logic'
import { Checkbox, Input, Note, TextArea, Toolbar } from '../ui'

const FLAGS = [
  { flag: 'g', label: 'global (g)' },
  { flag: 'i', label: 'ignore case (i)' },
  { flag: 'm', label: 'multiline (m)' },
  { flag: 's', label: 'dotAll (s)' },
  { flag: 'u', label: 'unicode (u)' },
] as const

const SAMPLE_TEXT = `Contact us at support@codewithprasad.in or sales@example.com.
Invoices: INV-2026-0042 (₹12,499), INV-2026-0107 (₹3,200).
Call +91 98765 43210 before 30/09/2026.`

const CHEATS: [string, string][] = [
  ['.', 'any character except newline'],
  ['\\d \\w \\s', 'digit · word char · whitespace'],
  ['\\D \\W \\S', 'not digit · not word · not space'],
  ['[abc] [^abc]', 'any of · none of'],
  ['[a-z0-9]', 'character range'],
  ['^ $', 'start · end of line/string'],
  ['\\b', 'word boundary'],
  ['* + ?', '0+ · 1+ · 0 or 1'],
  ['{3} {2,5}', 'exactly 3 · 2 to 5'],
  ['*? +?', 'lazy (as few as possible)'],
  ['(abc)', 'capture group'],
  ['(?<name>…)', 'named group'],
  ['(?:abc)', 'non-capturing group'],
  ['a|b', 'a or b'],
  ['(?=…) (?!…)', 'lookahead · negative'],
  ['(?<=…) (?<!…)', 'lookbehind · negative'],
]

const PRESETS: { label: string; pattern: string; flags: string }[] = [
  { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', flags: 'gi' },
  { label: 'Invoice no.', pattern: 'INV-(?<year>\\d{4})-(?<num>\\d{4})', flags: 'g' },
  { label: 'Indian mobile', pattern: '(?:\\+91[ -]?)?[6-9]\\d{4}[ -]?\\d{5}', flags: 'g' },
  { label: 'Date dd/mm/yyyy', pattern: '\\b(\\d{2})/(\\d{2})/(\\d{4})\\b', flags: 'g' },
  { label: 'Amount ₹', pattern: '₹([\\d,]+)', flags: 'gu' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s)]+', flags: 'g' },
]

export default function RegexTester() {
  const [pattern, setPattern] = useState('[\\w.+-]+@[\\w-]+\\.[\\w.]+')
  const [flags, setFlags] = useState('gi')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [replacement, setReplacement] = useState('')
  const deferredText = useDeferredValue(text)

  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: '' }
    try {
      return { matches: runRegex(pattern, flags, deferredText), error: '' }
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : String(e) }
    }
  }, [pattern, flags, deferredText])

  const replaced = useMemo(() => {
    if (!replacement || result.error || !pattern) return ''
    try {
      return deferredText.replace(new RegExp(pattern, flags), replacement)
    } catch {
      return ''
    }
  }, [replacement, result.error, pattern, flags, deferredText])

  // Split the text into plain and highlighted segments.
  const segments = useMemo(() => {
    const out: { text: string; match?: number }[] = []
    let last = 0
    result.matches.forEach((m, i) => {
      if (!m.text) return
      if (m.index > last) out.push({ text: deferredText.slice(last, m.index) })
      out.push({ text: m.text, match: i })
      last = m.index + m.text.length
    })
    out.push({ text: deferredText.slice(last) })
    return out
  }, [result.matches, deferredText])

  const toggleFlag = (f: string) =>
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, '') : cur + f))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0 space-y-5">
        <div className="flex items-end gap-2">
          <span className="text-muted pb-2.5 font-mono text-lg">/</span>
          <div className="min-w-0 flex-1">
            <Input
              label="Regular expression"
              value={pattern}
              onChange={setPattern}
              invalid={!!result.error}
            />
          </div>
          <span className="text-muted pb-2.5 font-mono text-lg">/{flags}</span>
        </div>
        <Toolbar>
          {FLAGS.map((f) => (
            <Checkbox
              key={f.flag}
              label={f.label}
              checked={flags.includes(f.flag)}
              onChange={() => toggleFlag(f.flag)}
            />
          ))}
        </Toolbar>
        <div className="flex flex-wrap gap-2">
          <span className="text-muted self-center text-xs font-semibold tracking-wide uppercase">
            Try:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => (setPattern(p.pattern), setFlags(p.flags))}
              className="border-line text-muted hover:border-accent/50 hover:text-fg rounded-full border px-3 py-1 text-xs"
            >
              {p.label}
            </button>
          ))}
        </div>
        {result.error ? (
          <Note tone="error">✗ {result.error}</Note>
        ) : (
          <Note tone={result.matches.length ? 'ok' : 'muted'}>
            {result.matches.length} match{result.matches.length === 1 ? '' : 'es'}
            {result.matches.length >= 1000 && ' (showing the first 1,000)'}
          </Note>
        )}
        <TextArea label="Test text" value={text} onChange={setText} rows={7} />
        <section aria-label="Highlighted matches" className="card p-4">
          <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap [font-variant-ligatures:none]">
            {segments.map((s, i) =>
              s.match === undefined ? (
                <Fragment key={i}>{s.text}</Fragment>
              ) : (
                <mark
                  key={i}
                  className={`rounded px-0.5 text-inherit ${s.match % 2 ? 'bg-cyan-400/35' : 'bg-violet-400/35'}`}
                >
                  {s.text}
                </mark>
              ),
            )}
          </pre>
        </section>
        {result.matches.length > 0 && result.matches.some((m) => m.groups.length) && (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="text-muted px-4 pt-3 text-left text-xs font-semibold tracking-wide uppercase">
                Capture groups
              </caption>
              <thead>
                <tr className="border-line border-b">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Match</th>
                  <th className="px-4 py-2">Groups</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {result.matches.slice(0, 100).map((m, i) => (
                  <tr key={i} className="border-line border-b align-top last:border-0">
                    <td className="text-muted px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2 break-all">{m.text}</td>
                    <td className="px-4 py-2">
                      {m.named
                        ? Object.entries(m.named).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-accent-2">{k}</span>: {v ?? '—'}
                            </div>
                          ))
                        : m.groups.map((g, j) => (
                            <div key={j}>
                              <span className="text-accent-2">${j + 1}</span>: {g ?? '—'}
                            </div>
                          ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Input
          label="Replace with (optional — $1, $<name>, $& work)"
          value={replacement}
          onChange={setReplacement}
          placeholder="e.g. [$&]"
        />
        {replacement && (
          <TextArea label="Result after replace" value={replaced} readOnly rows={5} />
        )}
      </div>
      <aside aria-labelledby="cheats" className="card h-fit p-4 lg:sticky lg:top-24">
        <h2 id="cheats" className="mb-3 text-sm font-semibold">
          Cheat sheet
        </h2>
        <dl className="space-y-1.5 text-sm [font-variant-ligatures:none]">
          {CHEATS.map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="text-accent-2 w-24 shrink-0 font-mono text-xs leading-5">{k}</dt>
              <dd className="text-muted leading-5">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
