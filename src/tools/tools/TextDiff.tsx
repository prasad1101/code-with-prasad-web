import { diffChars, diffLines, diffWordsWithSpace, type Change } from 'diff'
import { useMemo, useState } from 'react'
import { Checkbox, Segmented, TextArea, Toolbar, TwoCol } from '../ui'

const LEFT = `function greet(name) {
  console.log("Hello " + name);
  return true;
}

greet("world");`

const RIGHT = `function greet(name, greeting = "Hello") {
  console.log(\`\${greeting}, \${name}!\`);
  return true;
}

greet("Prasad");`

const MODES = [
  { value: 'lines', label: 'Lines' },
  { value: 'words', label: 'Words' },
  { value: 'chars', label: 'Characters' },
] as const

type Row = { kind: 'same' | 'add' | 'del'; text: string; left?: number; right?: number }

/** Line diff as rows with old/new line numbers, like a unified diff view. */
function lineRows(changes: Change[]): Row[] {
  const rows: Row[] = []
  let l = 1
  let r = 1
  for (const c of changes) {
    const lines = c.value.replace(/\n$/, '').split('\n')
    for (const text of lines) {
      if (c.added) rows.push({ kind: 'add', text, right: r++ })
      else if (c.removed) rows.push({ kind: 'del', text, left: l++ })
      else rows.push({ kind: 'same', text, left: l++, right: r++ })
    }
  }
  return rows
}

/** Map line-diff chunks computed on lower-cased text back onto the original lines. */
function restoreCase(changes: Change[], left: string, right: string): Change[] {
  const l = left.split(/(?<=\n)/)
  const r = right.split(/(?<=\n)/)
  let li = 0
  let ri = 0
  return changes.map((c) => {
    const n = c.count ?? 0
    let value: string
    if (c.added) {
      value = r.slice(ri, ri + n).join('')
      ri += n
    } else if (c.removed) {
      value = l.slice(li, li + n).join('')
      li += n
    } else {
      value = l.slice(li, li + n).join('')
      li += n
      ri += n
    }
    return { ...c, value }
  })
}

export default function TextDiff() {
  const [left, setLeft] = useState(LEFT)
  const [right, setRight] = useState(RIGHT)
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('lines')
  const [ignoreWs, setIgnoreWs] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)

  const changes = useMemo(() => {
    if (mode === 'lines') {
      if (!ignoreCase) return diffLines(left, right, { ignoreWhitespace: ignoreWs })
      // diffLines has no ignoreCase: compare lower-cased copies, then show the original lines.
      const raw = diffLines(left.toLowerCase(), right.toLowerCase(), { ignoreWhitespace: ignoreWs })
      return restoreCase(raw, left, right)
    }
    if (mode === 'words') return diffWordsWithSpace(left, right, { ignoreCase })
    return diffChars(left, right, { ignoreCase })
  }, [left, right, mode, ignoreWs, ignoreCase])

  const stats = useMemo(() => {
    const count = (pred: (c: Change) => boolean) =>
      changes
        .filter(pred)
        .reduce((n, c) => n + (mode === 'lines' ? (c.count ?? 0) : c.value.length), 0)
    return { added: count((c) => !!c.added), removed: count((c) => !!c.removed) }
  }, [changes, mode])

  const identical = stats.added === 0 && stats.removed === 0
  const unit = mode === 'lines' ? 'lines' : 'characters'

  return (
    <div className="space-y-5">
      <TwoCol>
        <TextArea label="Original" value={left} onChange={setLeft} rows={10} />
        <TextArea label="Changed" value={right} onChange={setRight} rows={10} />
      </TwoCol>
      <Toolbar>
        <Segmented label="Compare by" value={mode} onChange={setMode} options={MODES} />
        {mode === 'lines' && (
          <Checkbox label="Ignore whitespace" checked={ignoreWs} onChange={setIgnoreWs} />
        )}
        <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        <p className="text-sm" aria-live="polite">
          {identical ? (
            <span className="text-emerald-500">✓ No differences</span>
          ) : (
            <>
              <span className="text-emerald-500">+{stats.added}</span>{' '}
              <span className="text-red-500">−{stats.removed}</span>{' '}
              <span className="text-muted">{unit}</span>
            </>
          )}
        </p>
      </Toolbar>

      <div className="card overflow-x-auto p-0 font-mono text-sm" aria-label="Differences">
        {mode === 'lines' ? (
          <table className="w-full border-collapse">
            <tbody>
              {lineRows(changes).map((row, i) => (
                <tr
                  key={i}
                  className={
                    row.kind === 'add'
                      ? 'bg-emerald-500/12'
                      : row.kind === 'del'
                        ? 'bg-red-500/12'
                        : ''
                  }
                >
                  <td className="text-muted w-10 px-2 text-right select-none">{row.left ?? ''}</td>
                  <td className="text-muted w-10 px-2 text-right select-none">{row.right ?? ''}</td>
                  <td
                    className={`w-5 text-center select-none ${
                      row.kind === 'add'
                        ? 'text-emerald-500'
                        : row.kind === 'del'
                          ? 'text-red-500'
                          : ''
                    }`}
                    aria-label={
                      row.kind === 'add' ? 'added' : row.kind === 'del' ? 'removed' : undefined
                    }
                  >
                    {row.kind === 'add' ? '+' : row.kind === 'del' ? '−' : ''}
                  </td>
                  <td className="px-2 py-0.5 whitespace-pre">{row.text || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="p-4 leading-relaxed whitespace-pre-wrap">
            {changes.map((c, i) =>
              c.added ? (
                <ins
                  key={i}
                  className="rounded bg-emerald-500/20 text-emerald-600 no-underline dark:text-emerald-300"
                >
                  {c.value}
                </ins>
              ) : c.removed ? (
                <del key={i} className="rounded bg-red-500/20 text-red-600 dark:text-red-300">
                  {c.value}
                </del>
              ) : (
                <span key={i}>{c.value}</span>
              ),
            )}
          </pre>
        )}
      </div>
    </div>
  )
}
